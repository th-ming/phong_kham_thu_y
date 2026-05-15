package com.rexi.pkty.repository;

import com.rexi.pkty.entity.Thuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ThuocRepository extends JpaRepository<Thuoc, String> {

    // Tối ưu: Chỉ tìm và trả về tối đa 20 loại thuốc khớp với từ khóa
    @Query(value = "SELECT TOP 20 * FROM Thuoc WHERE ten_thuoc LIKE %:keyword%", nativeQuery = true)
    List<Thuoc> searchThuoc(@Param("keyword") String keyword);
}
