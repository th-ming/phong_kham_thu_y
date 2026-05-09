package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "LichSuTuVan")
@Data
public class LichSuTuVan {
    @Id
    private String id_tu_van;

    private String id_khach_hang;
    private String id_thu_cung;
    private String id_bac_si;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String noi_dung_khach;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String noi_dung_rexi;

    private LocalDateTime ngay_tu_van = LocalDateTime.now();
}

