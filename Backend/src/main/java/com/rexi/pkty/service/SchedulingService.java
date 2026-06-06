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

    // * * Tự chuyển lịch hẹn CHƯA XỬ LÝ thành 'KHONG_DEN' cuối ngày (23:59). * BUG FIX #1: Trước dùng N'Chờ xn' (tiếng Việt) nhưng DB lưu 'CHO_XAC_NHAN' * → scheduled task chạy nhưng KHÔNG UPDATE được dòng nào! Task chạy nhưng vô ích. * BUG FIX #2: Trước expire cả lịch hẹn NGÀY HÔM NAY, nhưng bs có thể vẫn * đang xử lý muộn → chỉ expire lịch hẹn ĐÃ QUA (ngay_kham < today).
    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCancelExpiredAppointments() {
        try {
            // Lấy giờ VN để tránh lệch ngày khi host ở nước ngoài
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));

            String sql = "UPDATE LichHen SET trang_thai = 'KHONG_DEN' " +
                    "WHERE ngay_kham < ? " +
                    "AND trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN')";
            int rows = jdbcTemplate.update(sql, java.sql.Date.valueOf(today));
            if (rows > 0) {
                logger.info("Auto-expire: Đã tự động chuyển " + rows + " lịch hẹn quá hạn sang KHONG_DEN.");
            } else {
                logger.info("Auto-expire: Không có lịch hẹn quá hạn nào cần xử lý hôm nay.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tự động expire lịch hẹn: " + e.getMessage());
        }
    }

    // * * Tự động gửi Email nhắc nhở lúc 08:00 sáng cho các lịch hẹn ngày mai. * BUG FIX: Chỉ dùng enum tiếng Anh (CHO_XAC_NHAN, DA_XAC_NHAN) cho nhất quán, * bỏ N'Chờ xn' tiếng Việt dư thừa (data cũ trong DB nếu có sẽ ko match).
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoSendReminders() {
        try {
            LocalDate tomorrow = LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1);
            String sql = "SELECT lh.gio_kham, kh.email, kh.ten_khach_hang, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                    "FROM LichHen lh " +
                    "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                    "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                    "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "WHERE lh.ngay_kham = ? AND lh.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN')";

            List<Map<String, Object>> apps = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(tomorrow));
            int count = 0;

            for (Map<String, Object> app : apps) {
                if (app.get("email") != null && !app.get("email").toString().isEmpty()) {
                    String toEmail = app.get("email").toString();
                    String tenKhachHang = app.get("ten_khach_hang") != null ? app.get("ten_khach_hang").toString() : "Khách hàng";
                    String tenThuCung = app.get("ten_thu_cung") != null ? app.get("ten_thu_cung").toString() : "Thú cưng";
                    String tenBacSi = app.get("ten_bac_si") != null ? app.get("ten_bac_si").toString() : "Bác sĩ Rexi";
                    String tenDichVu = app.get("ten_dich_vu") != null ? app.get("ten_dich_vu").toString() : "Dịch vụ Thú y";
                    String gioKham = app.get("gio_kham").toString();

                    emailService.sendReminderEmail(toEmail, tenKhachHang, tenThuCung, tenBacSi, tomorrow.toString(), gioKham, tenDichVu);
                    count++;
                }
            }
            logger.info("Nhắc nhở lịch hẹn: Đã gửi " + count + "/" + apps.size() + " email cho ngày " + tomorrow);
        } catch (Exception e) {
            logger.severe("Lỗi khi gửi email nhắc nhở: " + e.getMessage());
        }
    }

    // * * Tự động chốt công nợ cuối ngày (23:55).
    //  * BUG FIX #3: Trước đây dùng 'cho_thanh_toan' (lowercase) nhưng DB lưu 'CHO_THANH_TOAN' 
    //→ KHÔNG BAO GIỜ có hóa đơn nào được match → email nhắc nợ ko bao giờ được gửi! 
    // * BUG FIX #4: Tránh ClassCastException khi SQL Server trả về kiểu số khác (Long, Integer...)
    @Scheduled(cron = "0 55 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoReportDailyDebt() {
        try {
            // Dùng UPPER() để so sánh case-insensitive, bảo vệ khỏi data ko nhất quán
            String sql = "SELECT hd.id_hoa_don, hd.tong_tien_cuoi, kh.email, kh.ten_khach_hang " +
                    "FROM HoaDon hd " +
                    "JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
                    "WHERE UPPER(hd.trang_thai) = 'CHO_THANH_TOAN' " +
                    "AND CAST(hd.ngay_lap_hoa_don AS DATE) = CURRENT_DATE";

            List<Map<String, Object>> unpaidInvoices = jdbcTemplate.queryForList(sql);

            int soLuong = unpaidInvoices.size();
            java.math.BigDecimal tongNo = java.math.BigDecimal.ZERO;
            int mailSentCount = 0;

            for (Map<String, Object> row : unpaidInvoices) {
                Object amountObj = row.get("tong_tien_cuoi");
                java.math.BigDecimal amount = java.math.BigDecimal.ZERO;
                if (amountObj instanceof java.math.BigDecimal) {
                    amount = (java.math.BigDecimal) amountObj;
                } else if (amountObj instanceof Number) {
                    // Bảo vệ khỏi ClassCastException khi SQL Server trả kiểu số khác
                    amount = java.math.BigDecimal.valueOf(((Number) amountObj).doubleValue());
                }
                tongNo = tongNo.add(amount);

                String email = row.get("email") != null ? row.get("email").toString() : null;
                if (email != null && !email.isEmpty()) {
                    String tenKhach = row.get("ten_khach_hang") != null ? row.get("ten_khach_hang").toString() : "Khách hàng";
                    String idHoaDon = row.get("id_hoa_don").toString();

                    emailService.sendDebtReminderEmail(email, tenKhach, idHoaDon, amount);
                    mailSentCount++;
                }
            }

            if (soLuong > 0) {
                logger.info("CHỐT CÔNG NỢ CUỐI NGÀY: Có " + soLuong + " hóa đơn chưa thu. Tổng nợ: "
                        + tongNo + " VNĐ. Đã gửi " + mailSentCount + " email nhắc nợ.");
            } else {
                logger.info("CHỐT CÔNG NỢ CUỐI NGÀY: Tuyệt vời! Tất cả hóa đơn hôm nay đều đã thanh toán.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi chốt công nợ cuối ngày: " + e.getMessage());
        }
    }

    // Tự động quét và tạo thông báo nhắc lịch tiêm chủng vào 8h00 sáng mỗi ngày
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCreateVaccinationNotifications() {
        try {
            jdbcTemplate.execute("CALL sp_TaoThongBaoTiemChung()");
            logger.info("NHẮC NHỞ TIÊM CHỦNG: Đã thực thi thủ tục sp_TaoThongBaoTiemChung() thành công.");
        } catch (Exception e) {
            logger.severe("NHẮC NHỞ TIÊM CHỦNG: Lỗi khi chạy tự động nhắc lịch tiêm phòng: " + e.getMessage());
        }
    }
}
