package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ThanhToan")
@Data
public class ThanhToan {
    @Id
    private String id_thanh_toan;

    private String id_hoa_don;
    private BigDecimal so_tien;
    private String phuong_thuc;
    private LocalDateTime ngay_tra_tien;
    private String id_nhan_vien;
    private String ma_giao_dich_ngan_hang;
    private String ghi_chu;
}

