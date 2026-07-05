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

                // Kiểm tra token có bị revoked (đổi mật khẩu, khóa tk) không
                if (isTokenRevoked(jwt)) {
                    logger.warning("Token đã bị thu hồi cho: " + username);
                    chain.doFilter(request, response);
                    return;
                }

                // Kiểm tra token có bị vô hiệu hóa do đổi/reset password không
                if (!isTokenStillValid(jwt, username)) {
                    logger.warning("Token bị vô hiệu hóa do mật khẩu đã thay đổi: " + username);
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

        // Chuyển sang filter tiếp theo
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
     * Kiểm tra token có còn hợp lệ sau khi đổi/reset password không.
     * So sánh last_password_change trong token với giá trị hiện tại trong DB.
     */
    private final ConcurrentHashMap<String, Long> lpcCache = new ConcurrentHashMap<>();
    private static final long LPC_CACHE_TTL_MS = 30_000L;

    private boolean isTokenStillValid(String token, String username) {
        try {
            long tokenLpc = jwtUtil.extractLastPasswordChange(token);
            if (tokenLpc == 0) return true; // Token cũ không có claim này → cho qua

            Long cachedLpc = lpcCache.get(username);
            if (cachedLpc == null || System.currentTimeMillis() - cachedLpc > LPC_CACHE_TTL_MS) {
                Long dbLpc = jdbcTemplate.queryForObject(
                    "SELECT last_password_change FROM TaiKhoan WHERE ten_dang_nhap = ?",
                    Long.class, username
                );
                if (dbLpc != null) {
                    cachedLpc = dbLpc;
                    lpcCache.put(username, cachedLpc);
                }
            }

            if (cachedLpc == null) return true; // Không có trong DB → cho qua
            return tokenLpc >= cachedLpc; // Token phải được tạo SAU lần đổi password gần nhất
        } catch (Exception e) {
            logger.warning("Lỗi kiểm tra last_password_change: " + e.getMessage());
            return true; // DB lỗi → cho qua (fail-open cho availability)
        }
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
            // Nếu DB lỗi, TỪ CHỐI truy cập để đảm bảo bảo mật (fail-closed)
            logger.severe("Không thể kiểm tra trạng thái tài khoản (DB DOWN?): " + e.getMessage());
            return false;
        }
    }
}
