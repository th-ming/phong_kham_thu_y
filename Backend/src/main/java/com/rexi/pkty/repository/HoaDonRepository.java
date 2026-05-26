package com.rexi.pkty.repository;

import com.rexi.pkty.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

        // Call SP lap hoa don
        @Query(value = "EXEC sp_LapHoaDon :apptId, :taxRate, :discount, :staffId, :note", nativeQuery = true)
        List<Map<String, Object>> callSpLapHoaDon(
                        @Param("apptId") String apptId,
                        @Param("taxRate") BigDecimal taxRate,
                        @Param("discount") BigDecimal discount,
                        @Param("staffId") String staffId,
                        @Param("note") String note);

        // Get thuoc sap het han tu View
        @Query(value = "SELECT * FROM v_ThuocSapHetHan", nativeQuery = true)
        List<Map<String, Object>> getThuocSapHetHan();

        // Get dt thang tu View
        @Query(value = "SELECT * FROM v_DoanhThu_TheoThang", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuThang();

        // Get ds hd by idKhachHang
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "WHERE hd.id_khach_hang = :customerId " +
                        "ORDER BY hd.id_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> findByCustomerId(@Param("customerId") String customerId);

        // Get all hd (ADMIN)
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "ORDER BY hd.ngay_lap_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> getAllHoaDon();

        // Get ds thuoc
        @Query(value = "SELECT t.*, ISNULL(SUM(CASE WHEN lt.han_su_dung >= CAST(GETDATE() AS DATE) THEN lt.so_luong_ton ELSE 0 END), 0) AS so_luong_ton FROM Thuoc t LEFT JOIN LoThuoc lt ON t.id_thuoc = lt.id_thuoc GROUP BY t.id_thuoc, t.ten_thuoc, t.thanh_phan, t.dang_bao_che, t.don_vi, t.mo_ta, t.gia_ban, t.trang_thai, t.da_xoa", nativeQuery = true)
        List<Map<String, Object>> getAllThuoc();

        // Get ds lo thuoc
        @Query(value = "SELECT * FROM LoThuoc", nativeQuery = true)
        List<Map<String, Object>> getAllLoThuoc();

        // Bcao dt thang tu hoa don da_thanh_toan
        @Query(value = "SELECT YEAR(ngay_lap_hoa_don) AS Nam, MONTH(ngay_lap_hoa_don) AS Thang, SUM(tong_tien_cuoi) AS TongDoanhThu "
                        +
                        "FROM HoaDon " +
                        "WHERE UPPER(LTRIM(RTRIM(trang_thai))) = 'DA_THANH_TOAN' " +
                        "GROUP BY YEAR(ngay_lap_hoa_don), MONTH(ngay_lap_hoa_don) " +
                        "ORDER BY Nam DESC, Thang DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoThang();

        // Tke theo BS (View)
        @Query(value = "SELECT TenBacSi, SoLichHen, SoHoSo, TongDoanhThu FROM v_ThongKe_BacSi", nativeQuery = true)
        List<Map<String, Object>> getThongKeBacSi();

        // Bcao dt 7 ngay gan nhat
        @Query(value = "SELECT CAST(ngay_lap_hoa_don AS DATE) as Ngay, SUM(tong_tien_cuoi) as TongDoanhThu FROM HoaDon WHERE UPPER(LTRIM(RTRIM(trang_thai))) = 'DA_THANH_TOAN' AND ngay_lap_hoa_don >= DATEADD(day, -6, CAST(GETDATE() AS DATE)) GROUP BY CAST(ngay_lap_hoa_don AS DATE) ORDER BY Ngay ASC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoNgay();

        // Tke ty le pet
        @Query(value = "SELECT ISNULL(loai, N'Khác') as LoaiThuCung, COUNT(*) as SoLuong FROM ThuCung GROUP BY ISNULL(loai, N'Khác')", nativeQuery = true)
        List<Map<String, Object>> getThongKeThuCung();

        // Tke dt theo dich vu
        @Query(value = "SELECT dv.ten_dich_vu as TenDichVu, SUM(hd.tong_tien_cuoi) as DoanhThu " +
                        "FROM HoaDon hd " +
                        "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                        "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE UPPER(LTRIM(RTRIM(hd.trang_thai))) = 'DA_THANH_TOAN' " +
                        "GROUP BY dv.ten_dich_vu " +
                        "ORDER BY DoanhThu DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoDichVu();
}

