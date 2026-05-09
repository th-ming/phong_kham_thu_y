package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "DichVu")
@Data
public class DichVu {
    @Id
    private String id_dich_vu;

    @Column(nullable = false)
    private String ten_dich_vu;

    private String mo_ta;

    @Column(nullable = false)
    private BigDecimal gia;

    private Integer thoi_luong_phut;

    @Column(nullable = false)
    private Boolean trang_thai = true;
}

