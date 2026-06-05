package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class ThongBaoController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // 1. API lấy danh sách thông báo của một tài khoản (sắp xếp mới nhất lên đầu)
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public org.springframework.http.ResponseEntity<?> getNotificationsByUserId(@PathVariable String userId) {
        try {
            AccountAccess currentAccount = getCurrentAccount();
            if (!currentAccount.canAccessAccount(userId)) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Bạn không có quyền xem thông báo của tài khoản này.", "success", false));
            }

            String sql = "SELECT id_thong_bao, id_tai_khoan, tieu_de, noi_dung, loai_thong_bao, da_doc, ngay_tao " +
                         "FROM ThongBao WHERE id_tai_khoan = ? ORDER BY ngay_tao DESC";
            java.util.List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, userId);
            return org.springframework.http.ResponseEntity.ok(list);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi lấy thông báo: " + e.getMessage(), "success", false));
        }
    }

    // 2. API đánh dấu thông báo là ĐÃ ĐỌC
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public org.springframework.http.ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            java.util.List<String> ownerIds = jdbcTemplate.queryForList(
                    "SELECT id_tai_khoan FROM ThongBao WHERE id_thong_bao = ?",
                    String.class,
                    id
            );
            if (ownerIds.isEmpty()) {
                return org.springframework.http.ResponseEntity.status(404)
                        .body(Map.of("message", "Không tìm thấy thông báo", "success", false));
            }
            AccountAccess currentAccount = getCurrentAccount();
            if (!currentAccount.canAccessAccount(ownerIds.get(0))) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Bạn không có quyền cập nhật thông báo này.", "success", false));
            }

            String sql = "UPDATE ThongBao SET da_doc = true WHERE id_thong_bao = ?";
            int updatedRows = jdbcTemplate.update(sql, id);
            if (updatedRows > 0) {
                return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã đánh dấu đọc thành công", "success", true));
            }
            return org.springframework.http.ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thông báo", "success", false));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi cập nhật thông báo: " + e.getMessage(), "success", false));
        }
    }

    // Trigger broadcast notification toi tat ca clients
    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
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

    private AccountAccess getCurrentAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return AccountAccess.denied();
        }

        java.util.List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id_tai_khoan, id_vai_tro FROM TaiKhoan WHERE ten_dang_nhap = ?",
                auth.getName()
        );
        if (rows.isEmpty()) {
            return AccountAccess.denied();
        }

        Map<String, Object> row = rows.get(0);
        String accountId = row.get("id_tai_khoan") != null ? row.get("id_tai_khoan").toString() : "";
        String roleId = row.get("id_vai_tro") != null ? row.get("id_vai_tro").toString() : "";
        String authorities = auth.getAuthorities() != null ? auth.getAuthorities().toString() : "";
        return new AccountAccess(accountId, roleId, authorities);
    }

    private record AccountAccess(String accountId, String roleId, String authorities) {
        static AccountAccess denied() {
            return new AccountAccess("", "", "");
        }

        boolean canAccessAccount(String targetAccountId) {
            if (targetAccountId == null || targetAccountId.isBlank()) {
                return false;
            }
            return targetAccountId.equalsIgnoreCase(accountId) || isAdminOrManager();
        }

        private boolean isAdminOrManager() {
            String role = (roleId + " " + authorities).toUpperCase();
            return role.contains("ADMIN") || role.contains("QUAN_LY") || role.contains("VT-1") || role.contains("VT-6") || role.contains("VT-QL");
        }
    }
}
