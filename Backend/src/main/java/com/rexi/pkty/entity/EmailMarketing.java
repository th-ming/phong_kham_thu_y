package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "EmailMarketing")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailMarketing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_email")
    private Integer idEmail;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "ngay_dang_ky", nullable = false, updatable = false)
    private LocalDateTime ngayDangKy;

    @Column(name = "trang_thai", nullable = false)
    private Boolean trangThai;

    @PrePersist
    protected void onCreate() {
        this.ngayDangKy = LocalDateTime.now();
        if (this.trangThai == null) {
            this.trangThai = true;
        }
    }
}
