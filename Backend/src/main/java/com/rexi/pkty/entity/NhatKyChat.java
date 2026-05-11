package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "NhatKyChat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhatKyChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chat")
    private Long idChat;

    @Column(name = "id_tai_khoan", length = 20)
    private String idTaiKhoan;

    @Column(name = "cau_hoi", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String cauHoi;

    @Column(name = "cau_tra_loi", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String cauTraLoi;

    @Column(name = "thoi_gian", nullable = false, updatable = false)
    private LocalDateTime thoiGian;

    @PrePersist
    protected void onCreate() {
        this.thoiGian = LocalDateTime.now();
    }
}
