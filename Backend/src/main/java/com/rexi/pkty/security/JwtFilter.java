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

/**
 * BỘ LỌC KIỂM SOÁT JWT (THẺ BÀI)
 * - Chặn mọi yêu cầu gửi đến server để kiểm tra Token
 * - Nếu Token hợp lệ, hệ thống sẽ cấp quyền cho người dùng truy cập API
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = Logger.getLogger(JwtFilter.class.getName());

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Lấy mã Token từ Header "Authorization"
        final String authHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // Token phải bắt đầu bằng chữ "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warning("Không thể đọc được Token: " + e.getMessage());
            }
        }

        // Nếu có tên người dùng và chưa được xác thực trong phiên làm việc này
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Kiểm tra tính hợp lệ của Token
            if (jwtUtil.validateToken(jwt, username)) {
                String role = jwtUtil.extractRole(jwt);
                
                // Chuyển đổi vai trò từ Token sang quyền hạn của Spring Security (Thêm tiền tố ROLE_)
                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
                if (role != null && !role.isEmpty()) {
                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
                }

                // Thiết lập thông tin xác thực vào hệ thống
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                
                logger.info("Xác thực thành công cho: " + username + " (Quyền: " + role + ")");
            }
        }
        
        // Tiếp tục cho phép yêu cầu đi tiếp qua các bộ lọc khác
        chain.doFilter(request, response);
    }
}
