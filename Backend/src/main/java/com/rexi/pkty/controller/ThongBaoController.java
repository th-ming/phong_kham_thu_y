package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class ThongBaoController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * API để trigger bắn thông báo tới tất cả các client đang kết nối (broadcast)
     */
    @PostMapping("/broadcast")
    public org.springframework.http.ResponseEntity<?> broadcastNotification(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("title", payload.getOrDefault("title", "Thông báo mới"));
            message.put("content", payload.getOrDefault("content", ""));
            message.put("type", payload.getOrDefault("type", "info"));
            message.put("timestamp", System.currentTimeMillis());

            // Bắn message tới topic "/topic/public"
            messagingTemplate.convertAndSend("/topic/public", message);

            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã gửi thông báo thành công", "success", true));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body(Map.of("message", "Lỗi khi gửi thông báo: " + e.getMessage(), "success", false));
        }
    }
}
