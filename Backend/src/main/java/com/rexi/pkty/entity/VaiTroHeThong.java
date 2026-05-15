package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * ENTITY: Vai trò hệ thống
 * MỤC ĐÍCH: Định nghĩa các vai trò (Admin, Bác sĩ, Khách hàng...) để phân quyền người dùng.
 * KẾT NỐI: Bảng [VaiTroNhanVien] trong SQL Server.
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

