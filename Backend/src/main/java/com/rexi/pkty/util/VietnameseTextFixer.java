package com.rexi.pkty.util;

import java.util.Map;

/**
 * Fix lỗi encoding phổ biến của tiếng Việt khi lưu/đọc từ database.
 * VD: "Hình ?nh" → "Hình ảnh", "B?nh viện" → "Bệnh viện"
 */
public final class VietnameseTextFixer {

    private VietnameseTextFixer() {}

    // Các cặp ký tự bị lỗi encoding thường gặp
    private static final Map<String, String> COMMON_FIXES = Map.ofEntries(
        Map.entry("?a", "ả"),
        Map.entry("?á", "á"),
        Map.entry("?à", "à"),
        Map.entry("?ã", "ã"),
        Map.entry("?ạ", "ạ"),
        Map.entry("?ă", "ă"),
        Map.entry("?â", "â"),
        Map.entry("?đ", "đ"),
        Map.entry("?e", "ẻ"),
        Map.entry("?é", "é"),
        Map.entry("?è", "è"),
        Map.entry("?ẽ", "ẽ"),
        Map.entry("?ẹ", "ẹ"),
        Map.entry("?ê", "ê"),
        Map.entry("?i", "ỉ"),
        Map.entry("?í", "í"),
        Map.entry("?ì", "ì"),
        Map.entry("?ĩ", "ĩ"),
        Map.entry("?ị", "ị"),
        Map.entry("?o", "ỏ"),
        Map.entry("?ó", "ó"),
        Map.entry("?ò", "ò"),
        Map.entry("?õ", "õ"),
        Map.entry("?ọ", "ọ"),
        Map.entry("?ô", "ô"),
        Map.entry("?ơ", "ơ"),
        Map.entry("?u", "ủ"),
        Map.entry("?ú", "ú"),
        Map.entry("?ù", "ù"),
        Map.entry("?ũ", "ũ"),
        Map.entry("?ụ", "ụ"),
        Map.entry("?ư", "ư"),
        Map.entry("?y", "ỷ"),
        Map.entry("?ý", "ý"),
        Map.entry("?ỳ", "ỳ"),
        Map.entry("?ỹ", "ỹ"),
        Map.entry("?ỵ", "ỵ"),
        Map.entry("?A", "Ả"),
        Map.entry("?Á", "Á"),
        Map.entry("?À", "À"),
        Map.entry("?Ã", "Ã"),
        Map.entry("?Ạ", "Ạ"),
        Map.entry("?Ă", "Ă"),
        Map.entry("?Â", "Â"),
        Map.entry("?Đ", "Đ"),
        Map.entry("?E", "Ẻ"),
        Map.entry("?É", "É"),
        Map.entry("?È", "È"),
        Map.entry("?Ẽ", "Ẽ"),
        Map.entry("?Ẹ", "Ẹ"),
        Map.entry("?Ê", "Ê"),
        Map.entry("?I", "Ỉ"),
        Map.entry("?Í", "Í"),
        Map.entry("?Ì", "Ì"),
        Map.entry("?Ĩ", "Ĩ"),
        Map.entry("?Ị", "Ị"),
        Map.entry("?O", "Ỏ"),
        Map.entry("?Ó", "Ó"),
        Map.entry("?Ò", "Ò"),
        Map.entry("?Õ", "Õ"),
        Map.entry("?Ọ", "Ọ"),
        Map.entry("?Ô", "Ô"),
        Map.entry("?Ơ", "Ơ"),
        Map.entry("?U", "Ủ"),
        Map.entry("?Ú", "Ú"),
        Map.entry("?Ù", "Ù"),
        Map.entry("?Ũ", "Ũ"),
        Map.entry("?Ụ", "Ụ"),
        Map.entry("?Ư", "Ư"),
        Map.entry("?Y", "Ỷ"),
        Map.entry("?Ý", "Ý"),
        Map.entry("?Ỳ", "Ỳ"),
        Map.entry("?Ỹ", "Ỹ"),
        Map.entry("?Ỵ", "Ỵ")
    );

    /**
     * Fix lỗi encoding cho 1 chuỗi text.
     * Thay thế các cặp "?X" (X = a-z, A-Z có dấu) bằng ký tự đúng.
     */
    public static String fix(String text) {
        if (text == null || text.isEmpty()) return text;

        String result = text;
        for (Map.Entry<String, String> entry : COMMON_FIXES.entrySet()) {
            result = result.replace(entry.getKey(), entry.getValue());
        }
        return result;
    }

    /**
     * Fix lỗi encoding cho nhiều field trong Map (dùng cho native query results).
     */
    public static Map<String, Object> fixMapFields(Map<String, Object> row, String... fields) {
        if (row == null) return row;
        for (String field : fields) {
            Object value = row.get(field);
            if (value instanceof String) {
                row.put(field, fix((String) value));
            }
        }
        return row;
    }
}
