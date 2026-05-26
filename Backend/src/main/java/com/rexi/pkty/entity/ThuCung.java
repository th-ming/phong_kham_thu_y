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
    private String giong; // giong loai boss
    private java.time.LocalDate ngay_sinh; // Dinh dang ngay_sinh chuẩn
    private String gioi_tinh;
    private String mau_sac;
    private Double trong_luong; // trong luong boss
    private String ghi_chu;
    private String hinh_anh;
    private Boolean da_xoa;
    private LocalDateTime ngay_tao;
    private LocalDateTime ngay_cap_nhat;
}
