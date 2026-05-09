package com.rexi.pkty.config;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Lớp tiện ích chứa các hàm cấu hình và mã hóa cho cổng thanh toán VNPay.
 */
public class VNPayConfig {

    /**
     * Hàm tạo chữ ký HMAC-SHA512.
     * 
     * @param key  Secret key do VNPay cung cấp.
     * @param data Chuỗi dữ liệu cần băm (đã được sắp xếp và nối lại).
     * @return Chuỗi Hex được mã hóa.
     */
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException("Key or data for HMAC-SHA512 is null");
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);

            // Chuyển byte array thành chuỗi hex
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC-SHA512", e);
        }
    }

    /**
     * Hàm xây dựng URL có chữ ký từ một Map các tham số.
     * 
     * @param fields    Map chứa các tham số của VNPay.
     * @param secretKey Secret key do VNPay cung cấp.
     * @return Chuỗi query string đã được mã hóa và sẵn sàng để gắn vào URL.
     */
    public static String hashAllFields(Map<String, String> fields, String secretKey) {
        // Sắp xếp các trường theo thứ tự alphabet
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String vnp_SecureHash = hmacSHA512(secretKey, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        return query.toString();
    }
}