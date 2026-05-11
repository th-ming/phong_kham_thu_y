package com.rexi.pkty.repository;

import com.rexi.pkty.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, String> {

    // LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch bÃƒÂ¡c sÃ„Â© (vai_tro = 'bÃƒÂ¡c sÃ„Â©' thÃƒÂ´ng qua join bÃ¡ÂºÂ£ng VaiTroHeThong)
    @Query(value = "SELECT * FROM NhanVien WHERE id_tai_khoan IN (SELECT id_tai_khoan FROM TaiKhoan WHERE id_vai_tro = 'VT-8') AND da_xoa = 0", nativeQuery = true)
    List<NhanVien> findAllBacSi();

    // LÃ¡ÂºÂ¥y dÃ¡Â»Â¯ liÃ¡Â»â€¡u tÃ¡Â»Â« View v_ThongKe_BacSi
    @Query(value = "SELECT * FROM v_ThongKe_BacSi", nativeQuery = true)
    List<Map<String, Object>> getBacSiStats();

    @Query(value = "SELECT * FROM NhanVien WHERE ho_ten = ?1", nativeQuery = true)
    java.util.Optional<NhanVien> findByHoTen(String ho_ten);

    // TÃ¡Â»â€˜i Ã†Â°u: TÃƒÂ¬m trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p theo email, trÃƒÂ¡nh findAll().stream().filter()
    @Query(value = "SELECT TOP 1 * FROM NhanVien WHERE email = ?1", nativeQuery = true)
    java.util.Optional<NhanVien> findByEmail(String email);
}


