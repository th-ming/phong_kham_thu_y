package com.rexi.pkty.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

@Component
public class GlobalDataChangeInterceptor implements HandlerInterceptor {

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        if (messagingTemplate == null || ex != null || !isSuccessfulMutation(request, response)) {
            return;
        }

        String uri = request.getRequestURI();
        messagingTemplate.convertAndSend("/topic/data-changes", Map.of(
                "resource", inferResource(uri),
                "action", "global-refresh",
                "method", request.getMethod(),
                "path", uri,
                "timestamp", System.currentTimeMillis()));
    }

    private boolean isSuccessfulMutation(HttpServletRequest request, HttpServletResponse response) {
        String method = request.getMethod();
        if (!("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method))) {
            return false;
        }

        int status = response.getStatus();
        if (status < 200 || status >= 300) {
            return false;
        }

        String uri = request.getRequestURI();
        return uri.startsWith("/api/")
                && !uri.startsWith("/api/auth/")
                && !uri.startsWith("/api/chat")
                && !uri.startsWith("/api/agent")
                && !uri.startsWith("/api/client-errors");
    }

    private String inferResource(String uri) {
        String[] parts = uri.split("/");
        return parts.length > 2 ? parts[2] : "global";
    }
}
