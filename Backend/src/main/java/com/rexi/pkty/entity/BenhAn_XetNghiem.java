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
    private Long id_xet_nghiem_benh_an;

    private String id_ho_so;
    private Long id_loai_xet_nghiem;
    private LocalDateTime ngay_lay_mau;
    private String trang_thai;
}

