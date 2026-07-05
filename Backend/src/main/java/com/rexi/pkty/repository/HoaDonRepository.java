package com.rexi.pkty.repository;

import com.rexi.pkty.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

        // Get thuoc sap het han tu View (chỉ có trong PostgreSQL script)
        @Query(value = "SELECT * FROM v_ThuocSapHetHan", nativeQuery = true)
        List<Map<String, Object>> getThuocSapHetHan();

        // Get dt thang tu View (chỉ có trong PostgreSQL script)
        @Query(value = "SELECT * FROM v_DoanhThu_TheoThang", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuThang();

        // Lấy danh sách hóa đơn theo mã khách hàng
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "WHERE hd.id_khach_hang = :customerId " +
                        "ORDER BY hd.id_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> findByCustomerId(@Param("customerId") String customerId);

        // Lấy tất cả hóa đơn (quản trị viên)
        @Query(value = "SELECT hd.*, t.ten_thu_cung, k.ten_khach_hang, k.sdt, nv.ho_ten as ten_nhan_vien FROM HoaDon hd "
                        +
                        "LEFT JOIN LichHen l ON hd.id_lich_hen = l.id_lich_hen " +
                        "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                        "LEFT JOIN KhachHang k ON hd.id_khach_hang = k.id_khach_hang " +
                        "LEFT JOIN NhanVien nv ON hd.id_nhan_vien = nv.id_nhan_vien " +
                        "ORDER BY hd.ngay_lap_hoa_don DESC", nativeQuery = true)
        List<Map<String, Object>> getAllHoaDon();

        // Get ds lo thuoc
        @Query(value = "SELECT * FROM LoThuoc", nativeQuery = true)
        List<Map<String, Object>> getAllLoThuoc();

        // Thống kê theo bác sĩ - dùng LIKE thay ILIKE để tương thích SQL Server & PostgreSQL
        // Lọc theo id_nhan_vien LIKE 'BS-%' hoặc chuyên môn chứa 'bác sĩ' (case-insensitive via UPPER)
        @Query(value = "SELECT nv.ho_ten AS TenBacSi, " +
                        "COUNT(lh.id_lich_hen) AS SoLichHen, " +
                        "COUNT(DISTINCT lh.id_thu_cung) AS SoHoSo, " +
                        "COALESCE(SUM(CASE WHEN UPPER(TRIM(hd.trang_thai)) = 'DA_THANH_TOAN' THEN hd.tong_tien_cuoi ELSE 0 END), 0) AS TongDoanhThu " +
                        "FROM NhanVien nv " +
                        "LEFT JOIN LichHen lh ON nv.id_nhan_vien = lh.id_bac_si " +
                        "LEFT JOIN HoaDon hd ON lh.id_lich_hen = hd.id_lich_hen " +
                        "WHERE nv.id_nhan_vien LIKE 'BS-%' " +
                        "GROUP BY nv.ho_ten " +
                        "ORDER BY SoHoSo DESC", nativeQuery = true)
        List<Map<String, Object>> getThongKeBacSi();

        // Thống kê tỷ lệ thú cưng - COALESCE tương thích cả SQL Server lẫn PostgreSQL
        @Query(value = "SELECT COALESCE(loai, 'Khac') as LoaiThuCung, COUNT(*) as SoLuong FROM ThuCung GROUP BY COALESCE(loai, 'Khac')", nativeQuery = true)
        List<Map<String, Object>> getThongKeThuCung();

        // Thống kê doanh thu theo dịch vụ - ORDER BY expression (không dùng alias) để tương thích cross-DB
        @Query(value = "SELECT dv.ten_dich_vu as TenDichVu, COALESCE(SUM(hd.tong_tien_cuoi), 0) as DoanhThu " +
                        "FROM HoaDon hd " +
                        "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                        "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE UPPER(TRIM(hd.trang_thai)) = 'DA_THANH_TOAN' " +
                        "GROUP BY dv.ten_dich_vu " +
                        "ORDER BY COALESCE(SUM(hd.tong_tien_cuoi), 0) DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoDichVu();

        // Thong ke hoa don theo khach hang (tong, da thanh toan, chua thanh toan, tong tien da tra)
        @Query(value = "SELECT COUNT(*) as tong, " +
                        "SUM(CASE WHEN UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' THEN 1 ELSE 0 END) as da_thanh_toan, " +
                        "SUM(CASE WHEN UPPER(TRIM(trang_thai)) IN ('CHO_THANH_TOAN','DANG_THANH_TOAN') THEN 1 ELSE 0 END) as chua_thanh_toan, " +
                        "COALESCE(SUM(CASE WHEN UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' THEN tong_tien_cuoi ELSE 0 END), 0) as tong_tien_da_tra " +
                        "FROM HoaDon WHERE id_khach_hang = :customerId", nativeQuery = true)
        Map<String, Object> getInvoiceStatsByCustomerId(@Param("customerId") String customerId);
}
