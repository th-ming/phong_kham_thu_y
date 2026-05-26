package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;

// Entity VaiTroHeThong, map table SQL Server
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

