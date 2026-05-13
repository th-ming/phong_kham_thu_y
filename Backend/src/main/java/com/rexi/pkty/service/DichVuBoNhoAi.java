package com.rexi.pkty.service;

import com.rexi.pkty.dto.TinNhanChat;
import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.entity.KhachHang;
import com.rexi.pkty.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class DichVuBoNhoAi {

    private final Map<String, List<TinNhanChat>> sessionContext = new ConcurrentHashMap<>();

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private ThuCungRepository thuCungRepository;

    @Autowired
    private HoSoBenhAnRepository hoSoBenhAnRepository;

    @Autowired
    private LichHenRepository lichHenRepository;

    @Autowired
    private TiemChungRepository tiemChungRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private KhachHangRepository khachHangRepository;

    public List<TinNhanChat> getContext(String sessionId) {
        return sessionContext.computeIfAbsent(sessionId, k -> new ArrayList<>());
    }

    public void addMessage(String sessionId, String role, String content) {
        List<TinNhanChat> history = getContext(sessionId);
        history.add(new TinNhanChat(role, content, null, null));
        if (history.size() > 20) {
            history.remove(0);
        }
    }

    public void clearContext(String sessionId) {
        sessionContext.remove(sessionId);
    }

    public String getCurrentCustomerId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return null;
            String username = auth.getName();
            if (username == null || username.equals("anonymousUser")) return null;
            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isPresent() && tkOpt.get().getId_khach_hang() != null) {
                return tkOpt.get().getId_khach_hang();
            }
        } catch (Exception e) {}
        return null;
    }

    public String getUserContext(String userQuery) {
        try {
            String query = userQuery != null ? userQuery.toLowerCase() : "";
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName().equals("anonymousUser")) {
                if (query.contains("giá") || query.contains("dịch vụ") || query.contains("tiền")) {
                    return getClinicServicesContext();
                }
                return "";
            }

            String username = auth.getName();
            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isEmpty() || tkOpt.get().getId_khach_hang() == null) return "";

            String customerId = tkOpt.get().getId_khach_hang();
            KhachHang kh = khachHangRepository.findById(customerId).orElse(null);
            String customerName = (kh != null) ? kh.getTen_khach_hang() : "Khách hàng";

            StringBuilder context = new StringBuilder();
            context.append("\n[BỐI CẢNH HIỆN TẠI]\n");
            context.append("- Khách hàng: ").append(customerName).append("\n");

            var pets = thuCungRepository.findPetsByKhachHangId(customerId);
            if (!pets.isEmpty()) {
                String petNames = pets.stream().map(p -> p.getTen_thu_cung() + " (" + p.getLoai() + ")").collect(Collectors.joining(", "));
                context.append("- Thú cưng: ").append(petNames).append("\n");
            }

            if (query.contains("tiêm") || query.contains("lịch") || query.contains("vắc") || query.contains("hẹn")) {
                context.append("- Dữ liệu tiêm chủng/lịch hẹn: ");
                for (var p : pets) {
                    var vaccinations = tiemChungRepository.findVaccinationsForSpecificPet(p.getId_thu_cung());
                    if (!vaccinations.isEmpty()) {
                        String vax = vaccinations.stream().map(v -> v.getTen_vaccine() + " (" + v.getNgay_tiem() + ")").collect(Collectors.joining("; "));
                        context.append("[").append(p.getTen_thu_cung()).append(": ").append(vax).append("] ");
                    }
                }
                context.append("\n");
            }

            if (query.contains("lần trước") || query.contains("khám") || query.contains("bệnh") || query.contains("sức khỏe")) {
                var history = hoSoBenhAnRepository.findHistoryByKhachHangId(customerId);
                if (!history.isEmpty()) {
                    context.append("- Bệnh án gần đây: ");
                    int count = 0;
                    for (var h : history) {
                        if (count++ >= 2) break; 
                        context.append("Bé tại ngày ").append(h.getNgay_kham()).append(" chẩn đoán: ").append(h.getChan_doan()).append("\n");
                    }
                }
            }

            if (query.contains("giá") || query.contains("tiền") || query.contains("bao nhiêu") || query.contains("dịch vụ")) {
                context.append(getClinicServicesContext());
            }

            if (query.contains("bác sĩ") || query.contains("ai khám") || query.contains("người khám") || query.contains("giỏi")) {
                context.append(getDoctorsContext());
            }

            return context.toString();
        } catch (Exception e) {
            return ""; 
        }
    }

    private String getClinicServicesContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[THÔNG TIN PHÒNG KHÁM REXI]\n");
            sb.append("- Địa chỉ: Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội.\n");
            sb.append("- Hotline Cấp cứu: ***REMOVED***-VIETQR_ACCOUNT_NO (Phục vụ 24/7).\n");
            sb.append("- Giờ mở cửa: 08:00 - 20:00 (Tất cả các ngày trong tuần).\n");
            sb.append("- Email hỗ trợ: rexivetsys@gmail.com\n");
            sb.append("- Triết lý: Chăm sóc thú cưng bằng cả trái tim.\n");

            var services = dichVuRepository.findAll();
            if (services != null && !services.isEmpty()) {
                sb.append("\n[BẢNG GIÁ DỊCH VỤ CHÍNH]\n");
                for (var s : services) {
                    if (s.getTen_dich_vu() != null) {
                        sb.append("- ").append(s.getTen_dich_vu()).append(": Từ ").append(s.getGia()).append(" VNĐ\n");
                    }
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String getDoctorsContext() {
        try {
            StringBuilder sb = new StringBuilder("\n[DANH SÁCH BÁC SĨ TẠI PHÒNG KHÁM]\n");
            var doctors = nhanVienRepository.findAllBacSi();
            if (doctors != null && !doctors.isEmpty()) {
                for (var d : doctors) {
                    sb.append("- Bác sĩ: ").append(d.getHo_ten());
                    if (d.getChuyen_mon() != null && !d.getChuyen_mon().isBlank()) {
                        sb.append(" (Chuyên môn: ").append(d.getChuyen_mon()).append(")");
                    }
                    sb.append("\n");
                }
            } else {
                sb.append("- Đội ngũ bác sĩ giàu kinh nghiệm, luôn sẵn sàng phục vụ.\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
