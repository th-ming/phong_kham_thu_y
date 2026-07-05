package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "TaiKhoan")
@Data
public class TaiKhoan {
    @Id
    private String id_tai_khoan;

    @Column(name = "ten_dang_nhap")
    private String ten_dang_nhap;

    @Column(name = "mat_khau")
    private String mat_khau;

    @Column(name = "id_vai_tro")
    private String id_vai_tro;

    @Column(name = "trang_thai")
    private String trang_thai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngay_tao;

    @Column(name = "id_khach_hang")
    private String id_khach_hang;

    @Column(name = "id_nhan_vien")
    private String id_nhan_vien;

    @Column(name = "mat_khau_hash")
    private String mat_khau_hash;

    @Column(name = "welcome_email_sent")
    private Boolean welcome_email_sent;

    @ManyToOne
    @JoinColumn(name = "id_khach_hang", insertable = false, updatable = false)
    private KhachHang khach_hang;
}
