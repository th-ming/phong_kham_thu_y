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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_thanh_toan;

    private String id_hoa_don;
    private LocalDateTime ngay_thanh_toan;
    private BigDecimal so_tien;
    private String phuong_thuc;
    private String trang_thai;
}

