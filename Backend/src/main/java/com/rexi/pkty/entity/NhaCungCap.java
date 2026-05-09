package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "NhaCungCap")
@Data
public class NhaCungCap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id_ncc;

    private String ten_ncc;
    private String dia_chi;
    private String so_dien_thoai;
    private String email;
    private String ma_so_thue;
    private String ghi_chu;
    private LocalDateTime ngay_tao;
}

