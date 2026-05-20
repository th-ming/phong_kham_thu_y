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

    // Cấu hình khách hàng đồng ý nhận email marketing (true/false)
    private Boolean nhan_email;

    // Cấu hình khách hàng đồng ý nhận thông báo qua SMS (true/false)
    private Boolean nhan_sms;
}

