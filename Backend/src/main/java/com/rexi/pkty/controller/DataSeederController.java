package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichHen;
import com.rexi.pkty.repository.LichHenRepository;
import com.rexi.pkty.repository.NhanVienRepository;
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

    @GetMapping("/seed-lich-hen")
    public String seedLichHen() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return "âŒ Cáº£nh bÃ¡o báº£o máº­t: Chá»‰ Admin gá»‘c má»›i cÃ³ quyá»n cháº¡y cÃ´ng cá»¥ giáº£ láº­p dá»¯ liá»‡u!";
        }

        List<String> doctorIds = nhanVienRepository.findAll()
                .stream()
                .filter(nv -> nv.getChuyenMon() != null && !nv.getChuyenMon().isEmpty())
                .map(nv -> nv.getIdNhanVien())
                .toList();

        if (doctorIds.isEmpty())
            return "KhÃ´ng tÃ¬m tháº¥y bÃ¡c sÄ© nÃ o sáº¿p Æ¡i!";

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
            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM KhachHang) INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, ngay_tao, da_xoa) VALUES ('KH-SEED', N'Khách Hàng Test', '0912345678', 'test@rexi.com', GETDATE(), 0)");
            sampleKhId = jdbcTemplate.queryForObject("SELECT TOP 1 id_khach_hang FROM KhachHang", String.class);

            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM ThuCung) INSERT INTO ThuCung (id_thu_cung, ten_thu_cung, loai, giong, id_khach_hang) VALUES ('TC-SEED', N'Boss Test', N'MÃ¨o', N'Anh lÃ´ng ngáº¯n', ?)",
                    sampleKhId);
            sampleTcId = jdbcTemplate.queryForObject("SELECT TOP 1 id_thu_cung FROM ThuCung", String.class);

            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM DichVu) INSERT INTO DichVu (id_dich_vu, ten_dich_vu, gia, thoi_luong_phut, mo_ta) VALUES ('DV-SEED', N'KhÃ¡m tá»•ng quÃ¡t', 150000, 30, N'Dá»‹ch vá»¥ test')");
            sampleDvId = jdbcTemplate.queryForObject("SELECT TOP 1 id_dich_vu FROM DichVu", String.class);
        }

        List<Object[]> batchArgs = new ArrayList<>();
        String sql = "INSERT INTO LichHen (ngay_kham, gio_kham, id_bac_si, id_khach_hang, id_thu_cung, id_dich_vu, ly_do, trang_thai, ngay_tao, id_nguoi_dat) VALUES (?, ?, ?, ?, ?, ?, N'Lá»‹ch test', 'CHO_XAC_NHAN', GETDATE(), ?)";

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

        System.out.println("ðŸš€ Äang bÆ¡m " + batchArgs.size() + " lá»‹ch háº¹n báº±ng Batch Update...");
        int[] results = jdbcTemplate.batchUpdate(sql, batchArgs);

        return "âœ… ÄÃ£ bÆ¡m thÃ nh cÃ´ng " + results.length
                + " lá»‹ch háº¹n áº£o! Há»‡ thá»‘ng cháº¡y 'mÆ°á»£t nhÆ° nhung' rá»“i sáº¿p nhÃ©! ðŸ¾ðŸš€";
    }

    @GetMapping("/seed-accounts")
    public String seedAccounts() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return "âŒ Cáº£nh bÃ¡o báº£o máº­t: Tuyá»‡t Ä‘á»‘i khÃ´ng cÃ³ quyá»n truy cáº­p vÃ o backdoor nÃ y!";
        }

        try {
            String hash123456 = "$2a$10$8.06q71brGLqc9PzEwM0zuux1VlvJreG9pOWXWQHqByvM9SihS39m";

            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE ten_vai_tro = N'Káº¿ toÃ¡n') " +
                    "INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-KT', N'Kế toán', N'Kế toán viên')");
            String roleKetoan = jdbcTemplate.queryForObject(
                    "SELECT id_vai_tro FROM VaiTroHeThong WHERE ten_vai_tro = N'Káº¿ toÃ¡n'", String.class);
            String roleAdmin = "VT-ADMIN"; 

            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE ten_dang_nhap = 'admin') " +
                    "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) " +
                    "VALUES ('TK-ADMIN', 'admin', '123456', ?, ?, 'Hoáº¡t Ä‘á»™ng', GETDATE()) " +
                    "ELSE UPDATE TaiKhoan SET mat_khau = '123456', mat_khau_hash = ?, id_vai_tro = ?, trang_thai = 'Hoáº¡t Ä‘á»™ng' WHERE ten_dang_nhap = 'admin'",
                    hash123456, roleAdmin, hash123456, roleAdmin);

            jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE ten_dang_nhap = 'ketoan') " +
                    "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) " +
                    "VALUES ('TK-KETOAN', 'ketoan', '123456', ?, ?, 'Hoáº¡t Ä‘á»™ng', GETDATE()) " +
                    "ELSE UPDATE TaiKhoan SET mat_khau = '123456', mat_khau_hash = ?, id_vai_tro = ?, trang_thai = 'Hoáº¡t Ä‘á»™ng' WHERE ten_dang_nhap = 'ketoan'",
                    hash123456, roleKetoan, hash123456, roleKetoan);

            return "âœ… ÄÃ£ reset tÃ i khoáº£n admin vÃ  ketoan vá» máº­t kháº©u 123456 thÃ nh cÃ´ng sáº¿p nhÃ©!";
        } catch (Exception e) {
            return "âŒ Lá»—i khi reset tÃ i khoáº£n: " + e.getMessage();
        }
    }
}
