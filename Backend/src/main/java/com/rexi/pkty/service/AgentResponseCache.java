package com.rexi.pkty.service;

import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Cache nhẹ cho câu trả lời của ReAct Agent.
 *
 * <p>Chỉ cache các loại intent TĨNH (không phụ thuộc dữ liệu real-time):
 * - Lời chào hỏi (xin chào, hi, hello...)
 * - Câu hỏi điều hướng / mở trang
 * - Tư vấn thú y chung (triệu chứng, bệnh phổ biến)
 * - Câu hỏi thông tin chung về phòng khám
 *
 * <p>KHÔNG cache bất kỳ thứ gì liên quan đến:
 * - Lịch hẹn, hóa đơn, kho thuốc, thống kê real-time
 * - Thông tin khách hàng hoặc thú cưng cụ thể
 * - Bất cứ câu nào có tên riêng, số điện thoại, ngày tháng
 *
 * <p>Mọi lỗi của cache đều bị nuốt và fallback về ReAct loop bình thường —
 * cache KHÔNG BAO GIỜ làm crash hoặc thay đổi logic nghiệp vụ.
 *
 * TTL mặc định: 30 giây. Cleanup tự động khi get() được gọi (lazy eviction).
 */
@Component
public class AgentResponseCache {

    private static final Logger logger = Logger.getLogger(AgentResponseCache.class.getName());

    /** TTL của mỗi entry: 30 giây */
    private static final long TTL_MS = 30_000L;

    /** Giới hạn số entry tối đa để tránh OOM khi traffic cao */
    private static final int MAX_ENTRIES = 500;

    private static final class CacheEntry {
        final String answer;
        final long expiresAt;

