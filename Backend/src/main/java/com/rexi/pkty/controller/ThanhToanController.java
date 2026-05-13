package com.rexi.pkty.controller;

import com.rexi.pkty.config.CauHinhVNPay;
import com.rexi.pkty.service.DichVuNhatKyKiemTra;
import com.rexi.pkty.service.DichVuZalo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/thanh-toan")
public class ThanhToanController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DichVuZalo zaloService;

    @Autowired
    private DichVuNhatKyKiemTra auditLogService;

    // API Tạo URL thanh toán VNPay
    @PostMapping("/vnpay/create")
    public ResponseEntity<?> createPayment(HttpServletRequest req, @RequestBody Map<String, Object> payload) {
        try {
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String vnp_OrderInfo = "Thanh toan hoa don Rexi";
            String vnp_OrderType = "other";
            String vnp_TxnRef = String.valueOf(payload.get("id_hoa_don")) + "_" + CauHinhVNPay.getRandomNumber(8);
            String vnp_IpAddr = CauHinhVNPay.getIpAddress(req);
            String vnp_TmnCode = CauHinhVNPay.vnp_TmnCode;

            long amount = ((Number) payload.get("amount")).longValue() * 100;
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
            vnp_Params.put("vnp_OrderType", vnp_OrderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", CauHinhVNPay.vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            String queryUrl = query.toString();
            String vnp_SecureHash = CauHinhVNPay.hmacSHA512(CauHinhVNPay.vnp_HashSecret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
            String paymentUrl = CauHinhVNPay.vnp_PayUrl + "?" + queryUrl;

            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tạo URL thanh toán: " + e.getMessage()));
        }
    }

    // API Xử lý kết quả từ VNPay (IPN)
    @GetMapping("/vnpay/return")
    public ResponseEntity<?> vnpayReturn(@RequestParam Map<String, String> queryParams) {
        String vnp_HashSecret = CauHinhVNPay.vnp_HashSecret;
        try {
            String vnp_SecureHash = queryParams.get("vnp_SecureHash");
            if (vnp_SecureHash == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu chữ ký", "success", false));
            queryParams.remove("vnp_SecureHash");
            queryParams.remove("vnp_SecureHashType");
            String signValue = CauHinhVNPay.hashAllFields(queryParams, vnp_HashSecret);
            if (signValue.equals(vnp_SecureHash)) {
                if ("00".equals(queryParams.get("vnp_ResponseCode"))) {
                    String idHoaDon = queryParams.get("vnp_TxnRef").split("_")[0];
                    java.math.BigDecimal amountPaid = new java.math.BigDecimal(queryParams.get("vnp_Amount"))
                            .divide(new java.math.BigDecimal(100));
                    jdbcTemplate.update("UPDATE HoaDon SET trang_thai = 'DA_THANH_TOAN' WHERE id_hoa_don = ?",
                            idHoaDon);
                    jdbcTemplate.update(
                            "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), ?, 'VNPay', 'THANH_CONG')",
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
    private static final String BANK_ID = "MB"; 
    private static final String ACCOUNT_NO = "***REMOVED***-VIETQR_ACCOUNT_NO"; 
    private static final String ACCOUNT_NAME = "TRAN MINH HOANG"; 

    @PostMapping("/vietqr/generate")
    public ResponseEntity<?> generateVietQR(@RequestBody Map<String, Object> payload) {
        try {
            String idHoaDon = String.valueOf(payload.get("id_hoa_don"));
            String amount = String.valueOf(payload.get("amount"));
            String addInfo = "Thanh toan hoa don " + idHoaDon;

            String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    BANK_ID, ACCOUNT_NO, amount, URLEncoder.encode(addInfo, StandardCharsets.UTF_8),
                    URLEncoder.encode(ACCOUNT_NAME, StandardCharsets.UTF_8));

            return ResponseEntity.ok(Map.of("qrUrl", qrUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tạo mã VietQR: " + e.getMessage()));
        }
    }

    // API Chuyển hướng kết quả thanh toán cho Frontend
    @GetMapping("/vnpay/callback")
    public void vnpayCallback(@RequestParam Map<String, String> queryParams, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        String vnp_ResponseCode = queryParams.get("vnp_ResponseCode");
        if ("00".equals(vnp_ResponseCode)) {
            response.sendRedirect("http://localhost:5173/payment-result?status=success&message=" + URLEncoder.encode("Thanh toán thành công", "UTF-8"));
        } else {
            response.sendRedirect("http://localhost:5173/payment-result?status=error&message=" + URLEncoder.encode("Thanh toán thất bại hoặc bị hủy", "UTF-8"));
        }
    }
}
