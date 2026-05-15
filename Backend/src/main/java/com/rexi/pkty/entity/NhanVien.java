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
    private String id_nhan_vien;

    @Transient
    private String mat_khau;

    @Column(name = "id_tai_khoan")
    private String id_tai_khoan;

    @Column(name = "ho_ten", length = 100)
    private String ho_ten;

    @Column(name = "ngay_sinh")
    private LocalDate ngay_sinh;

    @Column(name = "gioi_tinh", length = 10)
    private String gioi_tinh;

    @Column(name = "dia_chi", length = 255)
    private String dia_chi;

    @Column(name = "so_dien_thoai", length = 255)
    private String so_dien_thoai;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "so_cccd", length = 20)
    private String so_cccd;

    @Column(name = "ngay_vao_lam", nullable = false)
    private LocalDate ngay_vao_lam;

    @Column(name = "ngay_nghi_viec")
    private LocalDate ngay_nghi_viec;

    @Column(name = "trang_thai", length = 50)
    private String trang_thai;

    @Column(name = "hinh_anh", columnDefinition = "NVARCHAR(MAX)")
    private String hinh_anh;

    @Column(name = "gioi_thieu", columnDefinition = "NVARCHAR(MAX)")
    private String gioi_thieu;

    @Column(name = "chuyen_mon", columnDefinition = "NVARCHAR(255)")
    private String chuyen_mon;

    @Column(name = "nhan_email")
    private Boolean nhan_email;

    @Column(name = "nhan_sms")
    private Boolean nhan_sms;

    @Column(name = "da_xoa", nullable = false)
    private Boolean da_xoa;
}
