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

    // Báº¢O Máº¬T: Secret dÃ¹ng Ä‘á»ƒ xÃ¡c thá»±c Webhook tá»« SePay/Casso/PayOS
    // Cáº¥u hÃ¬nh trong application.properties: webhook.secret=YOUR_SECRET
    @org.springframework.beans.factory.annotation.Value("${webhook.secret:rexi_webhook_secret_2026}")
    private String webhookSecret;

    // =========================================================================
    // TÃCH Há»¢P VNPAY
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
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i táº¡o URL thanh toÃ¡n: " + e.getMessage()));
        }
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<?> paymentReturn(@RequestParam Map<String, String> queryParams) {
        try {
            String vnp_SecureHash = queryParams.get("vnp_SecureHash");
            if (vnp_SecureHash == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Thiáº¿u chá»¯ kÃ½", "success", false));
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
                            "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), ?, 'VNPay', N'ThÃ nh cÃ´ng')",
                            idHoaDon, amountPaid);
                    return ResponseEntity.ok(Map.of("message", "Thanh toÃ¡n thÃ nh cÃ´ng!", "success", true));
                }
                return ResponseEntity.ok(Map.of("message", "Giao dá»‹ch tháº¥t báº¡i.", "success", false));
            }
            return ResponseEntity.status(400).body(Map.of("message", "Chá»¯ kÃ½ sai!", "success", false));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i: " + e.getMessage(), "success", false));
        }
    }

    // =========================================================================
    // Cáº¤U HÃŒNH TÃ€I KHOáº¢N NGÃ‚N HÃ€NG NHáº¬N TIá»€N (VIETQR)
    // =========================================================================
    // Sáº¿p hÃ£y thay Ä‘á»•i cÃ¡c thÃ´ng tin bÃªn dÆ°á»›i thÃ nh cá»§a sáº¿p:
    private static final String BANK_ID = "MB"; // MÃ£ ngÃ¢n hÃ ng (VD: MB, VCB, TCB, ICB...)
    private static final String ACCOUNT_NO = "***REMOVED***"; // Sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng cá»§a sáº¿p
    private static final String ACCOUNT_NAME = "TRAN MINH HOANG"; // TÃªn chá»§ TK khÃ´ng dáº¥u

    // API Táº¡o mÃ£ VietQR Ä‘á»™ng (NhÃºng sáºµn sá»‘ tiá»n vÃ  ná»™i dung)
    @PostMapping("/vietqr/generate")
    public ResponseEntity<?> generateVietQR(@RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("id_hoa_don") == null || payload.get("amount") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiáº¿u thÃ´ng tin id_hoa_don hoáº·c amount!"));
            }

            String idHoaDon = payload.get("id_hoa_don").toString();
            String amount = payload.get("amount").toString();

            // Ná»™i dung chuyá»ƒn khoáº£n chuáº©n: REXI HD + ID HÃ³a Ä‘Æ¡n
            // VÃ­ dá»¥: REXI HD123
            String addInfo = "REXI HD" + idHoaDon;

            // Sá»­ dá»¥ng API vietqr.io (Miá»…n phÃ­) Ä‘á»ƒ sinh URL áº£nh QR
            // Máº«u compact2 lÃ  máº«u tá»‘i giáº£n, hiá»‡n Ä‘áº¡i
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
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i táº¡o mÃ£ VietQR: " + e.getMessage()));
        }
    }

    // API Webhook - Há»‡ thá»‘ng tá»± Ä‘á»™ng gáº¡ch ná»£ (Há»©ng tá»« PayOS / SePay / Casso)
    @PostMapping("/vietqr/webhook")
    public ResponseEntity<?> vietqrWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String receivedSecret) {
        try {
            // Báº¢O Máº¬T Lá»šP 1: XÃ¡c thá»±c chá»¯ kÃ½ bÃ­ máº­t tá»« SePay/Casso
            // Náº¿u khÃ´ng khá»›p â†’ tá»« chá»‘i ngay, khÃ´ng xá»­ lÃ½ gÃ¬ cáº£
            if (receivedSecret == null || !receivedSecret.equals(webhookSecret)) {
                System.err.println("âš ï¸ Webhook bá»‹ tá»« chá»‘i: Sai hoáº·c thiáº¿u X-Webhook-Secret!");
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            System.out.println("ðŸ“© Nháº­n Webhook há»£p lá»‡: " + payload);

            // BÃ³c tÃ¡ch ná»™i dung chuyá»ƒn khoáº£n linh hoáº¡t (Há»— trá»£ PayOS / SePay / Casso)
            String content = "";
            java.math.BigDecimal soTien = java.math.BigDecimal.ZERO;

            if (payload.containsKey("data")) { // Cáº¥u trÃºc PayOS
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                content = String.valueOf(data.getOrDefault("description", ""));
                if (data.get("amount") != null) {
                    soTien = new java.math.BigDecimal(data.get("amount").toString());
                }
            } else { // Cáº¥u trÃºc SePay / Casso
                content = payload.containsKey("content") ? String.valueOf(payload.get("content"))
                        : String.valueOf(payload.getOrDefault("transactionContent", ""));
                // FIX Lá»–I: Láº¥y sá»‘ tiá»n tháº­t thay vÃ¬ hardcode 0
                Object amt = payload.containsKey("transferAmount") ? payload.get("transferAmount")
                        : payload.getOrDefault("amount", "0");
                if (amt != null) soTien = new java.math.BigDecimal(amt.toString());
            }

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Bá» qua: khÃ´ng cÃ³ ná»™i dung"));
            }

            content = content.toUpperCase();

            // Regex báº¯t mÃ£ hÃ³a Ä‘Æ¡n trong ná»™i dung (REXI HD123, REXIHD 123, REXIHD123...)
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("REXI\\s*HD\\s*(\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(content);

            if (matcher.find()) {
                String idHoaDon = matcher.group(1);
                int updated = jdbcTemplate.update(
                        "UPDATE HoaDon SET trang_thai = 'da_thanh_toan' WHERE id_hoa_don = ? AND trang_thai = 'cho_thanh_toan'",
                        idHoaDon);

                if (updated > 0) {
                    // FIX Lá»–I: Ghi sá»‘ tiá»n tháº­t vÃ o lá»‹ch sá»­ thay vÃ¬ hardcode 0
                    final java.math.BigDecimal finalSoTien = soTien;
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), ?, 'VietQR', N'ThÃ nh cÃ´ng')",
                            idHoaDon, finalSoTien);
                    System.out.println("âœ… Gáº CH Ná»¢ THÃ€NH CÃ”NG: HÃ³a Ä‘Æ¡n #" + idHoaDon + " | Sá»‘ tiá»n: " + finalSoTien);
                }
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("âŒ Lá»—i xá»­ lÃ½ Webhook: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false));
        }
    }
}
