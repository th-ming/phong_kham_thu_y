package com.rexi.pkty.repository;

import com.rexi.pkty.entity.Thuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ThuocRepository extends JpaRepository<Thuoc, String> {

    // TÃ¡Â»â€˜i Ã†Â°u: ChÃ¡Â»â€° tÃƒÂ¬m vÃƒÂ  trÃ¡ÂºÂ£ vÃ¡Â»Â tÃ¡Â»â€˜i Ã„â€˜a 20 loÃ¡ÂºÂ¡i thuÃ¡Â»â€˜c khÃ¡Â»â€ºp vÃ¡Â»â€ºi tÃ¡Â»Â« khÃƒÂ³a
    @Query(value = "SELECT TOP 20 * FROM Thuoc WHERE ten_thuoc LIKE %:keyword%", nativeQuery = true)
    List<Thuoc> searchThuoc(@Param("keyword") String keyword);
}



