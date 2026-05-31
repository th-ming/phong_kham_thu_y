package com.rexi.pkty.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/** LỌC KIỂM SOÁT JWT TOKEN — đọc cookie trước, fallback sang Bearer header */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = Logger.getLogger(JwtFilter.class.getName());

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CookieUtil cookieUtil;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /** Cache token revoked: token -> thời gian revoked (millis) */
    private static final ConcurrentHashMap<String, Long> revokedTokens = new ConcurrentHashMap<>();
    private static final long REVOKED_CACHE_TTL_MS = 30 * 60 * 1000L; // 30 phút

    /**
       Đánh dấu token là revoked. Gọi từ AuthController khi đổi mật khẩu / khóa tài khoản.
     */
    public static void revokeToken(String token) {
        revokedTokens.put(token, System.currentTimeMillis());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String jwt = null;

        // Ưu tiên đọc token từ httpOnly cookie 
        jwt = cookieUtil.getAccessTokenFromCookie(request);

        // Fallback: đọc từ Authorization header (backward-compatible cho mobile/API client)
        if (jwt == null) {
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }

        String username = null;
        if (jwt != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warning("Không thể đọc được Token: " + e.getMessage());
            }
        }

        // Inject vào SecurityContext nếu token hợp lệ và chưa có auth
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(jwt, username)) {

                // Kiểm tra token có bị revoked (đổi mật khẩu, khóa tk) ko
                if (isTokenRevoked(jwt)) {
                    logger.warning("Token đã bị thu hồi cho: " + username);
                    chain.doFilter(request, response);
                    return;
                }

                // Kiểm tra trạng thái tài khoản từ DB
                if (!isAccountActive(username)) {
                    logger.warning("Tài khoản không hoạt động, từ chối token: " + username);
                    chain.doFilter(request, response);
                    return;
                }

                String role = jwtUtil.extractRole(jwt);

                // Ép SimpleGrantedAuthority kèm tiền tố ROLE_
                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
                if (role != null && !role.isEmpty()) {
                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
                }

                // Inject auth vào SecurityContextHolder
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                logger.info("Xác thực thành công cho: " + username + " (Quyền: " + role + ")");
            }
        }

        // Pass sang filter tiếp theo
        chain.doFilter(request, response);
    }

    /**
     * Kiểm tra token có bị thu hồi không. Dọn dẹp cache cũ.
     */
    private boolean isTokenRevoked(String token) {
        Long revokedTime = revokedTokens.get(token);
        if (revokedTime == null) return false;

        // Dọn dẹp cache nếu quá hạn
        if (System.currentTimeMillis() - revokedTime > REVOKED_CACHE_TTL_MS) {
            revokedTokens.remove(token, revokedTime);
            return false;
        }
        return true;
    }

    /**
     * Kiểm tra trạng thái tài khoản trong DB có đang active không.
     * Cache ngắn (30s) để tránh quá tải DB.
     */
    private final ConcurrentHashMap<String, Long> accountStatusCache = new ConcurrentHashMap<>();
    private static final long ACCOUNT_CACHE_TTL_MS = 30_000L; // 30 giây

    private boolean isAccountActive(String username) {
        try {
            Long cachedTime = accountStatusCache.get(username);
            if (cachedTime != null && System.currentTimeMillis() - cachedTime < ACCOUNT_CACHE_TTL_MS) {
                return true; // Cache gần đây cho thấy active
            }

            String status = jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM TaiKhoan WHERE ten_dang_nhap = ?",
                String.class, username
            );

            boolean active = status == null
                || (!status.equalsIgnoreCase("Đã khóa") && !status.equalsIgnoreCase("inactive"));

            if (active) {
                accountStatusCache.put(username, System.currentTimeMillis());
            }
            return active;
        } catch (Exception e) {
            // Nếu DB lỗi, cho phép truy cập để tránh chặn nhầm (fail open)
            logger.warning("Không thể kiểm tra trạng thái tài khoản: " + e.getMessage());
            return true;
        }
    }
}
