package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "LoThuoc")
@Data
public class LoThuoc {
    @Id
    private String id_lo;

    private String id_thuoc;
    private String so_lo;
    private LocalDate ngay_nhap;
    private LocalDate han_su_dung;
    private java.math.BigDecimal gia_nhap;
    private Integer so_luong_nhap;
    private Integer so_luong_ton;
    private String id_ncc;
}

