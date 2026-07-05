package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.rexi.pkty.util.DatabaseDialect;

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

    // Tu dong chuyen lich hen CHUA XU LY thanh 'KHONG_DEN' cuoi ngay (23:59).
    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCancelExpiredAppointments() {
        try {
            // Lay gio VN de trinh lich ngay khi host o nuoc ngoai
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));

            String sql = "UPDATE LichHen SET trang_thai = 'KHONG_DEN' " +
                    "WHERE ngay_kham < ? " +
                    "AND trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN')";
            int rows = jdbcTemplate.update(sql, java.sql.Date.valueOf(today));
            if (rows > 0) {
                logger.info("Auto-expire: Đã tự động chuyển " + rows + " lịch hẹn quá hạn sang KHONG_DEN.");
            } else {
                logger.info("Auto-expire: Không có lịch hẹn quá hạn nào còn xử lý hôm nay.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tự động expire lịch hẹn: " + e.getMessage());
        }
    }

    // Tu dong gui Email nhac nho luc 08:00 sang cho cac lich hen ngay mai.
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

    // Tu dong chat cong no cuoi ngay (23:55).
    @Scheduled(cron = "0 55 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoReportDailyDebt() {
        try {
            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
            String sql = "SELECT hd.id_hoa_don, hd.tong_tien_cuoi, kh.email, kh.ten_khach_hang " +
                    "FROM HoaDon hd " +
                    "JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
                    "WHERE UPPER(hd.trang_thai) = 'CHO_THANH_TOAN' " +
                    "AND CAST(hd.ngay_lap_hoa_don AS DATE) = ?";

            List<Map<String, Object>> unpaidInvoices = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(today));

            int soLuong = unpaidInvoices.size();
            java.math.BigDecimal tongNo = java.math.BigDecimal.ZERO;
            int mailSentCount = 0;

            for (Map<String, Object> row : unpaidInvoices) {
                Object amountObj = row.get("tong_tien_cuoi");
                java.math.BigDecimal amount = java.math.BigDecimal.ZERO;
                if (amountObj instanceof java.math.BigDecimal) {
                    amount = (java.math.BigDecimal) amountObj;
                } else if (amountObj instanceof Number) {
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
                logger.info("CHAT CÔNG NỢ CUỐI NGÀY: Có " + soLuong + " hóa đơn chưa thu. Tổng nợ: "
                        + tongNo + " VND. Đã gửi " + mailSentCount + " email nhắc nợ.");
            } else {
                logger.info("CHAT CÔNG NỢ CUỐI NGÀY: Tuyệt vời! Tất cả hóa đơn hôm nay đã thanh toán.");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi chat công nợ cuối ngày: " + e.getMessage());
        }
    }

    // Tu dong quet va tao thong bao nhac lich tiem chung vao 8h00 sang moi ngay
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCreateVaccinationNotifications() {
        try {
            String sql = DatabaseDialect.isPostgres(jdbcTemplate)
                    ? "CALL sp_TaoThongBaoTiemChung()"
                    : "EXEC dbo.sp_TaoThongBaoTiemChung";
            jdbcTemplate.execute(sql);
            logger.info("NHẮC NHỊM TIÊM CHỦNG: Đã thực thi thủ tục sp_TaoThongBaoTiemChung() thành công.");
        } catch (Exception e) {
            logger.severe("NHẮC NHỊM TIÊM CHỦNG: Lỗi khi chạy tự động nhắc lịch tiêm phòng: " + e.getMessage());
        }
    }
}
