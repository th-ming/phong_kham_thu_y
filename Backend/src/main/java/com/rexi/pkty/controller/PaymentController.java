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
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class PaymentController {

    private static final Logger logger = Logger.getLogger(PaymentController.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Map<String, Object> getInvoiceForPayment(String idHoaDon) {
        List<Map<String, Object>> invoices = jdbcTemplate.queryForList(
                "SELECT id_hoa_don, id_khach_hang, tong_tien_cuoi, trang_thai FROM HoaDon WHERE id_hoa_don = ?",
                idHoaDon);
        if (invoices.isEmpty()) {
            return null;
        }
        return invoices.get(0);
    }

    private ResponseEntity<?> validateInvoiceAccess(String idHoaDon) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để thanh toán hóa đơn."));
        }

        String authorities = auth.getAuthorities().toString().toUpperCase();
        if (authorities.contains("ADMIN") || authorities.contains("QUAN_LY") || authorities.contains("KE_TOAN")
                || authorities.contains("KETOAN") || authorities.contains("STAFF")) {
            return null;
        }

        List<String> customerIds = jdbcTemplate.queryForList(
                "SELECT id_khach_hang FROM TaiKhoan WHERE ten_dang_nhap = ?", String.class, auth.getName());
        if (customerIds.isEmpty() || customerIds.get(0) == null) {
            return ResponseEntity.status(403).body(Map.of("message", "Tài khoản không có quyền thanh toán hóa đơn này."));
        }

        List<String> ownerIds = jdbcTemplate.queryForList(
                "SELECT id_khach_hang FROM HoaDon WHERE id_hoa_don = ?", String.class, idHoaDon);
        if (ownerIds.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hóa đơn."));
        }
        if (!customerIds.get(0).equals(ownerIds.get(0))) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền thanh toán hóa đơn của người khác."));
        }
        return null;
    }

    private ResponseEntity<?> validatePayableInvoice(String idHoaDon, java.math.BigDecimal paidAmount) {
        Map<String, Object> invoice = getInvoiceForPayment(idHoaDon);
        if (invoice == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hóa đơn.", "success", false));
        }

        String status = String.valueOf(invoice.get("trang_thai"));
        if ("DA_THANH_TOAN".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(Map.of("message", "Hóa đơn đã được thanh toán trước đó.", "success", true));
        }
        if (!"CHO_THANH_TOAN".equalsIgnoreCase(status) && !"DANG_THANH_TOAN".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("message", "Hóa đơn không ở trạng thái chờ thanh toán.", "success", false));
        }

        java.math.BigDecimal expectedAmount = (java.math.BigDecimal) invoice.get("tong_tien_cuoi");
        if (expectedAmount == null || paidAmount == null || paidAmount.compareTo(expectedAmount) < 0) {
            return ResponseEntity.status(400).body(Map.of(
                    "message", "Số tiền thanh toán không đủ hoặc không khớp với hóa đơn.",
                    "success", false));
        }
        return null;
    }

    private ResponseEntity<?> lockInvoiceForVnPay(String idHoaDon) {
        // CHỈ cho phép chuyển từ CHO_THANH_TOAN -> DANG_THANH_TOAN.
        // Nếu đã là DANG_THANH_TOAN (do request trước lock rồi), sẽ trả về 409 ngay lập tức
        // => Chặn triệt để spam click / double submit khi mạng lag
        int locked = jdbcTemplate.update(
                "UPDATE HoaDon SET trang_thai = 'DANG_THANH_TOAN' " +
                        "WHERE id_hoa_don = ? AND trang_thai = 'CHO_THANH_TOAN'",
                idHoaDon);
        if (locked == 0) {
            // Kiểm tra hóa đơn đang ở trạng thái gì để trả về thông báo phù hợp
            List<String> statusList = jdbcTemplate.queryForList(
                    "SELECT trang_thai FROM HoaDon WHERE id_hoa_don = ?", String.class, idHoaDon);
            if (!statusList.isEmpty() && "DANG_THANH_TOAN".equalsIgnoreCase(statusList.get(0))) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Hóa đơn đang trong quá trình thanh toán. Vui lòng không bấm nhiều lần.", "code", "ALREADY_PROCESSING"));
            }
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Hóa đơn không còn ở trạng thái có thể thanh toán.", "code", "NOT_PAYABLE"));
        }
        return null;
    }

    @org.springframework.beans.factory.annotation.Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnp_Url;

    @org.springframework.beans.factory.annotation.Value("${vnpay.tmn.code:}")
    private String vnp_TmnCode;

    @org.springframework.beans.factory.annotation.Value("${vnpay.hash.secret:}")
    private String vnp_HashSecret;

    @org.springframework.beans.factory.annotation.Value("${vnpay.return.url:http://localhost:5173/khach-hang/hoa-don-thanh-toan}")
    private String vnp_ReturnUrl;

    @org.springframework.beans.factory.annotation.Value("${webhook.secret:}")
    private String webhookSecret;

    private String getVnpTmnCode() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vnpay_tmn_code'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return vnp_TmnCode;
    }

    private String getVnpHashSecret() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vnpay_hash_secret'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return vnp_HashSecret;
    }

    private String getVnpUrl() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vnpay_url'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return vnp_Url;
    }

    private String getVnpReturnUrl() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vnpay_return_url'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return vnp_ReturnUrl;
    }

    @PostMapping("/vnpay/create-url")
    public ResponseEntity<?> createPaymentUrl(@RequestBody Map<String, Object> payload, jakarta.servlet.http.HttpServletRequest request) {
        try {
            String idHoaDon = payload.get("id_hoa_don").toString();
            ResponseEntity<?> accessError = validateInvoiceAccess(idHoaDon);
            if (accessError != null) {
                return accessError;
            }
            // Check số tiền thật từ DB (chống tin FE)
            java.math.BigDecimal amountFromDb = jdbcTemplate.queryForObject(
                "SELECT tong_tien_cuoi FROM HoaDon WHERE id_hoa_don = ?", 
                java.math.BigDecimal.class, idHoaDon);
            
            if (amountFromDb == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hóa đơn!"));
            }

            ResponseEntity<?> payableError = validatePayableInvoice(idHoaDon, amountFromDb);
            if (payableError != null) {
                return payableError;
            }

            ResponseEntity<?> lockError = lockInvoiceForVnPay(idHoaDon);
            if (lockError != null) {
                return lockError;
            }

            long amount = amountFromDb.multiply(new java.math.BigDecimal(100)).longValue();
            
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String orderType = "other";
            String vnp_TxnRef = idHoaDon + "_" + System.currentTimeMillis();
            String vnp_IpAddr = request.getHeader("X-Forwarded-For");
            if (vnp_IpAddr == null || vnp_IpAddr.isEmpty()) {
                vnp_IpAddr = request.getRemoteAddr();
            } else {
                vnp_IpAddr = vnp_IpAddr.split(",")[0].trim();
            }

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", getVnpTmnCode());
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan hoa don Rexi Vet HD" + idHoaDon);
            vnp_Params.put("vnp_OrderType", orderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", getVnpReturnUrl());
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            String queryUrl = VNPayConfig.hashAllFields(vnp_Params, getVnpHashSecret());
            String paymentUrl = getVnpUrl() + "?" + queryUrl;

            return ResponseEntity.ok(Map.of("url", paymentUrl, "paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Đã xảy ra lỗi hệ thống khi khởi tạo thanh toán."));
        }
    }

    @GetMapping("/vnpay/return")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> paymentReturn(@RequestParam Map<String, String> queryParams) {
        try {
            String vnp_SecureHash = queryParams.get("vnp_SecureHash");
            if (vnp_SecureHash == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu chữ ký", "success", false));
            queryParams.remove("vnp_SecureHash");
            queryParams.remove("vnp_SecureHashType");
            String signValue = VNPayConfig.hashAllFields(queryParams, getVnpHashSecret());
            if (signValue.equals(vnp_SecureHash)) {
                if ("00".equals(queryParams.get("vnp_ResponseCode"))) {
                    String idHoaDon = queryParams.get("vnp_TxnRef").split("_")[0];
                    java.math.BigDecimal amountPaid = new java.math.BigDecimal(queryParams.get("vnp_Amount"))
                            .divide(new java.math.BigDecimal(100));

                    // Check amount trả có khớp/đủ với hóa đơn ko
                    java.math.BigDecimal amountExpected = jdbcTemplate.queryForObject(
                        "SELECT tong_tien_cuoi FROM HoaDon WHERE id_hoa_don = ?", 
                        java.math.BigDecimal.class, idHoaDon);

                    if (amountExpected == null || amountPaid.compareTo(amountExpected) < 0) {
                        return ResponseEntity.status(400).body(Map.of(
                            "message", "Cảnh báo bảo mật: Số tiền thanh toán không khớp với hóa đơn!",
                            "success", false));
                    }

                    int updated = jdbcTemplate.update("UPDATE HoaDon SET trang_thai = 'DA_THANH_TOAN' WHERE id_hoa_don = ? AND trang_thai IN ('CHO_THANH_TOAN', 'DANG_THANH_TOAN')",
                            idHoaDon);
                    if (updated == 0) {
                        return ResponseEntity.ok(Map.of("message", "Hóa đơn đã được xử lý trước đó.", "success", true));
                    }
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_thanh_toan, id_hoa_don, ngay_tra_tien, so_tien, phuong_thuc, ghi_chu) VALUES (?, ?, CURRENT_TIMESTAMP, ?, 'VNPay', 'Thanh toán VNPay thành công')",
                            "TT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(), idHoaDon, amountPaid);
                    return ResponseEntity.ok(Map.of("message", "Thanh toán thành công!", "success", true));
                }
                String idHoaDon = queryParams.get("vnp_TxnRef") != null ? queryParams.get("vnp_TxnRef").split("_")[0] : null;
                if (idHoaDon != null) {
                    jdbcTemplate.update("UPDATE HoaDon SET trang_thai = 'CHO_THANH_TOAN' WHERE id_hoa_don = ? AND trang_thai = 'DANG_THANH_TOAN'",
                            idHoaDon);
                }
                return ResponseEntity.ok(Map.of("message", "Giao dịch thất bại.", "success", false));
            }
            return ResponseEntity.status(400).body(Map.of("message", "Chữ ký sai!", "success", false));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Đã xảy ra lỗi hệ thống khi xử lý phản hồi thanh toán.", "success", false));
        }
    }

    // =========================================================================
    // CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN (VIETQR)
    // =========================================================================
    @org.springframework.beans.factory.annotation.Value("${vietqr.bank.id:MB}")
    private String BANK_ID;

    @org.springframework.beans.factory.annotation.Value("${vietqr.account.no:***REMOVED***-VIETQR_ACCOUNT_NO}")
    private String ACCOUNT_NO;

    @org.springframework.beans.factory.annotation.Value("${vietqr.account.name:***REMOVED***-VIETQR_ACCOUNT_NAME}")
    private String ACCOUNT_NAME;

    private String getVietQrBankId() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vietqr_bank_id'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return BANK_ID;
    }

    private String getVietQrAccountNo() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vietqr_account_no'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return ACCOUNT_NO;
    }

    private String getVietQrAccountName() {
        try {
            String dbVal = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'vietqr_account_name'", String.class);
            if (dbVal != null && !dbVal.trim().isEmpty()) return dbVal.trim();
        } catch (Exception e) {}
        return ACCOUNT_NAME;
    }

    // API Tạo mã VietQR động (Nhúng sẵn số tiền và nội dung)
    @PostMapping("/vietqr/generate")
    public ResponseEntity<?> generateVietQR(@RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("id_hoa_don") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin id_hoa_don hoặc amount!"));
            }

            String idHoaDon = payload.get("id_hoa_don").toString();
            ResponseEntity<?> accessError = validateInvoiceAccess(idHoaDon);
            if (accessError != null) {
                return accessError;
            }
            Map<String, Object> invoice = getInvoiceForPayment(idHoaDon);
            if (invoice == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hóa đơn."));
            }
            java.math.BigDecimal amountFromDb = (java.math.BigDecimal) invoice.get("tong_tien_cuoi");
            ResponseEntity<?> payableError = validatePayableInvoice(idHoaDon, amountFromDb);
            if (payableError != null) {
                return payableError;
            }
            String amount = amountFromDb.toPlainString();


            // Nội dung ck mẫu: REXI HD123
            String addInfo = "REXI " + idHoaDon;

            String qrUrl = String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    getVietQrBankId(), getVietQrAccountNo(), amount,
                    java.net.URLEncoder.encode(addInfo, java.nio.charset.StandardCharsets.UTF_8),
                    java.net.URLEncoder.encode(getVietQrAccountName(), java.nio.charset.StandardCharsets.UTF_8));

            return ResponseEntity.ok(Map.of(
                    "qr_url", qrUrl,
                    "add_info", addInfo,
                    "amount", amount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Đã xảy ra lỗi hệ thống khi tạo mã QR."));
        }
    }

    // Webhook VietQR tự động gạch nợ (PayOS / SePay / Casso)
    @PostMapping("/vietqr/webhook")
    @org.springframework.transaction.annotation.Transactional // Bọc transaction để tránh ghi trùng khi ngân hàng gọi webhook đồng thời
    public ResponseEntity<?> vietqrWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String receivedSecret) {
        try {
            // Check secret từ SePay/Casso (Unauthorized nếu sai)
            if (webhookSecret == null || webhookSecret.isBlank()
                    || receivedSecret == null || !receivedSecret.equals(webhookSecret)) {
                logger.warning("Webhook bị từ chối: Sai hoặc thiếu X-Webhook-Secret!");
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            logger.info("Nhận Webhook hợp lệ: " + payload);

            // Parse content ck linh hoạt (PayOS / SePay / Casso)
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

            // Regex tìm ID hóa đơn: REXI HD123, REXI 123...
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("REXI\\s*(HD-?[A-Z0-9]+|[0-9]+)");
            java.util.regex.Matcher matcher = pattern.matcher(content);

            if (matcher.find()) {
                String idHoaDon = matcher.group(1);
                ResponseEntity<?> payableError = validatePayableInvoice(idHoaDon, soTien);
                if (payableError != null) {
                    return payableError;
                }
                int updated = jdbcTemplate.update(
                        "UPDATE HoaDon SET trang_thai = 'DA_THANH_TOAN' WHERE id_hoa_don = ? AND trang_thai IN ('CHO_THANH_TOAN', 'DANG_THANH_TOAN')",
                        idHoaDon);

                if (updated > 0) {
                    // FIX LỖI: Ghi số tiền thật vào lịch sử thay vì hardcode 0
                    final java.math.BigDecimal finalSoTien = soTien;
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_thanh_toan, id_hoa_don, ngay_tra_tien, so_tien, phuong_thuc, ghi_chu) VALUES (?, ?, CURRENT_TIMESTAMP, ?, 'VietQR', 'Thanh toán VietQR thành công')",
                            "TT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(), idHoaDon, finalSoTien);
                    logger.info("GẠCH NỢ THÀNH CÔNG: Hóa đơn #" + idHoaDon + " | Số tiền: " + finalSoTien);
                }
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.severe("Lỗi xử lý Webhook: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false));
        }
    }
}
