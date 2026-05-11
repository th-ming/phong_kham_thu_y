package com.rexi.pkty.repository;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LichLamViecNhanVienRepository extends JpaRepository<LichLamViecNhanVien, Long> {
    
    // TÃƒÂ¬m lÃ¡Â»â€¹ch lÃƒÂ m viÃ¡Â»â€¡c theo id nhÃƒÂ¢n viÃƒÂªn (DÃƒÂ¹ng dÃ¡ÂºÂ¥u gÃ¡ÂºÂ¡ch dÃ†Â°Ã¡Â»â€ºi Ã„â€˜Ã¡Â»Æ’ khÃ¡Â»â€ºp Entity)
    @Query("SELECT l FROM LichLamViecNhanVien l WHERE l.id_nhan_vien = :id")
    List<LichLamViecNhanVien> findByIdNhanVien(@Param("id") String id);
}



