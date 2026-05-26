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

/** BỘ LỌC KIỂM SOÁT JWT TOKEN */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = Logger.getLogger(JwtFilter.class.getName());

    @Autowired(required = false)
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Lấy token từ header Authorization
        final String authHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // Token dạng: Bearer <token>
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                if (jwtUtil != null) {
                    username = jwtUtil.extractUsername(jwt);
                }
            } catch (Exception e) {
                logger.warning("Không thể đọc được Token: " + e.getMessage());
            }
        }

        // Check auth hiện tại trong Context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Validate token
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
