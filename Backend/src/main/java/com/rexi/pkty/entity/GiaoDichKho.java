package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "GiaoDichKho")
@Data
public class GiaoDichKho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_giao_dich;

    private String id_lo;
    private String loai_giao_dich;
    private Integer so_luong;
    private LocalDateTime ngay_giao_dich;
    private String id_nhan_vien;
    private String ghi_chu;
}

