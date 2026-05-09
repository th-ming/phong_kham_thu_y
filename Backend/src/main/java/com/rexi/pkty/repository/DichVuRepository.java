package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, String> {
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT TOP 8 * FROM DichVu WHERE trang_thai = 1", nativeQuery = true)
    java.util.List<DichVu> findTop8ActiveServices();
}


