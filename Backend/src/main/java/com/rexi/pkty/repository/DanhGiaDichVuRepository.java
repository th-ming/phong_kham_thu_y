package com.rexi.pkty.repository;

import com.rexi.pkty.entity.DanhGiaDichVu;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DanhGiaDichVuRepository extends JpaRepository<DanhGiaDichVu, Integer> {
    List<DanhGiaDichVu> findByIdDichVu(String idDichVu);
    List<DanhGiaDichVu> findByIdKhachHang(String idKhachHang);

    // Đánh giá mới nhất có nội dung (public homepage) — JPQL chuẩn, chạy cả SQL Server lẫn Postgres
    @Query("SELECT dg FROM DanhGiaDichVu dg WHERE dg.noiDung IS NOT NULL AND dg.noiDung <> '' ORDER BY dg.ngayDanhGia DESC")
    List<DanhGiaDichVu> findRecentWithContent(Pageable pageable);

    @Query("SELECT AVG(dg.soSao) FROM DanhGiaDichVu dg WHERE dg.noiDung IS NOT NULL AND dg.noiDung <> ''")
    Double avgSaoWithContent();

    @Query("SELECT COUNT(dg) FROM DanhGiaDichVu dg WHERE dg.noiDung IS NOT NULL AND dg.noiDung <> ''")
    long countWithContent();
}
