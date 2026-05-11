package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DanhGiaDichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DanhGiaDichVuRepository extends JpaRepository<DanhGiaDichVu, Integer> {
    List<DanhGiaDichVu> findByIdDichVu(String idDichVu);
    List<DanhGiaDichVu> findByIdKhachHang(String idKhachHang);
}
