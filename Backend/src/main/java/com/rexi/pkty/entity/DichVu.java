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
    private String idDichVu;

    @Column(name = "ten_dich_vu", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String tenDichVu;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @Column(name = "gia")
    private BigDecimal giaTien;

    @Column(name = "thoi_luong_phut")
    private Integer thoiLuongPhut;

    @Column(name = "trang_thai", nullable = false)
    private Boolean trangThai = true;
}