        CacheEntry(String answer) {
            this.answer = answer;
            this.expiresAt = System.currentTimeMillis() + TTL_MS;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private final ConcurrentHashMap<String, CacheEntry> store = new ConcurrentHashMap<>();

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Tra cứu cache. Trả về câu trả lời nếu có và chưa hết hạn, null nếu không.
     *
     * @param normalizedQuery câu hỏi đã normalize (toLowerCase, bỏ dấu)
     * @param userRole        vai trò người dùng — đảm bảo không leak data giữa các role
     */
    public String get(String normalizedQuery, String userRole) {
        try {
            String key = buildKey(normalizedQuery, userRole);
            CacheEntry entry = store.get(key);
            if (entry == null) return null;
            if (entry.isExpired()) {
                store.remove(key);
                return null;
            }
            logger.fine("[AgentCache] HIT — key=" + key.substring(0, Math.min(key.length(), 40)));
            return entry.answer;
        } catch (Exception e) {
            logger.warning("[AgentCache] get() error (ignored): " + e.getMessage());
            return null; // fallback: cache miss
        }
    }

    /**
     * Lưu câu trả lời vào cache.
     *
     * @param normalizedQuery câu hỏi đã normalize
     * @param userRole        vai trò người dùng
     * @param answer          câu trả lời của Agent
     */
    public void put(String normalizedQuery, String userRole, String answer) {
        try {
            if (answer == null || answer.isBlank()) return;
            evictIfNeeded();
            String key = buildKey(normalizedQuery, userRole);
            store.put(key, new CacheEntry(answer));
            logger.fine("[AgentCache] PUT — key=" + key.substring(0, Math.min(key.length(), 40)));
        } catch (Exception e) {
            logger.warning("[AgentCache] put() error (ignored): " + e.getMessage());
        }
    }

    /**
     * Kiểm tra xem một câu hỏi có đủ điều kiện được cache không.
     *
     * <p>Nguyên tắc conservative: chỉ cache những gì CHẮC CHẮN là tĩnh.
     * Nếu có bất kỳ dấu hiệu nào của dữ liệu real-time → không cache.
     *
     * @param normalizedQuery câu hỏi đã normalize (toLowerCase, loại bỏ dấu cơ bản)
     * @return true nếu có thể cache an toàn
     */
    public boolean isCacheableIntent(String normalizedQuery) {
        try {
            if (normalizedQuery == null || normalizedQuery.isBlank()) return false;

            // ---- Từ khoá LOẠI TRỪ (không cache) ----
            // Bất kỳ câu nào có những từ này → dữ liệu real-time → không cache
            String[] realtimeKeywords = {
                "lich hen", "lịch hẹn", "lich kham", "lịch khám",
                "hoa don", "hóa đơn", "thanh toan", "thanh toán",
                "thuoc", "thuốc", "kho", "ton kho", "tồn kho",
                "doanh thu", "thong ke", "thống kê", "bao cao", "báo cáo",
                "khach hang", "khách hàng", "thu cung", "thú cưng",
                "benh an", "bệnh án", "ket qua", "kết quả",
                "bac si", "bác sĩ", "nhan vien", "nhân viên",
                "hom nay", "hôm nay", "ngay mai", "ngày mai",
                "tuan nay", "tuần này", "thang nay", "tháng này",
                "dat lich", "đặt lịch", "huy lich", "hủy lịch",
                "cap nhat", "cập nhật", "them moi", "thêm mới", "xoa", "xóa",
                "so dien thoai", "số điện thoại", "sdt",
                // Số điện thoại (dãy số dài)
            };

            for (String kw : realtimeKeywords) {
                if (normalizedQuery.contains(kw)) return false;
            }

            // Kiểm tra có số điện thoại hoặc số ID không (dãy 7+ chữ số liên tiếp)
            if (normalizedQuery.matches(".*\\d{7,}.*")) return false;

            // ---- Từ khoá ĐƯỢC PHÉP cache ----
            // Phải match ít nhất 1 trong các pattern này mới cache
            String[] cacheablePatterns = {
                // Chào hỏi
                "xin chao", "xin chào", "chao ban", "chào bạn",
                "hello", "hi ", "^hi$", "hey", "chao rexi", "rexi oi", "rexi ơi",
                "ban la ai", "bạn là ai", "ban ten gi", "bạn tên gì",
                "ban co the", "bạn có thể",
                // Điều hướng / mở trang
                "mo trang", "mở trang", "chuyen sang", "chuyển sang",
                "di den", "đi đến", "vao trang", "vào trang",
                // Thú y tĩnh — tư vấn triệu chứng chung
                "trieu chung", "triệu chứng", "dau hieu", "dấu hiệu",
                "phong ngua", "phòng ngừa", "tiem phong", "tiêm phòng",
                "che do an", "chế độ ăn", "dinh duong", "dinh dưỡng",
                "benh pho bien", "bệnh phổ biến", "cham soc thu cung", "chăm sóc thú cưng",
                // Câu hỏi về phòng khám chung
                "phong kham", "phòng khám", "gio lam viec", "giờ làm việc",
                "dia chi", "địa chỉ", "lien he", "liên hệ",
                // Câu hỏi về Rexi / AI
                "rexi la gi", "rexi là gì", "rexi lam duoc", "rexi làm được",
                "ban lam duoc gi", "bạn làm được gì",
            };

            for (String pattern : cacheablePatterns) {
                if (normalizedQuery.contains(pattern)) return true;
            }

            return false;
        } catch (Exception e) {
            logger.warning("[AgentCache] isCacheableIntent() error (ignored): " + e.getMessage());
            return false; // conservative: không cache nếu có lỗi
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /** Tạo cache key từ query + role. Đơn giản nhưng phân biệt được role. */
    private String buildKey(String normalizedQuery, String userRole) {
        // Dùng role làm prefix để đảm bảo phân quyền nghiêm ngặt
        String safeRole = (userRole != null) ? userRole.toUpperCase() : "UNKNOWN";
        return safeRole + "::" + normalizedQuery;
    }

    /** Xóa các entry hết hạn và đảm bảo không vượt quá MAX_ENTRIES. */
    private void evictIfNeeded() {
        // Lazy eviction: chỉ chạy khi sắp đầy
        if (store.size() < MAX_ENTRIES) return;

        int removed = 0;
        Iterator<Map.Entry<String, CacheEntry>> it = store.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, CacheEntry> entry = it.next();
            if (entry.getValue().isExpired()) {
                it.remove();
                removed++;
            }
        }
        logger.fine("[AgentCache] Evicted " + removed + " expired entries. Size=" + store.size());

        // Nếu vẫn đầy sau cleanup → xóa bớt cưỡng bức (xóa 10% đầu tiên)
        if (store.size() >= MAX_ENTRIES) {
            int forcedEvict = MAX_ENTRIES / 10;
            Iterator<String> keys = store.keySet().iterator();
            while (keys.hasNext() && forcedEvict-- > 0) {
                keys.next();
                keys.remove();
            }
        }
    }
}
