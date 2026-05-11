package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DanhGiaDichVu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DanhGiaDichVu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_danh_gia")
    private Integer idDanhGia;

    @Column(name = "id_khach_hang", nullable = false, length = 20)
    private String idKhachHang;

    @Column(name = "id_dich_vu", length = 20)
    private String idDichVu;

    @Column(name = "so_sao", nullable = false)
    private Integer soSao;

    @Column(name = "noi_dung", columnDefinition = "NVARCHAR(MAX)")
    private String noiDung;

    @Column(name = "ngay_danh_gia", nullable = false, updatable = false)
    private LocalDateTime ngayDanhGia;

    @PrePersist
    protected void onCreate() {
        this.ngayDanhGia = LocalDateTime.now();
    }
}
