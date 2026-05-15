package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ThuCung")
public class ThuCung {
    @Id
    private String id_thu_cung;

    private String id_khach_hang;
    private String ten_thu_cung;
    private String loai;
    private String giong; // Đồng bộ với frontend
    private java.time.LocalDate ngay_sinh; // Dùng LocalDate cho chuẩn ngày sinh
    private String gioi_tinh;
    private String mau_sac;
    private Double trong_luong; // Đồng bộ với frontend
    private String ghi_chu;
    private String hinh_anh;
    private Boolean da_xoa;
    private LocalDateTime ngay_tao;
    private LocalDateTime ngay_cap_nhat;
}
