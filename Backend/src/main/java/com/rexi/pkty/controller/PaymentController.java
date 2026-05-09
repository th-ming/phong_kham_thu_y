package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rexi.pkty.config.VNPayConfig;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class PaymentController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // BẢO MẬT: Secret dùng để xác thực Webhook từ SePay/Casso/PayOS
    // Cấu hình trong application.properties: webhook.secret=YOUR_SECRET
    @org.springframework.beans.factory.annotation.Value("${webhook.secret:rexi_webhook_secret_2026}")
    private String webhookSecret;

    // =========================================================================
    // TÍCH HỢP VNPAY
    // =========================================================================
    @org.springframework.beans.factory.annotation.Value("${vnpay.tmn.code:YOUR_VNPAY_TMN_CODE}")
    private String vnp_TmnCode;

    @org.springframework.beans.factory.annotation.Value("${vnpay.hash.secret:YOUR_VNPAY_HASH_SECRET}")
    private String vnp_HashSecret;

    @org.springframework.beans.factory.annotation.Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnp_Url;

    @org.springframework.beans.factory.annotation.Value("${vnpay.return.url:http://localhost:5173/khach-hang/hoa-don-thanh-toan}")
    private String vnp_ReturnUrl;

    @PostMapping("/vnpay/create-url")
    public ResponseEntity<?> createPaymentUrl(@RequestBody Map<String, Object> payload) {
        try {
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String orderType = "other";
            long amount = Long.parseLong(payload.get("amount").toString()) * 100;
            String vnp_TxnRef = payload.get("id_hoa_don").toString() + "_" + System.currentTimeMillis();
            String vnp_IpAddr = "127.0.0.1";

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan hoa don Rexi Vet HD" + payload.get("id_hoa_don"));
            vnp_Params.put("vnp_OrderType", orderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            String queryUrl = VNPayConfig.hashAllFields(vnp_Params, vnp_HashSecret);
            String paymentUrl = vnp_Url + "?" + queryUrl;

            return ResponseEntity.ok(Map.of("url", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tạo URL thanh toán: " + e.getMessage()));
        }
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<?> paymentReturn(@RequestParam Map<String, String> queryParams) {
        try {
            String vnp_SecureHash = queryParams.get("vnp_SecureHash");
            if (vnp_SecureHash == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu chữ ký", "success", false));
            queryParams.remove("vnp_SecureHash");
            queryParams.remove("vnp_SecureHashType");
            String signValue = VNPayConfig.hashAllFields(queryParams, vnp_HashSecret);
            if (signValue.equals(vnp_SecureHash)) {
                if ("00".equals(queryParams.get("vnp_ResponseCode"))) {
                    String idHoaDon = queryParams.get("vnp_TxnRef").split("_")[0];
                    java.math.BigDecimal amountPaid = new java.math.BigDecimal(queryParams.get("vnp_Amount"))
                            .divide(new java.math.BigDecimal(100));
                    jdbcTemplate.update("UPDATE HoaDon SET trang_thai = 'da_thanh_toan' WHERE id_hoa_don = ?",
                            idHoaDon);
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), ?, 'VNPay', N'Thành công')",
                            idHoaDon, amountPaid);
                    return ResponseEntity.ok(Map.of("message", "Thanh toán thành công!", "success", true));
                }
                return ResponseEntity.ok(Map.of("message", "Giao dịch thất bại.", "success", false));
            }
            return ResponseEntity.status(400).body(Map.of("message", "Chữ ký sai!", "success", false));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage(), "success", false));
        }
    }

    // =========================================================================
    // CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN (VIETQR)
    // =========================================================================
    // Sếp hãy thay đổi các thông tin bên dưới thành của sếp:
    private static final String BANK_ID = "MB"; // Mã ngân hàng (VD: MB, VCB, TCB, ICB...)
    private static final String ACCOUNT_NO = "***REMOVED***"; // Số tài khoản ngân hàng của sếp
    private static final String ACCOUNT_NAME = "TRAN MINH HOANG"; // Tên chủ TK không dấu

    // API Tạo mã VietQR động (Nhúng sẵn số tiền và nội dung)
    @PostMapping("/vietqr/generate")
    public ResponseEntity<?> generateVietQR(@RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("id_hoa_don") == null || payload.get("amount") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin id_hoa_don hoặc amount!"));
            }

            String idHoaDon = payload.get("id_hoa_don").toString();
            String amount = payload.get("amount").toString();

            // Nội dung chuyển khoản chuẩn: REXI HD + ID Hóa đơn
            // Ví dụ: REXI HD123
            String addInfo = "REXI HD" + idHoaDon;

            // Sử dụng API vietqr.io (Miễn phí) để sinh URL ảnh QR
            // Mẫu compact2 là mẫu tối giản, hiện đại
            String qrUrl = String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    BANK_ID, ACCOUNT_NO, amount,
                    URLEncoder.encode(addInfo, StandardCharsets.UTF_8),
                    URLEncoder.encode(ACCOUNT_NAME, StandardCharsets.UTF_8));

            return ResponseEntity.ok(Map.of(
                    "qr_url", qrUrl,
                    "add_info", addInfo,
                    "amount", amount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tạo mã VietQR: " + e.getMessage()));
        }
    }

    // API Webhook - Hệ thống tự động gạch nợ (Hứng từ PayOS / SePay / Casso)
    @PostMapping("/vietqr/webhook")
    public ResponseEntity<?> vietqrWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String receivedSecret) {
        try {
            // BẢO MẬT LỚP 1: Xác thực chữ ký bí mật từ SePay/Casso
            // Nếu không khớp → từ chối ngay, không xử lý gì cả
            if (receivedSecret == null || !receivedSecret.equals(webhookSecret)) {
                System.err.println("⚠️ Webhook bị từ chối: Sai hoặc thiếu X-Webhook-Secret!");
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            System.out.println("📩 Nhận Webhook hợp lệ: " + payload);

            // Bóc tách nội dung chuyển khoản linh hoạt (Hỗ trợ PayOS / SePay / Casso)
            String content = "";
            java.math.BigDecimal soTien = java.math.BigDecimal.ZERO;

            if (payload.containsKey("data")) { // Cấu trúc PayOS
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                content = String.valueOf(data.getOrDefault("description", ""));
                if (data.get("amount") != null) {
                    soTien = new java.math.BigDecimal(data.get("amount").toString());
                }
            } else { // Cấu trúc SePay / Casso
                content = payload.containsKey("content") ? String.valueOf(payload.get("content"))
                        : String.valueOf(payload.getOrDefault("transactionContent", ""));
                // FIX LỖI: Lấy số tiền thật thay vì hardcode 0
                Object amt = payload.containsKey("transferAmount") ? payload.get("transferAmount")
                        : payload.getOrDefault("amount", "0");
                if (amt != null) soTien = new java.math.BigDecimal(amt.toString());
            }

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Bỏ qua: không có nội dung"));
            }

            content = content.toUpperCase();

            // Regex bắt mã hóa đơn trong nội dung (REXI HD123, REXIHD 123, REXIHD123...)
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("REXI\\s*HD\\s*(\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(content);

            if (matcher.find()) {
                String idHoaDon = matcher.group(1);
                int updated = jdbcTemplate.update(
                        "UPDATE HoaDon SET trang_thai = 'da_thanh_toan' WHERE id_hoa_don = ? AND trang_thai = 'cho_thanh_toan'",
                        idHoaDon);

                if (updated > 0) {
                    // FIX LỖI: Ghi số tiền thật vào lịch sử thay vì hardcode 0
                    final java.math.BigDecimal finalSoTien = soTien;
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), ?, 'VietQR', N'Thành công')",
                            idHoaDon, finalSoTien);
                    System.out.println("✅ GẠCH NỢ THÀNH CÔNG: Hóa đơn #" + idHoaDon + " | Số tiền: " + finalSoTien);
                }
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý Webhook: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false));
        }
    }
}
