package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "HoaDon") // Kết nối bảng hóa đơn
@Data
public class HoaDon {
    @Id
    private String id_hoa_don;

    private String id_lich_hen;
    private String id_khach_hang;
    private String id_nhan_vien;
    private BigDecimal tong_tien_ban_dau;
    private BigDecimal tong_giam_gia;
    private BigDecimal tong_tien_cuoi;
    private BigDecimal thue_suat;
    private LocalDateTime ngay_lap_hoa_don;
    private String trang_thai;
    private String ghi_chu;
}

