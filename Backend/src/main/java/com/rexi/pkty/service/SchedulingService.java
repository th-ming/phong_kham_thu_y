package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.logging.Logger;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class SchedulingService {

    private static final Logger logger = Logger.getLogger(SchedulingService.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    /**
     * Tự động quét và hủy các lịch hẹn khách không đến vào cuối ngày (23:59).
     * Trạng thái 'Đã đặt' sẽ chuyển thành 'Hết hạn'.
     */
    // BẢO ĐẢM: Luôn chạy lúc 23:59 theo giờ Việt Nam, tránh bị lệch giờ nếu thuê
    // Cloud Server nước ngoài
    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCancelExpiredAppointments() {
        try {
            String sql = "UPDATE LichHen SET trang_thai = N'Hết hạn' " +
                    "WHERE ngay_kham <= CAST(GETDATE() AS DATE) AND trang_thai IN (N'Chờ xác nhận', N'Đã xác nhận')";
            int rows = jdbcTemplate.update(sql);
            if (rows > 0) {
                logger.info("Đã tự động xử lý " + rows + " lịch hẹn quá hạn.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi dọn dẹp lịch hẹn: " + e.getMessage());
        }
    }

    /**
     * Tự động gửi Email nhắc nhở vào lúc 08:00 sáng cho các lịch hẹn vào ngày mai.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoSendReminders() {
        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            String sql = "SELECT lh.gio_kham, kh.email, kh.ten_khach_hang, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu "
                    +
                    "FROM LichHen lh " +
                    "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                    "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                    "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "WHERE lh.ngay_kham = ? AND lh.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', N'Chờ xác nhận', N'Đã xác nhận')";

            List<Map<String, Object>> apps = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(tomorrow));
            int count = 0;

            for (Map<String, Object> app : apps) {
                if (app.get("email") != null && !app.get("email").toString().isEmpty()) {
                    String toEmail = app.get("email").toString();
                    String tenKhachHang = app.get("ten_khach_hang") != null ? app.get("ten_khach_hang").toString()
                            : "Khách hàng";
                    String tenThuCung = app.get("ten_thu_cung") != null ? app.get("ten_thu_cung").toString()
                            : "Thú cưng";
                    String tenBacSi = app.get("ten_bac_si") != null ? app.get("ten_bac_si").toString() : "Bác sĩ Rexi";
                    String tenDichVu = app.get("ten_dich_vu") != null ? app.get("ten_dich_vu").toString()
                            : "Dịch vụ Thú y";
                    String gioKham = app.get("gio_kham").toString();

                    emailService.sendReminderEmail(toEmail, tenKhachHang, tenThuCung, tenBacSi, tomorrow.toString(),
                            gioKham, tenDichVu);
                    count++;
                }
            }
            logger.info("Đã tự động gửi " + count + " email nhắc nhở lịch hẹn cho ngày mai.");
        } catch (Exception e) {
            logger.severe("Lỗi khi gửi email nhắc nhở: " + e.getMessage());
        }
    }

    /**
     * Tự động chốt công nợ cuối ngày (23:55)
     * Thống kê các hóa đơn chưa thanh toán trong ngày và ghi log (hoặc gửi email
     * báo cáo)
     */
    @Scheduled(cron = "0 55 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoReportDailyDebt() {
        try {
            String sql = "SELECT hd.id_hoa_don, hd.tong_tien_cuoi, kh.email, kh.ten_khach_hang " +
                    "FROM HoaDon hd " +
                    "JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
                    "WHERE hd.trang_thai = 'cho_thanh_toan' AND CAST(hd.ngay_lap_hoa_don AS DATE) = CAST(GETDATE() AS DATE)";

            List<Map<String, Object>> unpaidInvoices = jdbcTemplate.queryForList(sql);

            int soLuong = unpaidInvoices.size();
            java.math.BigDecimal tongNo = java.math.BigDecimal.ZERO;
            int mailSentCount = 0;

            for (Map<String, Object> row : unpaidInvoices) {
                java.math.BigDecimal amount = row.get("tong_tien_cuoi") != null
                        ? (java.math.BigDecimal) row.get("tong_tien_cuoi")
                        : java.math.BigDecimal.ZERO;
                tongNo = tongNo.add(amount);

                String email = (String) row.get("email");
                if (email != null && !email.isEmpty()) {
                    String tenKhach = row.get("ten_khach_hang") != null ? row.get("ten_khach_hang").toString()
                            : "Khách hàng";
                    String idHoaDon = row.get("id_hoa_don").toString();

                    emailService.sendDebtReminderEmail(email, tenKhach, idHoaDon, amount);
                    mailSentCount++;
                }
            }

            if (soLuong > 0) {
                logger.info("💰 CHỐT CÔNG NỢ CUỐI NGÀY: Hôm nay có " + soLuong + " hóa đơn chưa thu tiền. Tổng nợ: "
                        + tongNo + " VNĐ");
                logger.info("📧 Đã gửi " + mailSentCount + " email nhắc nợ tự động cho khách hàng.");
            } else {
                logger.info("💰 CHỐT CÔNG NỢ CUỐI NGÀY: Tuyệt vời! Tất cả hóa đơn hôm nay đều đã được thanh toán.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi chốt công nợ cuối ngày: " + e.getMessage());
        }
    }
}

