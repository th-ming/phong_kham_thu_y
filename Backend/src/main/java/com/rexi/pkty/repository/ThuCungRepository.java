package com.rexi.pkty.repository;

import com.rexi.pkty.entity.ThuCung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ThuCungRepository extends JpaRepository<ThuCung, String> {
    @Query("SELECT t FROM ThuCung t WHERE t.id_khach_hang = :idKhachHang AND (t.da_xoa = false OR t.da_xoa IS NULL)")
    List<ThuCung> findByKhachHang(@Param("idKhachHang") String idKhachHang);
}

