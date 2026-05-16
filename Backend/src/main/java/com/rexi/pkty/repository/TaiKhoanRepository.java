package com.rexi.pkty.repository;

import com.rexi.pkty.entity.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, String> {
    
    @Query("SELECT t FROM TaiKhoan t WHERE t.id_khach_hang = :idKhachHang")
    java.util.Optional<TaiKhoan> findByIdKhachHang(@Param("idKhachHang") String idKhachHang);

    @Query("SELECT t FROM TaiKhoan t WHERE t.id_nhan_vien = :idNhanVien")
    java.util.Optional<TaiKhoan> findByIdNhanVien(@Param("idNhanVien") String idNhanVien);

    
    // Tìm user theo tên đăng nhập
    @Query("SELECT t FROM TaiKhoan t WHERE t.ten_dang_nhap = :username")
    Optional<TaiKhoan> findByTenDangNhap(@Param("username") String username);

    // Tìm user theo Email (của cả Khách hàng và Nhân viên) - Sử dụng Native Query để join đa bảng
    @Query(value = "SELECT t.* FROM TaiKhoan t LEFT JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang LEFT JOIN NhanVien n ON t.id_nhan_vien = n.id_nhan_vien WHERE k.email = :email OR n.email = :email", nativeQuery = true)
    List<TaiKhoan> findByEmail(@Param("email") String email);

    // Tìm user theo SĐT (của cả Khách hàng và Nhân viên) - Sử dụng Native Query để join đa bảng
    @Query(value = "SELECT t.* FROM TaiKhoan t LEFT JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang LEFT JOIN NhanVien n ON t.id_nhan_vien = n.id_nhan_vien WHERE k.so_dien_thoai = :phone OR n.so_dien_thoai = :phone", nativeQuery = true)
    List<TaiKhoan> findBySdt(@Param("phone") String phone);

    // Gọi Stored Procedure Đăng nhập
    @Query(value = "EXEC sp_DangNhap :username", nativeQuery = true)
    List<Map<String, Object>> callSpDangNhap(@Param("username") String username);

    // Gọi Stored Procedure Đăng ký
    @Query(value = "EXEC sp_DangKyKhachHang :username, :password, :name, :email, :phone, :address", nativeQuery = true)
    List<Map<String, Object>> callSpDangKy(
        @Param("username") String username,
        @Param("password") String password,
        @Param("name") String name,
        @Param("email") String email,
        @Param("phone") String phone,
        @Param("address") String address
    );
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE TaiKhoan SET mat_khau = :newPass, mat_khau_hash = :newPass WHERE ten_dang_nhap = :username", nativeQuery = true)
    void changePassword(@Param("username") String username, @Param("newPass") String newPass);
}


