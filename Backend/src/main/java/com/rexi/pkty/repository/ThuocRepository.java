package com.rexi.pkty.repository;

import com.rexi.pkty.entity.Thuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ThuocRepository extends JpaRepository<Thuoc, String> {

    // Tối ưu: Tìm kiếm không phân biệt dấu tiếng Việt (Smart Search)
    @Query(value = "SELECT TOP 20 * FROM Thuoc WHERE (da_xoa = 0 OR da_xoa IS NULL) AND ten_thuoc COLLATE SQL_Latin1_General_CP1_CI_AI LIKE %:keyword% COLLATE SQL_Latin1_General_CP1_CI_AI", nativeQuery = true)
    List<Thuoc> searchThuoc(@Param("keyword") String keyword);
}
