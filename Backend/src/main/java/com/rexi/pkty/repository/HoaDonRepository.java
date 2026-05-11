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
public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {

        // GÃ¡Â»Âi Stored Procedure lÃ¡ÂºÂ­p hÃƒÂ³a Ã„â€˜Ã†Â¡n mÃ¡Â»â€ºi
        @Query(value = "EXEC sp_LapHoaDon :apptId, :taxRate, :discount, :staffId, :note", nativeQuery = true)
        List<Map<String, Object>> callSpLapHoaDon(
                        @Param("apptId") String apptId,
                        @Param("taxRate") BigDecimal taxRate,
                        @Param("discount") BigDecimal discount,
                        @Param("staffId") String staffId,
                        @Param("note") String note);

        // LÃ¡ÂºÂ¥y thuÃ¡Â»â€˜c sÃ¡ÂºÂ¯p hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n tÃ¡Â»Â« View
        @Query(value = "SELECT * FROM v_ThuocSapHetHan", nativeQuery = true)
        List<Map<String, Object>> getThuocSapHetHan();

        // LÃ¡ÂºÂ¥y bÃƒÂ¡o cÃƒÂ¡o doanh thu thÃƒÂ¡ng tÃ¡Â»Â« View
        @Query(value = "SELECT * FROM v_DoanhThu_TheoThang", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuThang();

        // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch hÃƒÂ³a Ã„â€˜Ã†Â¡n theo ID khÃƒÂ¡ch hÃƒÂ ng
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "WHERE hd.id_khach_hang = :customerId " +
                        "ORDER BY hd.id_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> findByCustomerId(@Param("customerId") String customerId);

        // LÃ¡ÂºÂ¥y tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ hÃƒÂ³a Ã„â€˜Ã†Â¡n (cho Admin)
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "ORDER BY hd.ngay_lap_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> getAllHoaDon();

        // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch thuÃ¡Â»â€˜c
        @Query(value = "SELECT * FROM Thuoc", nativeQuery = true)
        List<Map<String, Object>> getAllThuoc();

        // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch lÃƒÂ´ thuÃ¡Â»â€˜c
        @Query(value = "SELECT * FROM LoThuoc", nativeQuery = true)
        List<Map<String, Object>> getAllLoThuoc();

        // BÃƒÂ¡o cÃƒÂ¡o doanh thu theo thÃƒÂ¡ng (View)
        @Query(value = "SELECT Nam, Thang, TongDoanhThu FROM v_DoanhThu_TheoThang ORDER BY Nam DESC, Thang DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoThang();

        // ThÃ¡Â»â€˜ng kÃƒÂª theo bÃƒÂ¡c sÃ„Â© (View)
        @Query(value = "SELECT TenBacSi, SoLichHen, SoHoSo, TongDoanhThu FROM v_ThongKe_BacSi", nativeQuery = true)
        List<Map<String, Object>> getThongKeBacSi();

        // BÃƒÂ¡o cÃƒÂ¡o doanh thu theo ngÃƒÂ y (7 ngÃƒÂ y gÃ¡ÂºÂ§n nhÃ¡ÂºÂ¥t)
        @Query(value = "SELECT CAST(ngay_lap_hoa_don AS DATE) as Ngay, SUM(tong_tien_cuoi) as TongDoanhThu FROM HoaDon WHERE trang_thai = 'da_thanh_toan' AND ngay_lap_hoa_don >= DATEADD(day, -6, CAST(GETDATE() AS DATE)) GROUP BY CAST(ngay_lap_hoa_don AS DATE) ORDER BY Ngay ASC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoNgay();

        // ThÃ¡Â»â€˜ng kÃƒÂª tÃ¡Â»Â· lÃ¡Â»â€¡ thÃƒÂº cÃ†Â°ng
        @Query(value = "SELECT ISNULL(loai, N'KhÃƒÂ¡c') as LoaiThuCung, COUNT(*) as SoLuong FROM ThuCung GROUP BY ISNULL(loai, N'KhÃƒÂ¡c')", nativeQuery = true)
        List<Map<String, Object>> getThongKeThuCung();

        // ThÃ¡Â»â€˜ng kÃƒÂª doanh thu theo dÃ¡Â»â€¹ch vÃ¡Â»Â¥
        @Query(value = "SELECT dv.ten_dich_vu as TenDichVu, SUM(hd.tong_tien_cuoi) as DoanhThu " +
                        "FROM HoaDon hd " +
                        "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                        "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE hd.trang_thai = 'da_thanh_toan' " +
                        "GROUP BY dv.ten_dich_vu " +
                        "ORDER BY DoanhThu DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoDichVu();
}

