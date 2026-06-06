package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, String> {
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM DichVu WHERE LOWER(CAST(trang_thai AS varchar)) IN ('1', 'true') LIMIT 8", nativeQuery = true)
    java.util.List<DichVu> findTop8ActiveServices();

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM DichVu WHERE LOWER(CAST(trang_thai AS varchar)) IN ('1', 'true')", nativeQuery = true)
    java.util.List<DichVu> findAllActiveServices();
}



