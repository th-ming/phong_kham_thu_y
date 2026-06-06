package com.rexi.pkty.repository;

import com.rexi.pkty.entity.HoSoBenhAn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface HoSoBenhAnRepository extends JpaRepository<HoSoBenhAn, String> {

    // Get ket qua XN tu BenhAn_XetNghiem
    @Query(value = "SELECT bx.*, COALESCE(l.ten_xet_nghiem, bx.id_loai_xet_nghiem) AS ten_xet_nghiem FROM BenhAn_XetNghiem bx " +
                   "LEFT JOIN LoaiXetNghiem l ON bx.id_loai_xet_nghiem = CAST(l.id_loai_xet_nghiem AS varchar) " +
                   "WHERE bx.id_ho_so = :hosoId", nativeQuery = true)
    List<Map<String, Object>> findXetNghiemByHoSo(@Param("hosoId") String hosoId);

    // Get ds hs benh an by idKhachHang
    @Query(value = "SELECT h.*, t.ten_thu_cung, k.ten_khach_hang, nv.ho_ten as ten_bac_si FROM HoSoBenhAn h " +
                   "JOIN LichHen l ON h.id_lich_hen = l.id_lich_hen " +
                   "JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang " +
                   "LEFT JOIN NhanVien nv ON h.id_bac_si = nv.id_nhan_vien " +
                   "WHERE k.id_khach_hang = :customerId " +
                   "ORDER BY h.ngay_kham DESC", nativeQuery = true)
    List<Map<String, Object>> findByCustomerId(@Param("customerId") String customerId);

    // Get all hs benh an (ADMIN)
    @Query(value = "SELECT h.*, t.ten_thu_cung, k.ten_khach_hang, nv.ho_ten as ten_bac_si FROM HoSoBenhAn h " +
                   "JOIN LichHen l ON h.id_lich_hen = l.id_lich_hen " +
                   "JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang " +
                   "LEFT JOIN NhanVien nv ON h.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY h.ngay_kham DESC", nativeQuery = true)
    List<Map<String, Object>> getAllHoSoBenhAn();

    // Get all XN (ADMIN)
    @Query(value = "SELECT bx.*, COALESCE(l.ten_xet_nghiem, bx.id_loai_xet_nghiem) AS ten_xet_nghiem, nv.ho_ten as ten_bac_si FROM BenhAn_XetNghiem bx " +
                   "LEFT JOIN LoaiXetNghiem l ON bx.id_loai_xet_nghiem = CAST(l.id_loai_xet_nghiem AS varchar) " +
                   "LEFT JOIN NhanVien nv ON bx.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY bx.ngay_lay_mau DESC", nativeQuery = true)
    List<Map<String, Object>> getAllXetNghiem();

    // Get all don thuoc (ADMIN)
    @Query(value = "SELECT dt.*, t.ten_thuoc, tc.ten_thu_cung FROM DonThuoc_ChiTiet dt " +
                   "JOIN Thuoc t ON dt.id_thuoc = t.id_thuoc " +
                   "JOIN HoSoBenhAn hs ON dt.id_ho_so_benh_an = hs.id_ho_so " +
                   "JOIN LichHen lh ON hs.id_lich_hen = lh.id_lich_hen " +
                   "JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                   "ORDER BY dt.id_don_thuoc DESC", nativeQuery = true)
    List<Map<String, Object>> getAllDonThuoc();
}

