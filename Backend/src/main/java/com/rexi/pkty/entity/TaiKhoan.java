package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "TaiKhoan") // Káº¿t ná»‘i báº£ng TaiKhoan
@Data
public class TaiKhoan {
    @Id
    private String id_tai_khoan;

    private String ten_dang_nhap;
    private String mat_khau;
    private String id_vai_tro;
    private String trang_thai;
    private LocalDateTime ngay_tao;
    private String id_khach_hang;
    private String id_nhan_vien;
    private String mat_khau_hash;
    private Boolean welcome_email_sent;

    @ManyToOne
    @JoinColumn(name = "id_khach_hang", insertable = false, updatable = false)
    private KhachHang khach_hang;
}

