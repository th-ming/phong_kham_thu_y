package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "NhanVien") // Kết nối bảng NhanVien
@Data
public class NhanVien {
    @Id
    private String id_nhan_vien;

    private String id_tai_khoan;
    private String ho_ten;
    private LocalDate ngay_sinh;
    private String gioi_tinh;
    private String dia_chi;
    private String so_dien_thoai;
    private String email;
    private String so_cccd;
    private LocalDate ngay_vao_lam;
    private LocalDate ngay_nghi_viec;
    private String trang_thai;
    private String hinh_anh;
    private String gioi_thieu;
    private String chuyen_mon;
    private Boolean nhan_email;
    private Boolean nhan_sms;
    private Boolean da_xoa;
}

