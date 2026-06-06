package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LichHen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface LichHenRepository extends JpaRepository<LichHen, String> {

    // Get lich hen hom nay tu View
    @Query(value = "SELECT * FROM v_LichHenHomNay", nativeQuery = true)
    List<Map<String, Object>> getTodayAppointments();

    // Get lich hen by idKhachHang
    @Query("SELECT l FROM LichHen l WHERE l.id_khach_hang = :idKhachHang ORDER BY l.ngay_kham DESC")
    List<LichHen> findByIdKhachHang(@Param("idKhachHang") String idKhachHang);

    // Get all appointments (ADMIN)
    @Query(value = "SELECT l.*, t.ten_thu_cung, nv.ho_ten as ten_bac_si FROM LichHen l " +
                   "LEFT JOIN ThuCung t ON l.id_thu_cung = t.id_thu_cung " +
                   "LEFT JOIN NhanVien nv ON l.id_bac_si = nv.id_nhan_vien " +
                   "ORDER BY l.ngay_kham DESC, l.gio_kham DESC", nativeQuery = true)
    List<Map<String, Object>> getAllAppointments();
}


