package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "DichVu")
@Data
public class DichVu {
    @Id
    @Column(name = "id_dich_vu")
    private String id_dich_vu;

    @Column(name = "ten_dich_vu", nullable = false, length = 255)
    private String ten_dich_vu;

    @Column(name = "mo_ta")
    private String mo_ta;

    @Column(name = "gia")
    private BigDecimal gia;

    @Column(name = "thoi_luong_phut")
    private Integer thoi_luong_phut;

    @Column(name = "trang_thai", nullable = false)
    private Boolean trang_thai = true;

    @Column(name = "ngay_tao")
    private LocalDateTime ngay_tao;

    @PrePersist
    public void prePersist() {
        if (this.ngay_tao == null) {
            this.ngay_tao = LocalDateTime.now();
        }
        if (this.trang_thai == null) {
            this.trang_thai = true;
        }
    }
}
