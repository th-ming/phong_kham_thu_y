package com.rexi.pkty.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class ZaloService {

    private static final Logger logger = Logger.getLogger(ZaloService.class.getName());

    // Cấu hình thông tin từ Zalo Developer tại đây.
    private final String ZALO_ACCESS_TOKEN = "YOUR_ZALO_ACCESS_TOKEN";
    private final String TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // ID mẫu tin nhắn đã duyệt

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    public void sendInvoiceZNS(String phoneNumber, String customerName, BigDecimal totalAmount) {
        CompletableFuture.runAsync(() -> {
            try {
                // Zalo yêu cầu SĐT theo chuẩn quốc tế (VD: 0912... -> 84912...)
                String formattedPhone = phoneNumber;
                if (phoneNumber != null && phoneNumber.startsWith("0")) {
                    formattedPhone = "84" + phoneNumber.substring(1);
                }

                // Dữ liệu truyền vào Mẫu tin nhắn (Phải khớp với biến đã khai báo trên Zalo)
                Map<String, Object> templateData = Map.of(
                        "name", customerName != null ? customerName : "Khách hàng",
                        "amount", String.format("%,.0f VNĐ", totalAmount));

                Map<String, Object> payload = Map.of(
                        "phone", formattedPhone,
                        "template_id", TEMPLATE_ID,
                        "template_data", templateData);

                String requestBody = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://business.openapi.zalo.me/message/template"))
                        .header("Content-Type", "application/json")
                        .header("access_token", ZALO_ACCESS_TOKEN)
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                logger.info("Zalo ZNS Response (" + formattedPhone + "): " + response.body());

            } catch (Exception e) {
                logger.severe("Lỗi gửi tin nhắn Zalo ZNS: " + e.getMessage());
            }
        });
    }
}
