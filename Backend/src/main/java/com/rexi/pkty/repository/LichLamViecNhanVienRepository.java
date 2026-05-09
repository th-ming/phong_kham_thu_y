package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LichLamViecNhanVienRepository extends JpaRepository<LichLamViecNhanVien, String> {
    
    // Tìm lịch làm việc theo id nhân viên (Dùng dấu gạch dưới để khớp Entity)
    @Query("SELECT l FROM LichLamViecNhanVien l WHERE l.id_nhan_vien = :id")
    List<LichLamViecNhanVien> findByIdNhanVien(@Param("id") String id);
}


