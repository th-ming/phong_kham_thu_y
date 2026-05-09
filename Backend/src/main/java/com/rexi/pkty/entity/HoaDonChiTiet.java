package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "HoaDonChiTiet")
@Data
public class HoaDonChiTiet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_chi_tiet;

    private String id_hoa_don;
    private String ten_muc;
    private Integer so_luong;
    private BigDecimal don_gia;
    private BigDecimal thanh_tien;
}

