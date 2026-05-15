package com.rexi.pkty.controller;

import com.rexi.pkty.repository.LichHenRepository;
import com.rexi.pkty.repository.NhanVienRepository;
import com.rexi.pkty.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/system")
public class DataSeederController {

    @Autowired
    private LichHenRepository lichHenRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * Giả lập dữ liệu lịch hẹn để kiểm thử hiệu năng và giao diện
     */
    @GetMapping("/seed-lich-hen")
    public String seedLichHen() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return "Cảnh báo bảo mật: Chỉ Quản trị viên gốc mới có quyền chạy công cụ giả lập dữ liệu!";
        }

        List<String> doctorIds = nhanVienRepository.findAll()
                .stream()
                .filter(nv -> nv.getChuyen_mon() != null && !nv.getChuyen_mon().isEmpty())
                .map(nv -> nv.getId_nhan_vien())
                .toList();

        if (doctorIds.isEmpty())
            return "Lỗi: Không tìm thấy nhân sự bác sĩ nào trong hệ thống!";

        // Danh sách các khung giờ khám mặc định
        List<String> timeSlots = List.of(
                "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30");

        LocalDate today = LocalDate.now();
        String sampleKhId, sampleTcId, sampleDvId;

        try {
            sampleKhId = jdbcTemplate.queryForObject("SELECT TOP 1 id_khach_hang FROM KhachHang", String.class);
            sampleTcId = jdbcTemplate.queryForObject("SELECT TOP 1 id_thu_cung FROM ThuCung", String.class);
            sampleDvId = jdbcTemplate.queryForObject("SELECT TOP 1 id_dich_vu FROM DichVu", String.class);
        } catch (Exception e) {
            // Khởi tạo dữ liệu cơ bản nếu bảng đang trống
            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM KhachHang) INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, ngay_tao, da_xoa) VALUES ('KH-SEED', N'Khách Hàng Test', '0912345678', 'test@rexi.com', GETDATE(), 0)");
            sampleKhId = jdbcTemplate.queryForObject("SELECT TOP 1 id_khach_hang FROM KhachHang", String.class);

            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM ThuCung) INSERT INTO ThuCung (id_thu_cung, ten_thu_cung, loai, giong, id_khach_hang) VALUES ('TC-SEED', N'Boss Test', N'Mèo', N'Anh lông ngắn', ?)",
                    sampleKhId);
            sampleTcId = jdbcTemplate.queryForObject("SELECT TOP 1 id_thu_cung FROM ThuCung", String.class);

            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM DichVu) INSERT INTO DichVu (id_dich_vu, ten_dich_vu, gia, thoi_luong_phut, mo_ta) VALUES ('DV-SEED', N'Khám tổng quát', 150000, 30, N'Dịch vụ test')");
            sampleDvId = jdbcTemplate.queryForObject("SELECT TOP 1 id_dich_vu FROM DichVu", String.class);
        }

        List<Object[]> batchArgs = new ArrayList<>();
        String sql = "INSERT INTO LichHen (ngay_kham, gio_kham, id_bac_si, id_khach_hang, id_thu_cung, id_dich_vu, ly_do, trang_thai, ngay_tao, id_nguoi_dat) VALUES (?, ?, ?, ?, ?, ?, N'Lịch test', 'CHO_XAC_NHAN', GETDATE(), ?)";

        // Tạo dữ liệu cho 14 ngày tới
        for (int i = 0; i < 14; i++) {
            LocalDate date = today.plusDays(i);
            for (String docId : doctorIds) {
                for (String t : timeSlots) {
                    if (Math.random() > 0.2) {
                        batchArgs.add(new Object[] { date, LocalTime.parse(t), docId, sampleKhId, sampleTcId,
                                sampleDvId, sampleKhId });
                    }
                }
            }
        }

        jdbcTemplate.batchUpdate(sql, batchArgs);

        return "Thành công: Đã giả lập " + batchArgs.size() + " lịch hẹn trong hệ thống.";
    }

    /**
     * Khởi tạo lại các tài khoản quản trị với thông tin đăng nhập mặc định
     */
    @GetMapping("/seed-accounts")
    public String seedAccounts() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return "Cảnh báo bảo mật: Truy cập trái phép vào công cụ khởi tạo tài khoản!";
        }

        try {
            // Mã hash BCrypt cho mật khẩu mặc định (admin@rexi.com)
            String secureHash = "$2a$10$C82oR.v6C6i4/839/T.uReXG1tHn4qK.fH9h6G8B9m8.6u8/G8h3G"; 

            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE ten_vai_tro = N'Kế toán') " +
                    "INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-KT', N'Kế toán', N'Kế toán viên')");
            String roleKetoan = jdbcTemplate.queryForObject(
                    "SELECT id_vai_tro FROM VaiTroHeThong WHERE ten_vai_tro = N'Kế toán'", String.class);
            String roleAdmin = "VT-ADMIN"; 

            // Cập nhật hoặc tạo mới tài khoản Quản trị
            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE ten_dang_nhap = 'admin') " +
                    "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) " +
                    "VALUES ('TK-ADMIN', 'admin', ?, ?, N'Hoạt động', GETDATE()) " +
                    "ELSE UPDATE TaiKhoan SET mat_khau_hash = ?, id_vai_tro = ?, trang_thai = N'Hoạt động' WHERE ten_dang_nhap = 'admin'",
                    secureHash, roleAdmin, secureHash, roleAdmin);

            // Cập nhật hoặc tạo mới tài khoản Kế toán
            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE ten_dang_nhap = 'ketoan') " +
                    "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) " +
                    "VALUES ('TK-KETOAN', 'ketoan', ?, ?, N'Hoạt động', GETDATE()) " +
                    "ELSE UPDATE TaiKhoan SET mat_khau_hash = ?, id_vai_tro = ?, trang_thai = N'Hoạt động' WHERE ten_dang_nhap = 'ketoan'",
                    secureHash, roleKetoan, secureHash, roleKetoan);

            return "Thành công: Các tài khoản hệ thống (admin, ketoan) đã được khởi tạo lại với thông tin đăng nhập mặc định.";
        } catch (Exception e) {
            return "Lỗi: Không thể khởi tạo lại tài khoản: " + e.getMessage();
        }
    }
}
