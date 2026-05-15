package com.rexi.pkty.repository;

import com.rexi.pkty.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, String> {

    // Lấy danh sách bác sĩ (vai_tro = 'VT-BS')
    @Query(value = "SELECT * FROM NhanVien WHERE id_nhan_vien IN (SELECT id_nhan_vien FROM TaiKhoan WHERE id_vai_tro = 'VT-BS') AND da_xoa = 0", nativeQuery = true)
    List<NhanVien> findAllBacSi();

    // Lấy dữ liệu từ View v_ThongKe_BacSi
    @Query(value = "SELECT * FROM v_ThongKe_BacSi", nativeQuery = true)
    List<Map<String, Object>> getBacSiStats();

    @Query(value = "SELECT * FROM NhanVien WHERE ho_ten = ?1", nativeQuery = true)
    java.util.Optional<NhanVien> findByHoTen(String ho_ten);

    // Tối ưu: Tìm trực tiếp theo email, tránh findAll().stream().filter()
    @Query(value = "SELECT TOP 1 * FROM NhanVien WHERE email = ?1", nativeQuery = true)
    java.util.Optional<NhanVien> findByEmail(String email);
}


