package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class DichVuLapLich {

    private static final Logger logger = Logger.getLogger(DichVuLapLich.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DichVuEmail dichVuEmail;

    @Scheduled(cron = "0 0 * * * ?")
    public void checkExpiredAppointments() {
        try {
            String sql = "UPDATE LichHen SET trang_thai = 'QUA_HAN' " +
                         "WHERE ngay_kham < CAST(GETDATE() AS DATE) AND trang_thai = 'CHO_XAC_NHAN'";
            int rows = jdbcTemplate.update(sql);
            if (rows > 0) logger.info("Đã tự động xử lý " + rows + " lịch hẹn quá hạn.");
        } catch (Exception e) {
            logger.severe("Lỗi xử lý lịch hẹn quá hạn: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 8 * * ?")
    public void sendReminderEmails() {
        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            String sql = "SELECT lh.id_lich_hen, kh.email, kh.ten_khach_hang, tc.ten_thu_cung, nv.ho_ten as ten_bac_si " +
                         "FROM LichHen lh " +
                         "JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                         "JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                         "JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                         "WHERE lh.ngay_kham = ? AND lh.trang_thai = 'DA_XAC_NHAN'";
            
            List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, tomorrow);
            int count = 0;
            for (Map<String, Object> map : list) {
                String toEmail = (String) map.get("email");
                if (toEmail != null && !toEmail.isEmpty()) {
                    dichVuEmail.sendReminderEmail(toEmail, (String) map.get("ten_khach_hang"), 
                                               (String) map.get("ten_thu_cung"), tomorrow.toString(), 
                                               "Sáng (08:00 - 11:30)", "Khám sức khỏe");
                    count++;
                }
            }
            logger.info("Đã tự động gửi " + count + " email nhắc nhở.");
        } catch (Exception e) {
            logger.severe("Lỗi gửi email nhắc lịch: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 22 * * ?")
    public void sendDailyRevenueReport() {
        try {
            LocalDate today = LocalDate.now();
            String sqlDoanhThu = "SELECT SUM(tong_tien) FROM HoaDon WHERE CAST(ngay_tao AS DATE) = ? AND trang_thai = 'DA_THANH_TOAN'";
            java.math.BigDecimal doanhThu = jdbcTemplate.queryForObject(sqlDoanhThu, java.math.BigDecimal.class, today);
            
            String sqlCount = "SELECT COUNT(*) FROM HoaDon WHERE CAST(ngay_tao AS DATE) = ? AND trang_thai = 'DA_THANH_TOAN'";
            Integer soLuong = jdbcTemplate.queryForObject(sqlCount, Integer.class, today);

            if (doanhThu == null) doanhThu = java.math.BigDecimal.ZERO;

            String sqlAdmin = "SELECT email FROM NhanVien WHERE id_vai_tro = 'VT-ADMIN'";
            List<String> emails = jdbcTemplate.queryForList(sqlAdmin, String.class);

            for (String email : emails) {
                dichVuEmail.guiEmailBaoCaoDoanhThu(email, today.toString(), doanhThu, soLuong);
            }
            logger.info("Đã gửi báo cáo doanh thu cuối ngày.");
        } catch (Exception e) {
            logger.severe("Lỗi gửi báo cáo doanh thu: " + e.getMessage());
        }
    }
}
