package com.rexi.pkty.service;

import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDate;

@Service
public class AiMemoryService {

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
        
        String cleanQuery = query.trim().toLowerCase();
        if (cleanQuery.equals("hi") || cleanQuery.equals("hello") || cleanQuery.equals("helo") || 
            cleanQuery.equals("alo") || cleanQuery.equals("chào") || cleanQuery.equals("chao") ||
            cleanQuery.equals("bông") || cleanQuery.equals("cún") || cleanQuery.equals("mèo")) {
            return "";
        }

        try {
            Path path = Paths.get("src/main/resources/knowledge");
            File folder = path.toFile();
            if (!folder.exists() || folder.listFiles() == null) return "";

            StringBuilder context = new StringBuilder("\n[KIẾN THỨC CHUYÊN MÔN VNUA]\n");
            boolean found = false;

            for (File file : folder.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".md")) {
                    String content = Files.readString(file.toPath());
                    if (content.toLowerCase().contains(cleanQuery)) {
                        if (context.length() + content.length() > 8000) {
                            int remainingSpace = 8000 - context.length();
                            if (remainingSpace > 500) {
                                context.append(content, 0, remainingSpace).append("... [ĐÃ RÚT GỌN VÌ QUÁ DÀI] ...\n");
                                found = true;
                            }
                            break;
                        }
                        context.append(content).append("\n---\n");
                        found = true;
                    }
                }
            }
            return found ? context.toString() : "";
        } catch (Exception e) {
            return "";
        }
    }

    public String getGlobalContext(String query) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n[THÔNG TIN PHÒNG KHÁM]\n- Địa chỉ: Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội\n");
        
        String cleanQuery = (query != null) ? query.toLowerCase() : "";
        
        // Smart Router: Chỉ nhét Bác Sĩ nếu câu hỏi nhắc đến bác sĩ
        if (cleanQuery.contains("bác sĩ") || cleanQuery.contains("bs") || cleanQuery.contains("ai khám") || cleanQuery.contains("khám bệnh")) {
            sb.append(getDoctorsContext());
        }
        
        // Smart Router: Chỉ nhét Bảng Giá nếu câu hỏi nhắc đến giá
        if (cleanQuery.contains("giá") || cleanQuery.contains("dịch vụ") || cleanQuery.contains("bao nhiêu tiền") || cleanQuery.contains("chi phí") || cleanQuery.contains("bảng giá")) {
            sb.append(getServicesContext());
        }
        
        // Smart Router: Chỉ nhét Lịch Làm Việc nếu câu hỏi nhắc đến lịch
        if (cleanQuery.contains("lịch") || cleanQuery.contains("trực") || cleanQuery.contains("hôm nay") || cleanQuery.contains("ngày mai") || cleanQuery.contains("giờ làm") || cleanQuery.contains("thứ")) {
            sb.append(getScheduleContext());
        }

        return sb.toString();
    }

    private String getScheduleContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[LỊCH TRỰC CỦA BÁC SĨ (7 NGÀY TỚI)]\n");
            var schedules = lichLamViecNhanVienRepository.findAll();
            var doctors = nhanVienRepository.findAllBacSi();
            
            LocalDate today = LocalDate.now();
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
