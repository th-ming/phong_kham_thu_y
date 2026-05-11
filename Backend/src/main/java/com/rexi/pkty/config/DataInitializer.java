package com.rexi.pkty.config;

import com.rexi.pkty.entity.DichVu;
import com.rexi.pkty.repository.DichVuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Tự động khởi tạo dữ liệu Dịch vụ mẫu nếu bảng DichVu đang trống.
 * Dùng JDBC PreparedStatement của Spring (UTF-8) nên đảm bảo tiếng Việt đúng.
 */
@Component
@org.springframework.context.annotation.Profile("!test")
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private DichVuRepository dichVuRepository;

    @Override
    public void run(String... args) {
        // BẢO MẬT DỮ LIỆU: Chỉ khởi tạo dữ liệu mẫu nếu bảng chưa có dữ liệu
        long count = dichVuRepository.count();
        if (count > 0) {
            return; // Đã có dữ liệu thì KHÔNG xóa hay ghi đè để bảo toàn dữ liệu do Admin thêm
        }

        List<DichVu> dichVuList = List.of(
                tao("Kh\u00E1m t\u1ED5ng qu\u00E1t",
                        "Ki\u1EC3m tra s\u1EE9c kh\u1ECFe to\u00E0n di\u1EC7n cho th\u00FA c\u01B0ng", 150000, 30),
                tao("Ti\u00EAm ph\u00F2ng",
                        "Ti\u00EAm vaccine \u0111\u1ECBnh k\u1EF3 theo l\u1ECBch ti\u00EAm ch\u1EE7ng", 200000, 20),
                tao("T\u1EAFm & V\u1EC7 sinh",
                        "T\u1EAFm, s\u1EA5y v\u00E0 v\u1EC7 sinh to\u00E0n th\u00E2n cho b\u00E9", 120000, 60),
                tao("C\u1EAFt t\u1EC9a l\u00F4ng",
                        "C\u1EAFt t\u1EC9a l\u00F4ng theo y\u00EAu c\u1EA7u kh\u00E1ch h\u00E0ng", 180000, 90),
                tao("Si\u00EAu \u00E2m", "Ch\u1EA9n \u0111o\u00E1n h\u00ECnh \u1EA3nh b\u1EB1ng si\u00EAu \u00E2m",
                        350000, 30),
                tao("X\u00E9t nghi\u1EC7m m\u00E1u", "X\u00E9t nghi\u1EC7m m\u00E1u to\u00E0n ph\u1EA7n", 280000, 20),
                tao("Ph\u1EABu thu\u1EADt nh\u1ECF",
                        "C\u00E1c ca ph\u1EABu thu\u1EADt nh\u01B0 thi\u1EBFn, c\u1EAFt u nang", 1500000, 120),
                tao("Nh\u1ED5 r\u0103ng", "Nh\u1ED5 r\u0103ng s\u00E2u v\u00E0 v\u1EC7 sinh r\u0103ng mi\u1EC7ng",
                        250000, 45));

        dichVuRepository.saveAll(dichVuList);
        System.out.println("✅ Đã khởi tạo " + dichVuList.size() + " dịch vụ mẫu thành công!");
    }

    private DichVu tao(String ten, String moTa, int gia, int thoiLuong) {
        DichVu dv = new DichVu();
        // Cấp ID tự động để tránh lỗi IdentifierGenerationException
        dv.setIdDichVu("DV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dv.setTenDichVu(ten);
        dv.setMoTa(moTa);
        dv.setGiaTien(BigDecimal.valueOf(gia));
        dv.setThoiLuongPhut(thoiLuong);
        dv.setTrangThai(true);
        return dv;
    }
}

