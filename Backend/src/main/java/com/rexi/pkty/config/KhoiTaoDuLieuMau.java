package com.rexi.pkty.config;

import com.rexi.pkty.entity.DichVu;
import com.rexi.pkty.repository.DichVuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

@Component
@org.springframework.context.annotation.Profile("!test")
public class KhoiTaoDuLieuMau implements CommandLineRunner {

    @Autowired
    private DichVuRepository dichVuRepository;

    @Override
    public void run(String... args) {
        if (dichVuRepository.count() > 0) return;

        List<DichVu> dichVuList = List.of(
                tao("Khám tổng quát", "Kiểm tra sức khỏe toàn diện", 150000, 30),
                tao("Tiêm phòng", "Tiêm vaccine định kỳ", 200000, 20),
                tao("Tắm & Vệ sinh", "Vệ sinh toàn thân cho bé", 120000, 60),
                tao("Cắt tỉa lông", "Cắt tỉa lông chuyên nghiệp", 180000, 90),
                tao("Siêu âm", "Chẩn đoán bằng siêu âm", 350000, 30),
                tao("Xét nghiệm máu", "Xét nghiệm máu toàn phần", 280000, 20),
                tao("Phẫu thuật nhỏ", "Thiến, cắt u nang", 1500000, 120),
                tao("Nhổ răng", "Vệ sinh răng miệng", 250000, 45));

        dichVuRepository.saveAll(dichVuList);
        System.out.println("✅ Đã khởi tạo dịch vụ mẫu thành công!");
    }

    private DichVu tao(String ten, String moTa, int gia, int thoiLuong) {
        DichVu dv = new DichVu();
        dv.setId_dich_vu("DV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dv.setTen_dich_vu(ten);
        dv.setMo_ta(moTa);
        dv.setGia(BigDecimal.valueOf(gia));
        dv.setThoi_luong_phut(thoiLuong);
        dv.setTrang_thai("HOAT_DONG");
        return dv;
    }
}