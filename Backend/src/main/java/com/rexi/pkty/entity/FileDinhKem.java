package com.rexi.pkty.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_dinh_kem")
@Data
public class FileDinhKem {

    @Id
    private String id;

    @Column(name = "ten_file")
    private String tenFile;

    @Column(name = "duong_dan")
    private String duongDan;

    private String loai;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "id_ho_so_benh_an")
    private String idHoSoBenhAn;

    @Column(name = "ngay_upload")
    private LocalDateTime ngayUpload;

    @PrePersist
    protected void onCreate() {
        ngayUpload = LocalDateTime.now();
    }
}
