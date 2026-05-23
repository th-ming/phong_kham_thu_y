package com.rexi.pkty.repository;

import com.rexi.pkty.entity.ThuCung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ThuCungRepository extends JpaRepository<ThuCung, String> {
    @Query(value = "SELECT t.*, (SELECT MAX(ngay_kham) FROM LichHen WHERE id_thu_cung = t.id_thu_cung AND trang_thai NOT IN (N'Đã hủy', 'da_huy')) as lich_kham_cuoi " +
                   "FROM ThuCung t WHERE t.id_khach_hang = :idKhachHang", nativeQuery = true)
    List<java.util.Map<String, Object>> findByKhachHang(@Param("idKhachHang") String idKhachHang);
}

