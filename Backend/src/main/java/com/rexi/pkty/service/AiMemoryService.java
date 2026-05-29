package com.rexi.pkty.service;

import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.text.Normalizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class AiMemoryService {

    private static final int KNOWLEDGE_MAX_CONTEXT_CHARS = 1800;  // Giam de tiet kiem token (was 3800)
    private static final int KNOWLEDGE_SNIPPET_RADIUS = 280;  // Giam snippet radius de tiet kiem token (was 520)
    private static final long KNOWLEDGE_CACHE_TTL_MS = 60_000L;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<String> KNOWLEDGE_STOP_WORDS = Set.of(
        "toi", "ban", "cho", "cua", "voi", "nay", "kia", "thi", "la", "va", "hoac", "nhung",
        "mot", "cac", "gi", "nao", "sao", "the", "can", "hay", "giup", "duoc",
        "khong", "trong", "ngoai", "ve", "bi", "benh", "thu", "cung", "meo", "be"
    );

    private static class KnowledgeSnippet {
        private final String fileName;
        private final String snippet;
        private final int score;

        private KnowledgeSnippet(String fileName, String snippet, int score) {
            this.fileName = fileName;
            this.snippet = snippet;
            this.score = score;
        }
    }

    private static class KnowledgeFileCache {
        private final long lastModified;
        private final String content;
        private final String normalizedContent;

        private KnowledgeFileCache(long lastModified, String content, String normalizedContent) {
            this.lastModified = lastModified;
            this.content = content;
            this.normalizedContent = normalizedContent;
        }
    }

    private final Map<String, KnowledgeFileCache> knowledgeFileCache = new HashMap<>();
    private final Map<String, String> knowledgeQueryCache = new HashMap<>();
    private final Map<String, Long> knowledgeQueryCacheAt = new HashMap<>();

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;
    @Autowired
    private ThuCungRepository thuCungRepository;
    @Autowired
    private HoSoBenhAnRepository hoSoBenhAnRepository;
    @Autowired
    private TiemChungRepository tiemChungRepository;
    @Autowired
    private DichVuRepository dichVuRepository;
    @Autowired
    private NhanVienRepository nhanVienRepository;
    @Autowired
    private LichLamViecNhanVienRepository lichLamViecNhanVienRepository;

    public String getCurrentCustomerId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                Optional<TaiKhoan> tk = taiKhoanRepository.findByTenDangNhap(auth.getName());
                return tk.map(TaiKhoan::getId_khach_hang).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }

    public String getUserContext(String username) {
        if (username == null || username.isEmpty()) return "";
        try {
            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isEmpty()) return "";
            
            TaiKhoan tk = tkOpt.get();
            StringBuilder sb = new StringBuilder("\n[THÔNG TIN NGƯỜI DÙNG ĐANG CHAT]\n");
            sb.append("- Tên đăng nhập: ").append(tk.getTen_dang_nhap()).append("\n");
            
            if (tk.getId_khach_hang() != null) {
                sb.append(getPetContext(tk.getId_khach_hang()));
                sb.append(getMedicalHistoryContext(tk.getId_khach_hang()));
                sb.append(getImmunizationContext(tk.getId_khach_hang()));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String getPetContext(String customerId) {
        if (customerId == null) return "";
        try {
            var pets = thuCungRepository.findByKhachHang(customerId);
            if (pets.isEmpty()) return "\n[KHÁCH HÀNG CHƯA CÓ THÚ CƯNG]\n";
            
            StringBuilder sb = new StringBuilder("\n[DANH SÁCH THÚ CƯNG CỦA SEN]\n");
            for (var pet : pets) {
                sb.append("- Tên: ").append(pet.get("ten_thu_cung"))
                  .append(", Loại: ").append(pet.get("chung_loai"))
                  .append(", Giống: ").append(pet.get("giong"))
                  .append(", Cân nặng: ").append(pet.get("can_nang")).append("kg\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String getKnowledgeBaseContext(String query) {
        if (query == null || query.trim().length() < 4) return "";
        
        String cleanQuery = query.trim();
        String normalizedQuery = normalizeForSearch(cleanQuery);
        if (normalizedQuery.equals("hi") || normalizedQuery.equals("hello") || normalizedQuery.equals("helo") ||
            normalizedQuery.equals("alo") || normalizedQuery.equals("chao") ||
            normalizedQuery.equals("bong") || normalizedQuery.equals("cun") || normalizedQuery.equals("meo")) {
            return "";
        }
        List<String> searchTerms = extractSearchTerms(normalizedQuery);
        if (searchTerms.isEmpty()) return "";

        String cacheKey = String.join("|", searchTerms);
        Long cachedAt = knowledgeQueryCacheAt.get(cacheKey);
        if (cachedAt != null && System.currentTimeMillis() - cachedAt < KNOWLEDGE_CACHE_TTL_MS) {
            return knowledgeQueryCache.getOrDefault(cacheKey, "");
        }

        try {
            Path path = Paths.get("src/main/resources/knowledge");
            File folder = path.toFile();
            if (!folder.exists() || folder.listFiles() == null) return "";

            List<KnowledgeSnippet> matches = new ArrayList<>();

            for (File file : folder.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".md") && !isPersonalKnowledgeFile(file.getName())) {
                    KnowledgeFileCache cachedFile = readKnowledgeFile(file);
                    String content = cachedFile.content;
                    String normalizedContent = cachedFile.normalizedContent;
                    int score = scoreKnowledgeFile(file.getName(), normalizedContent, searchTerms);
                    if (score <= 0) continue;

                    matches.add(new KnowledgeSnippet(
                        file.getName(),
                        extractRelevantSnippet(content, normalizedContent, searchTerms),
                        score
                    ));
                }
            }
            if (matches.isEmpty()) return "";

            matches.sort(Comparator.comparingInt((KnowledgeSnippet item) -> item.score).reversed());
            StringBuilder context = new StringBuilder("\n[KIẾN THỨC CHUYÊN MÔN VNUA - TRÍCH ĐOẠN LIÊN QUAN]\n");
            for (KnowledgeSnippet match : matches.stream().limit(4).collect(Collectors.toList())) {
                if (context.length() >= KNOWLEDGE_MAX_CONTEXT_CHARS) break;
                String block = "\nNguồn: " + match.fileName + "\n" + match.snippet.trim() + "\n---\n";
                int remaining = KNOWLEDGE_MAX_CONTEXT_CHARS - context.length();
                if (block.length() > remaining) {
                    if (remaining > 260) {
                        context.append(block, 0, remaining).append("\n...[ĐÃ RÚT GỌN]...\n");
                    }
                    break;
                }
                context.append(block);
            }
            String result = context.length() > 80 ? context.toString() : "";
            knowledgeQueryCache.put(cacheKey, result);
            knowledgeQueryCacheAt.put(cacheKey, System.currentTimeMillis());
            return result;
        } catch (Exception e) {
            return "";
        }
    }

    private boolean isPersonalKnowledgeFile(String fileName) {
        String normalized = normalizeForSearch(fileName);
        return normalized.contains("cv")
                || normalized.contains("profile ca nhan")
                || normalized.contains("professor")
                || normalized.contains("phd")
                || normalized.contains("master")
                || normalized.contains("associate professor");
    }

    private KnowledgeFileCache readKnowledgeFile(File file) throws java.io.IOException {
        String key = file.getAbsolutePath();
        long lastModified = file.lastModified();
        KnowledgeFileCache cached = knowledgeFileCache.get(key);
        if (cached != null && cached.lastModified == lastModified) {
            return cached;
        }

        String content = Files.readString(file.toPath());
        KnowledgeFileCache next = new KnowledgeFileCache(lastModified, content, normalizeForSearch(content));
        knowledgeFileCache.put(key, next);
        return next;
    }

    private String normalizeForSearch(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value.toLowerCase(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace("đ", "d")
            .replace("Đ", "d");
        return normalized.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    private List<String> extractSearchTerms(String normalizedQuery) {
        List<String> terms = List.of(normalizedQuery.split("\\s+")).stream()
            .filter(term -> term.length() >= 3)
            .filter(term -> !KNOWLEDGE_STOP_WORDS.contains(term))
            .distinct()
            .limit(10)
            .collect(Collectors.toList());
        if (!terms.isEmpty()) {
            return terms;
        }

        return List.of(normalizedQuery.split("\\s+")).stream()
            .filter(term -> Set.of("benh", "cho", "meo", "thuoc", "duoc", "phau", "truyen", "nhiem").contains(term))
            .distinct()
            .limit(5)
            .collect(Collectors.toList());
    }

    private int scoreKnowledgeFile(String fileName, String normalizedContent, List<String> searchTerms) {
        String normalizedFileName = normalizeForSearch(fileName);
        int score = 0;
        for (String term : searchTerms) {
            if (normalizedFileName.contains(term)) score += 8;
            int index = normalizedContent.indexOf(term);
            while (index >= 0) {
                score += 2;
                index = normalizedContent.indexOf(term, index + term.length());
                if (score > 80) break;
            }
        }
        return score;
    }

    private String extractRelevantSnippet(String originalContent, String normalizedContent, List<String> searchTerms) {
        int firstHit = -1;
        for (String term : searchTerms) {
            int index = normalizedContent.indexOf(term);
            if (index >= 0 && (firstHit < 0 || index < firstHit)) {
                firstHit = index;
            }
        }
        if (firstHit < 0) {
            return originalContent.substring(0, Math.min(originalContent.length(), KNOWLEDGE_SNIPPET_RADIUS * 2));
        }

        int start = Math.max(0, firstHit - KNOWLEDGE_SNIPPET_RADIUS);
        int end = Math.min(originalContent.length(), firstHit + KNOWLEDGE_SNIPPET_RADIUS);
        while (start > 0 && !Character.isWhitespace(originalContent.charAt(start))) start--;
        while (end < originalContent.length() && !Character.isWhitespace(originalContent.charAt(end - 1))) end++;

        String prefix = start > 0 ? "... " : "";
        String suffix = end < originalContent.length() ? " ..." : "";
        return prefix + originalContent.substring(start, end).replaceAll("\\s+", " ").trim() + suffix;
    }

    public String getGlobalContext(String query) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n[THÔNG TIN PHÒNG KHÁM]\n- Địa chỉ: Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội\n");
        
        String cleanQuery = (query != null) ? query.toLowerCase() : "";
        
        // Smart Router: Chỉ nhét Bác Sĩ nếu câu hỏi nhắc đến bs
        if (cleanQuery.contains("bác sĩ") || cleanQuery.contains("bs") || cleanQuery.contains("ai khám") || cleanQuery.contains("khám bệnh")) {
            sb.append(getDoctorsContext());
        }
        
        // Smart Router: Chỉ nhét Bảng Giá nếu câu hỏi nhắc đến giá
        if (cleanQuery.contains("giá") || cleanQuery.contains("dịch vụ") || cleanQuery.contains("bao nhiêu tiền") || cleanQuery.contains("chi phí") || cleanQuery.contains("bảng giá")) {
            sb.append(getServicesContext());
        }
        
        // Smart Router: Chỉ nhét Lịch Làm Việc nếu câu hỏi nhắc đến lịch
        if (cleanQuery.contains("lịch") || cleanQuery.contains("trực") || cleanQuery.contains("hôm nay") || cleanQuery.contains("ngày mai") || cleanQuery.contains("giờ làm") || cleanQuery.contains("thứ") ||
            cleanQuery.contains("slot") || cleanQuery.contains("giờ") || cleanQuery.contains("ngày") ||
            cleanQuery.contains("khám") || cleanQuery.contains("mai") || cleanQuery.contains("sáng") || cleanQuery.contains("chiều")) {
            sb.append(getScheduleContext());
        }

        return sb.toString();
    }

    private String getScheduleContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[LỊCH TRỰC CỦA BÁC SĨ (7 NGÀY TỚI)]\n");
            var schedules = lichLamViecNhanVienRepository.findAll();
            var doctors = nhanVienRepository.findAllBacSi();
            
            LocalDate today = LocalDate.now(VN_ZONE);
            LocalDate nextWeek = today.plusDays(7);
            boolean hasSchedule = false;
            
            for (var s : schedules) {
                if (s.getNgay_lam() != null && !s.getNgay_lam().isBefore(today) && s.getNgay_lam().isBefore(nextWeek)) {
                    String tenBacSi = doctors.stream()
                        .filter(d -> d.getId_nhan_vien().equals(s.getId_nhan_vien()))
                        .map(d -> d.getHo_ten())
                        .findFirst()
                        .orElse("Bác sĩ ẩn danh");
                        
                    sb.append("- Ngày ").append(s.getNgay_lam())
                      .append(": BS ").append(tenBacSi)
                      .append(" trực từ ").append(s.getGio_bat_dau())
                      .append(" đến ").append(s.getGio_ket_thuc())
                      .append(" (").append(s.getGhi_chu() != null ? s.getGhi_chu() : "Không có ghi chú").append(")\n");
                    hasSchedule = true;
                }
            }
            return hasSchedule ? sb.toString() : "\n[KHÔNG CÓ LỊCH TRỰC NÀO TRONG 7 NGÀY TỚI]\n";
        } catch (Exception e) {
            return "";
        }
    }

    private String getServicesContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[DỊCH VỤ TẠI PHÒNG KHÁM]\n");
            var services = dichVuRepository.findAll();
            for (var s : services) {
                sb.append("- ").append(s.getTen_dich_vu()).append(": ").append(s.getGia()).append(" VNĐ\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String getDoctorsContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[BÁC SĨ TẠI PHÒNG KHÁM]\n");
            var doctors = nhanVienRepository.findAllBacSi();
            for (var d : doctors) {
                sb.append("- BS. ").append(d.getHo_ten()).append(" (").append(d.getGioi_thieu()).append(")\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String getMedicalHistoryContext(String customerId) {
        if (customerId == null) return "";
        try {
            var records = hoSoBenhAnRepository.findByCustomerId(customerId);
            if (records.isEmpty()) return "\n[KHÁCH HÀNG CHƯA CÓ LỊCH SỬ BỆNH ÁN]\n";
            
            StringBuilder sb = new StringBuilder("\n[LỊCH SỬ BỆNH ÁN CỦA BOSS]\n");
            for (var rec : records) {
                sb.append("- Ngày khám: ").append(rec.get("ngay_kham"))
                  .append(", Thú cưng: ").append(rec.get("ten_thu_cung"))
                  .append(", Triệu chứng: ").append(rec.get("trieu_chung"))
                  .append(", Chẩn đoán: ").append(rec.get("chan_doan"))
                  .append(", Phác đồ điều trị: ").append(rec.get("phac_do_dieu_tri"))
                  .append(", Hướng dẫn chăm sóc: ").append(rec.get("huong_dan_cham_soc"))
                  .append(", Bác sĩ: ").append(rec.get("ten_bac_si")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String getImmunizationContext(String customerId) {
        if (customerId == null) return "";
        try {
            var pets = thuCungRepository.findByKhachHang(customerId);
            if (pets.isEmpty()) return "";
            
            StringBuilder sb = new StringBuilder("\n[LỊCH SỬ TIÊM CHỦNG VACCINE CỦA BOSS]\n");
            boolean hasData = false;
            for (var pet : pets) {
                Object petIdObj = pet.get("id_thu_cung");
                if (petIdObj == null) continue;
                String petId = String.valueOf(petIdObj);
                String petName = (String) pet.get("ten_thu_cung");
                
                var shots = tiemChungRepository.findByIdThuCung(petId);
                for (var shot : shots) {
                    sb.append("- Pet: ").append(petName)
                      .append(", Vaccine: ").append(shot.getTen_vaccine())
                      .append(", Loại: ").append(shot.getLoai_vaccine())
                      .append(", Ngày tiêm: ").append(shot.getNgay_tiem())
                      .append(", Ngày nhắc lại: ").append(shot.getNgay_tiem_lai())
                      .append(", Ghi chú: ").append(shot.getGhi_chu()).append("\n");
                    hasData = true;
                }
            }
            return hasData ? sb.toString() : "\n[KHÁCH HÀNG CHƯA CÓ LỊCH SỬ TIÊM CHỦNG VACCINE]\n";
        } catch (Exception e) {
            return "";
        }
    }
}
