package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/public/audit")
public class AuditController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/data")
    public Map<String, Object> audit() {
        Map<String, Object> result = new HashMap<>();
        try {
            // SỬA LỖI: Chuẩn hóa tên vai trò để khớp với Repository
            jdbcTemplate.update("UPDATE VaiTroHeThong SET ten_vai_tro = N'Bác sĩ' WHERE id_vai_tro = 'VT-8'");
            jdbcTemplate.update("UPDATE VaiTroHeThong SET ten_vai_tro = N'Kế toán' WHERE id_vai_tro = 'VT-9'");
            jdbcTemplate.update("UPDATE VaiTroHeThong SET ten_vai_tro = N'Admin' WHERE id_vai_tro = 'VT-1'");
            
            result.put("VaiTroHeThong", jdbcTemplate.queryForList("SELECT * FROM VaiTroHeThong"));
            result.put("Doctor_Links", jdbcTemplate.queryForList("SELECT ho_ten, id_tai_khoan FROM NhanVien WHERE chuyen_mon LIKE N'%Bác sĩ%' OR chuyen_mon LIKE N'%bác sĩ%'"));
            result.put("TaiKhoan_Doctor_Sample", jdbcTemplate.queryForList("SELECT id_tai_khoan, ten_dang_nhap, id_vai_tro FROM TaiKhoan WHERE id_vai_tro = 'VT-8'"));
            result.put("NhanVien", jdbcTemplate.queryForList("SELECT ho_ten, id_tai_khoan, chuyen_mon, email FROM NhanVien"));
            result.put("LichHen_Schema", jdbcTemplate.queryForList("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LichHen'"));
            result.put("TaiKhoan_Raw", jdbcTemplate.queryForList("SELECT ten_dang_nhap, id_vai_tro, id_khach_hang, id_nhan_vien FROM TaiKhoan"));
            result.put("KhachHang_Schema", jdbcTemplate.queryForList("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'KhachHang'"));
            result.put("DichVu_Schema", jdbcTemplate.queryForList("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DichVu'"));
            result.put("Thuoc_Schema", jdbcTemplate.queryForList("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Thuoc'"));
            result.put("HoSoBenhAn_Schema", jdbcTemplate.queryForList("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HoSoBenhAn'"));
            result.put("Detailed_Accounts", jdbcTemplate.queryForList(
                "SELECT tk.ten_dang_nhap, vt.ten_vai_tro, ISNULL(nv.ho_ten, kh.ten_khach_hang) as ho_ten " +
                "FROM TaiKhoan tk " +
                "LEFT JOIN VaiTroHeThong vt ON tk.id_vai_tro = vt.id_vai_tro " +
                "LEFT JOIN NhanVien nv ON tk.id_nhan_vien = nv.id_nhan_vien " +
                "LEFT JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang " +
                "ORDER BY vt.ten_vai_tro"
            ));
            result.put("NhanVien_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NhanVien", Integer.class));
            result.put("DichVu_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM DichVu", Integer.class));
            result.put("TaiKhoan_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM TaiKhoan", Integer.class));
            result.put("LichHen_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichHen", Integer.class));
            result.put("ThuCung_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ThuCung", Integer.class));
            result.put("KhachHang_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KhachHang", Integer.class));
            result.put("Schedules_Count", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichLamViecNhanVien", Integer.class));
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }
}
