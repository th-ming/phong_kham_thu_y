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

        // Get ds lo thuoc
        @Query(value = "SELECT * FROM LoThuoc", nativeQuery = true)
        List<Map<String, Object>> getAllLoThuoc();

        // Tke theo BS (View)
        @Query(value = "SELECT TenBacSi, SoLichHen, SoHoSo, TongDoanhThu FROM v_ThongKe_BacSi", nativeQuery = true)
        List<Map<String, Object>> getThongKeBacSi();

        // Tke ty le pet
        @Query(value = "SELECT COALESCE(loai, 'Khác') as LoaiThuCung, COUNT(*) as SoLuong FROM ThuCung GROUP BY COALESCE(loai, 'Khác')", nativeQuery = true)
        List<Map<String, Object>> getThongKeThuCung();

        // Tke dt theo dich vu
        @Query(value = "SELECT dv.ten_dich_vu as TenDichVu, SUM(hd.tong_tien_cuoi) as DoanhThu " +
                        "FROM HoaDon hd " +
                        "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                        "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE UPPER(TRIM(hd.trang_thai)) = 'DA_THANH_TOAN' " +
                        "GROUP BY dv.ten_dich_vu " +
                        "ORDER BY DoanhThu DESC", nativeQuery = true)
        List<Map<String, Object>> getDoanhThuTheoDichVu();
}
