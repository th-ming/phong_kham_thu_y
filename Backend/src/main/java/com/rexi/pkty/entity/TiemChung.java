package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "TiemChung") // Káº¿t ná»‘i báº£ng tiÃªm chá»§ng
@Data
public class TiemChung {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_tiem_chung;

    private String id_thu_cung;
    private String ten_vaccine;
    private LocalDate ngay_tiem;
    private LocalDate ngay_tiem_lai;
    private String loai_vaccine;
    private String id_bac_si;
    private String ghi_chu;
}

