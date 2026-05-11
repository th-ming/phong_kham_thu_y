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
 * Bá»˜ Lá»ŒC KIá»‚M SOÃT JWT (THáºº BÃ€I)
 * - Cháº·n má»i yÃªu cáº§u gá»­i Ä‘áº¿n server Ä‘á»ƒ kiá»ƒm tra Token
 * - Náº¿u Token há»£p lá»‡, há»‡ thá»‘ng sáº½ cáº¥p quyá»n cho ngÆ°á»i dÃ¹ng truy cáº­p API
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = Logger.getLogger(JwtFilter.class.getName());

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Láº¥y mÃ£ Token tá»« Header "Authorization"
        final String authHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // Token pháº£i báº¯t Ä‘áº§u báº±ng chá»¯ "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warning("KhÃ´ng thá»ƒ Ä‘á»c Ä‘Æ°á»£c Token: " + e.getMessage());
            }
        }

        // Náº¿u cÃ³ tÃªn ngÆ°á»i dÃ¹ng vÃ  chÆ°a Ä‘Æ°á»£c xÃ¡c thá»±c trong phiÃªn lÃ m viá»‡c nÃ y
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Kiá»ƒm tra tÃ­nh há»£p lá»‡ cá»§a Token
            if (jwtUtil.validateToken(jwt, username)) {
                String role = jwtUtil.extractRole(jwt);
                
                // Chuyá»ƒn Ä‘á»•i vai trÃ² tá»« Token sang quyá»n háº¡n cá»§a Spring Security (ThÃªm tiá»n tá»‘ ROLE_)
                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
                if (role != null && !role.isEmpty()) {
                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
                }

                // Thiáº¿t láº­p thÃ´ng tin xÃ¡c thá»±c vÃ o há»‡ thá»‘ng
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                
                logger.info("XÃ¡c thá»±c thÃ nh cÃ´ng cho: " + username + " (Quyá»n: " + role + ")");
            }
        }
        
        // Tiáº¿p tá»¥c cho phÃ©p yÃªu cáº§u Ä‘i tiáº¿p qua cÃ¡c bá»™ lá»c khÃ¡c
        chain.doFilter(request, response);
    }
}

