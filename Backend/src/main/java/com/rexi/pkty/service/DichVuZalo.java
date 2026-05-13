package com.rexi.pkty.service;

import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Dịch vụ gửi thông báo qua Zalo ZNS.
 */
@Service
public class DichVuZalo {

    // Điền thông tin từ Zalo Developer của sếp vào đây
    private final String ACCESS_TOKEN = "YOUR_ZALO_ACCESS_TOKEN";
    private final String TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // ID mẫu tin nhắn đã duyệt

    public void sendInvoiceZNS(String phone, String customerName, java.math.BigDecimal amount) {
        try {
            // Zalo yêu cầu SĐT theo chuẩn quốc tế (VD: 0912... -> 84912...)
            String formattedPhone = phone;
            if (phone.startsWith("0")) {
                formattedPhone = "84" + phone.substring(1);
            }

            // Dữ liệu truyền vào Mẫu tin nhắn (Phải khớp với biến đã khai báo trên Zalo)
            Map<String, Object> templateData = Map.of(
                    "name", customerName != null ? customerName : "Khách hàng",
                    "amount", amount.toString(),
                    "clinic_name", "Rexi Veterinary Clinic"
            );

            Map<String, Object> body = Map.of(
                    "phone", formattedPhone,
                    "template_id", TEMPLATE_ID,
                    "template_data", templateData
            );

            // Giả lập gửi API (Sếp cần đăng ký Zalo Cloud Service để có API thật)
            System.out.println("--- GỬI ZNS THÀNH CÔNG ---");
            System.out.println("Tới: " + formattedPhone);
            System.out.println("Nội dung: Chào " + customerName + ", hóa đơn của bạn là " + amount);

        } catch (Exception e) {
            System.err.println("Lỗi gửi tin nhắn Zalo ZNS: " + e.getMessage());
        }
    }
}
