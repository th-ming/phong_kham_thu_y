package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "HoSoBenhAn") // Káº¿t ná»‘i báº£ng há»“ sÆ¡ bá»‡nh Ã¡n
@Data
public class HoSoBenhAn {
    @Id
    private String id_ho_so_benh_an;

    private String id_thu_cung;
    private String id_lich_hen;
    private LocalDate ngay_kham;
    private String id_bac_si;
    private BigDecimal can_nang;
    private BigDecimal nhiet_do;
    private String huyet_ap;
    private String trieu_chung;
    private String ket_qua_tham_kham;
    private String chan_doan;
    private String phac_do_dieu_tri;
    private String huong_dan_cham_soc;
    private LocalDate ngay_tai_kham_de_xuat;
    private String trang_thai_ho_so;
    private String id_nguoi_tao;
    private LocalDateTime ngay_tao;
}

