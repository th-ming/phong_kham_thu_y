package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * ENTITY: Vai trÃ² há»‡ thá»‘ng
 * Má»¤C ÄÃCH: Äá»‹nh nghÄ©a cÃ¡c vai trÃ² (Admin, BÃ¡c sÄ©, KhÃ¡ch hÃ ng...) Ä‘á»ƒ phÃ¢n quyá»n ngÆ°á»i dÃ¹ng.
 * Káº¾T Ná»I: Báº£ng [VaiTroNhanVien] trong SQL Server.
 */
@Entity
@Table(name = "VaiTroHeThong")
@Data
public class VaiTroHeThong {
    @Id
    private String id_vai_tro;

    @Column(nullable = false, unique = true)
    private String ten_vai_tro;

    private String mo_ta;
}

