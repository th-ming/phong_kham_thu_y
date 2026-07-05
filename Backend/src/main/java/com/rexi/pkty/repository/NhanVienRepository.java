package com.rexi.pkty.repository;

import com.rexi.pkty.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, String> {

    // Lấy danh sách bác sĩ - JPQL đa cơ sở dữ liệu (hoạt động trên cả SQL Server và PostgreSQL)
    @Query("SELECT nv FROM NhanVien nv WHERE (nv.da_xoa IS NULL OR nv.da_xoa = false) " +
            "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bác sĩ%' " +
            "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' " +
            "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' " +
            "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien " +
            "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) " +
            "ORDER BY nv.ho_ten ASC")
    List<NhanVien> findAllBacSi();

    // Get tu View v_ThongKe_BacSi
    @Query(value = "SELECT * FROM v_ThongKe_BacSi", nativeQuery = true)
    List<Map<String, Object>> getBacSiStats();

    @Query(value = "SELECT * FROM NhanVien WHERE ho_ten = ?1", nativeQuery = true)
    java.util.Optional<NhanVien> findByHoTen(String ho_ten);

    // Get direct by email
    @Query("SELECT nv FROM NhanVien nv WHERE nv.email = ?1")
    java.util.Optional<NhanVien> findByEmail(String email);
}


