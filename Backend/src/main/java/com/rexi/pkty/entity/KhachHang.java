package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "KhachHang")
@Data
public class KhachHang {
    @Id
    private String id_khach_hang;

    private String ten_khach_hang;
    private String email;
    private String sdt;
    private String dia_chi;
    private LocalDateTime ngay_tao;
    private LocalDateTime ngay_cap_nhat;
    private String hinh_anh;
    private Boolean da_xoa;

    // Kiểm tra đăng ký nhận email marketing
    private Boolean nhan_email;

    // Kiểm tra đăng ký nhận thông báo SMS
    private Boolean nhan_sms;

    private Integer nam_sinh;
}

