package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "LoThuoc")
@Data
public class LoThuoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_lo;

    private String id_thuoc;
    private String so_lo;
    private LocalDate ngay_san_xuat;
    private LocalDate ngay_het_han;
    private Integer so_luong_ton;
    private String id_ncc;
    private LocalDateTime ngay_nhap;
}

