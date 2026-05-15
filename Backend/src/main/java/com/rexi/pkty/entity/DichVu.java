package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "DichVu")
@Data
public class DichVu {
    @Id
    @Column(name = "id_dich_vu")
    private String id_dich_vu;

    @Column(name = "ten_dich_vu", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String ten_dich_vu;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String mo_ta;

    @Column(name = "gia")
    private BigDecimal gia;

    @Column(name = "thoi_luong_phut")
    private Integer thoi_luong_phut;

    @Column(name = "trang_thai", nullable = false)
    private Boolean trang_thai = true;
}
