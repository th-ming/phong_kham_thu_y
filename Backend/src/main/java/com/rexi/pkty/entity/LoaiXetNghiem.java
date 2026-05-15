package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "LoaiXetNghiem")
@Data
public class LoaiXetNghiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_loai_xet_nghiem;

    private String ten_xet_nghiem;
    private String mo_ta;
    private BigDecimal gia;
}

