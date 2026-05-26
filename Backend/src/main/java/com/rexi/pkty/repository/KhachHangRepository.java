package com.rexi.pkty.repository;

import com.rexi.pkty.entity.KhachHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Repository
public interface KhachHangRepository extends JpaRepository<KhachHang, String> {
    java.util.Optional<KhachHang> findByEmail(String email);

    // Call SP cap nhat khach hang
    @Query(value = "EXEC sp_CapNhatThongTinKhachHang :id, :name, :email, :phone, :address, :namSinh", nativeQuery = true)
    List<Map<String, Object>> callSpUpdateKhachHang(
        @Param("id") String id,
        @Param("name") String name,
        @Param("email") String email,
        @Param("phone") String phone,
        @Param("address") String address,
        @Param("namSinh") Integer namSinh
    );

    @Modifying
    @Transactional
    @Query(value = "UPDATE KhachHang SET da_xoa = 1, ngay_cap_nhat = GETDATE() WHERE id_khach_hang = :id; " +
                   "UPDATE TaiKhoan SET trang_thai = N'inactive' WHERE id_khach_hang = :id", nativeQuery = true)
    void deactivateAccountByKhachHangId(@Param("id") String id);
}
