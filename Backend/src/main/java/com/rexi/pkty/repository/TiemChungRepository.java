package com.rexi.pkty.repository;

import com.rexi.pkty.entity.TiemChung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TiemChungRepository extends JpaRepository<TiemChung, Long> {
    
    // LÃ¡ÂºÂ¥y lÃ¡Â»â€¹ch sÃ¡Â»Â­ tiÃƒÂªm cÃ¡Â»Â§a 1 thÃƒÂº cÃ†Â°ng (DÃƒÂ¹ng Query Ã„â€˜Ã¡Â»Æ’ khÃ¡Â»â€ºp field id_thu_cung)
    @Query("SELECT t FROM TiemChung t WHERE t.id_thu_cung = :id")
    List<TiemChung> findByIdThuCung(@Param("id") String id);
}



