package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "BenhAn_XetNghiem")
@Data
public class BenhAn_XetNghiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_ba_xn;

    private String id_benh_an;
    private String id_loai_xet_nghiem;
    private LocalDateTime ngay_chi_dinh;
    private String trang_thai;
}

