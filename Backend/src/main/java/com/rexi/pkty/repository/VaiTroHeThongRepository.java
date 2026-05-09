package com.rexi.pkty.repository;

import com.rexi.pkty.entity.VaiTroHeThong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface VaiTroHeThongRepository extends JpaRepository<VaiTroHeThong, String> {
    @Query("SELECT v FROM VaiTroHeThong v WHERE v.ten_vai_tro = :ten")
    Optional<VaiTroHeThong> findByTen_vai_tro(@Param("ten") String ten);
}


