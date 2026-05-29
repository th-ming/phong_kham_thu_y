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
import java.util.logging.Logger;

/** BỘ LỌC KIỂM SOÁT JWT TOKEN — đọc cookie trước, fallback sang Bearer header */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = Logger.getLogger(JwtFilter.class.getName());

    @Autowired(required = false)
    private JwtUtil jwtUtil;

    @Autowired(required = false)
    private CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String jwt = null;

        // Ưu tiên đọc token từ httpOnly cookie (bảo mật hơn)
        if (cookieUtil != null) {
            jwt = cookieUtil.getAccessTokenFromCookie(request);
        }

        // Fallback: đọc từ Authorization header (backward-compatible cho mobile/API client)
        if (jwt == null) {
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }

        String username = null;
        if (jwt != null && jwtUtil != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warning("Không thể đọc được Token: " + e.getMessage());
            }
        }

        // Inject vào SecurityContext nếu token hợp lệ và chưa có auth
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil != null && jwtUtil.validateToken(jwt, username)) {
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
}
