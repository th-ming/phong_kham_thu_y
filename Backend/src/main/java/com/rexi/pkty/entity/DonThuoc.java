package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "DonThuoc")
@Data
public class DonThuoc {
    @Id
    private String id_don_thuoc;

    private String id_ho_so_benh_an;
    private LocalDateTime ngay_ke_don;
    private String id_bac_si;
    private String ghi_chu;
}

