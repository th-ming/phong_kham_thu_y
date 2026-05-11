package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "NhanVien")
@Data
public class NhanVien {
    @Id
    @Column(name = "id_nhan_vien")
    private String idNhanVien;

    @Column(name = "id_tai_khoan")
    private String idTaiKhoan;

    @Column(name = "ho_ten", length = 100)
    private String hoTen;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "gioi_tinh", length = 10)
    private String gioiTinh;

    @Column(name = "dia_chi", length = 255)
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 255)
    private String soDienThoai;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "so_cccd", length = 20)
    private String soCccd;

    @Column(name = "ngay_vao_lam", nullable = false)
    private LocalDate ngayVaoLam;

    @Column(name = "ngay_nghi_viec")
    private LocalDate ngayNghiViec;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;

    @Column(name = "hinh_anh", columnDefinition = "NVARCHAR(MAX)")
    private String hinhAnh;

    @Column(name = "gioi_thieu", columnDefinition = "NVARCHAR(MAX)")
    private String gioiThieu;

    @Column(name = "chuyen_mon", columnDefinition = "NVARCHAR(255)")
    private String chuyenMon;

    @Column(name = "nhan_email")
    private Boolean nhanEmail;

    @Column(name = "nhan_sms")
    private Boolean nhanSms;

    @Column(name = "da_xoa", nullable = false)
    private Boolean daXoa;
}
