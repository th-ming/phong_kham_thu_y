package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ThongBao")
@Data
public class ThongBao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_thong_bao;

    private String id_tai_khoan;
    private String tieu_de;
    private String noi_dung;
    private String loai_thong_bao;
    private Boolean da_doc;
    private LocalDateTime ngay_tao;
}

