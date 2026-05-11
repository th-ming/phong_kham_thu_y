package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "LichHen") // Káº¿t ná»‘i báº£ng lá»‹ch háº¹n
@Data
public class LichHen {
    @Id
    private String id_lich_hen;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate ngay_kham;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm:ss")
    private LocalTime gio_kham;
    private String ly_do;
    private String trang_thai;
    private String id_khach_hang;
    private String id_thu_cung;
    private String id_bac_si;
    private String id_dich_vu; // ThÃªm trÆ°á»ng nÃ y
    private String id_nguoi_dat;
    private String phong_kham;
    private String ghi_chu_noi_bo;
    private LocalDateTime ngay_tao;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        if (this.ngay_tao == null) {
            this.ngay_tao = java.time.LocalDateTime.now();
        }
    }
}

