package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, String> {

    @Query("SELECT d FROM DichVu d WHERE d.trang_thai = true ORDER BY d.id_dich_vu")
    List<DichVu> findTop8ActiveServices();

    @Query("SELECT d FROM DichVu d WHERE d.trang_thai = true")
    List<DichVu> findAllActiveServices();
}
