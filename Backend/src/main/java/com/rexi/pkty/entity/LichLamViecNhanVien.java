package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "LichLamViecNhanVien") // Káº¿t ná»‘i báº£ng lá»‹ch lÃ m viá»‡c
@Data
public class LichLamViecNhanVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_lich_lam_viec;

    private String id_nhan_vien;
    private LocalDate ngay_lam;
    private LocalTime gio_bat_dau;
    private LocalTime gio_ket_thuc;
    private String ghi_chu;
}

