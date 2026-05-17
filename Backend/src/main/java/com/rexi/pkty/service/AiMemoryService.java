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
        try {
            Path path = Paths.get("src/main/resources/knowledge");
            File folder = path.toFile();
            if (!folder.exists() || folder.listFiles() == null) return "";

            String lowerQuery = query.toLowerCase();
            StringBuilder context = new StringBuilder("\n[KIẾN THỨC CHUYÊN MÔN VNUA]\n");
            boolean found = false;

            for (File file : folder.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".md")) {
                    String content = Files.readString(file.toPath());
                    // Tìm kiếm đoạn văn chứa từ khóa
                    if (content.toLowerCase().contains(lowerQuery)) {
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

    public String getGlobalContext() {
        StringBuilder sb = new StringBuilder();
        sb.append(getDoctorsContext());
        sb.append(getServicesContext());
        return sb.toString();
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
}
