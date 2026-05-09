package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "Thuoc")
@Data
public class Thuoc {
    @Id
    private String id_thuoc;

    private String ten_thuoc;
    private String thanh_phan;
    private String dang_bao_che;
    private String don_vi;
    private String mo_ta;
    private BigDecimal gia_ban;
    private Boolean trang_thai;
    private Boolean da_xoa;
}
