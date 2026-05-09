package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LichSuTuVan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuTuVanRepository extends JpaRepository<LichSuTuVan, String> {
    @Query("SELECT l FROM LichSuTuVan l WHERE l.id_thu_cung = :idThuCung ORDER BY l.ngay_tu_van DESC")
    List<LichSuTuVan> findByThuCungId(@Param("idThuCung") String idThuCung);
}


