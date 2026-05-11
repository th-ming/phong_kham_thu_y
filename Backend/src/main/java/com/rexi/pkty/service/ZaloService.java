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

@Service
public class ZaloService {

    // ÄIá»€N THÃ”NG TIN Tá»ª ZALO DEVELOPER Cá»¦A Sáº¾P VÃ€O ÄÃ‚Y
    private final String ZALO_ACCESS_TOKEN = "YOUR_ZALO_ACCESS_TOKEN";
    private final String TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // ID máº«u tin nháº¯n Ä‘Ã£ duyá»‡t

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    public void sendInvoiceZNS(String phoneNumber, String customerName, BigDecimal totalAmount) {
        CompletableFuture.runAsync(() -> {
            try {
                // Zalo yÃªu cáº§u SÄT theo chuáº©n quá»‘c táº¿ (VD: 0912... -> 84912...)
                String formattedPhone = phoneNumber;
                if (phoneNumber != null && phoneNumber.startsWith("0")) {
                    formattedPhone = "84" + phoneNumber.substring(1);
                }

                // Dá»¯ liá»‡u truyá»n vÃ o Máº«u tin nháº¯n (Pháº£i khá»›p vá»›i biáº¿n Ä‘Ã£ khai bÃ¡o trÃªn Zalo)
                Map<String, Object> templateData = Map.of(
                        "name", customerName != null ? customerName : "KhÃ¡ch hÃ ng",
                        "amount", String.format("%,.0f VNÄ", totalAmount));

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
                System.out.println("Zalo ZNS Response (" + formattedPhone + "): " + response.body());

            } catch (Exception e) {
                System.err.println("Lá»—i gá»­i tin nháº¯n Zalo ZNS: " + e.getMessage());
            }
        });
    }
}
