package com.rexi.pkty.repository;

import com.rexi.pkty.entity.ThuCung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ThuCungRepository extends JpaRepository<ThuCung, String> {
    @Query(value = "SELECT t.*, (SELECT TOP 1 CONVERT(VARCHAR, ngay_kham, 103) FROM LichHen WHERE id_thu_cung = t.id_thu_cung AND trang_thai NOT IN (N'Đã hủy', 'da_huy') ORDER BY ngay_kham DESC) as lich_kham_cuoi " +
                   "FROM ThuCung t WHERE t.id_khach_hang = :idKhachHang AND (t.da_xoa = 0 OR t.da_xoa IS NULL)", nativeQuery = true)
    List<java.util.Map<String, Object>> findByKhachHang(@Param("idKhachHang") String idKhachHang);
}

