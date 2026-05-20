package com.rexi.pkty.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * BỘ LỌC KIỂM SOÁT TÁC VỤ AI (ACTION AUTH FILTER)
 * Kiểm tra phân quyền khi có yêu cầu AI thực hiện hành động dựa vào X-AI-ACTION header.
 */
@Component
public class ActionAuthFilter extends OncePerRequestFilter {

    @Value("#{${ai.action.policy}}")
    private Map<String, List<String>> policy;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private List<String> getAllowedActions(String roleStr) {
        try {
            if (jdbcTemplate != null) {
                String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'ai_action_policy'", String.class);
                if (dbVal != null && !dbVal.trim().isEmpty()) {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, List<String>> dbPolicy = mapper.readValue(dbVal.trim(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, List<String>>>() {});
                    if (dbPolicy != null) {
                        return dbPolicy.getOrDefault(roleStr, Collections.emptyList());
                    }
                }
            }
        } catch (Exception e) {
            // Lỗi hoặc không có cấu hình DB -> Fallback về file properties
        }
        return policy != null ? policy.getOrDefault(roleStr, Collections.emptyList()) : Collections.emptyList();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws IOException, ServletException {
        String actionsHeader = req.getHeader("X-AI-ACTION");
        
        if (actionsHeader != null && !actionsHeader.isEmpty()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String roleStr = "GUEST";
            if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                roleStr = auth.getAuthorities().stream()
                        .findFirst()
                        .map(GrantedAuthority::getAuthority)
                        .orElse("ROLE_GUEST")
                        .replace("ROLE_", "")
                        .toLowerCase();
            }

            List<String> allowed = getAllowedActions(roleStr);
            
            String[] tags = actionsHeader.split(",");
            for (String tag : tags) {
                String baseTag = tag.split(":")[0].trim();
                if (!allowed.contains(baseTag)) {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json; charset=UTF-8");
                    res.getWriter().write("{\"message\":\"Bạn không có quyền thực hiện hành động " + baseTag + ".\"}");
                    return;
                }
            }
        }
        
        chain.doFilter(req, res);
    }
}
