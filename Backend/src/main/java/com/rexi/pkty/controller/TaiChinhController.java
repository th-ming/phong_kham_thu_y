package com.rexi.pkty.controller;

import com.rexi.pkty.repository.HoaDonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/tai-chinh")
public class TaiChinhController {

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @GetMapping("/thong-ke")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(Map.of(
                "doanhThuDichVu", hoaDonRepository.calculateRevenueByService(),
                "doanhThuNgay", hoaDonRepository.calculateRevenueByDay(),
                "doanhThuThang", hoaDonRepository.calculateRevenueByMonth(),
                "thongKeBacSi", hoaDonRepository.calculateDoctorStats(),
                "thongKeThuCung", hoaDonRepository.calculatePetStats(),
                "doanhThuHomNay", hoaDonRepository.calculateTodayRevenue()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy thống kê: " + e.getMessage()));
        }
    }

    @GetMapping("/hoa-don")
    public ResponseEntity<?> getAllHoaDon() {
        try {
            return ResponseEntity.ok(hoaDonRepository.findFullInvoices());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy danh sách hóa đơn: " + e.getMessage()));
        }
    }
}
