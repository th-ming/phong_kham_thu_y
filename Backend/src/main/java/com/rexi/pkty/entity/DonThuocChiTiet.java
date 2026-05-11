package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "DonThuocChiTiet")
@Data
public class DonThuocChiTiet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_chi_tiet;

    private String id_don_thuoc;
    private String id_thuoc;
    private Integer so_luong;
    private String lieu_dung;
}

