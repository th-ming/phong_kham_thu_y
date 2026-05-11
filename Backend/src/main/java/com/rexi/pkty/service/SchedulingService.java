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
     * Tá»± Ä‘á»™ng quÃ©t vÃ  há»§y cÃ¡c lá»‹ch háº¹n khÃ¡ch khÃ´ng Ä‘áº¿n vÃ o cuá»‘i ngÃ y (23:59).
     * Tráº¡ng thÃ¡i 'ÄÃ£ Ä‘áº·t' sáº½ chuyá»ƒn thÃ nh 'Háº¿t háº¡n'.
     */
    // Báº¢O Äáº¢M: LuÃ´n cháº¡y lÃºc 23:59 theo giá» Viá»‡t Nam, trÃ¡nh bá»‹ lá»‡ch giá» náº¿u thuÃª
    // Cloud Server nÆ°á»›c ngoÃ i
    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCancelExpiredAppointments() {
        try {
            String sql = "UPDATE LichHen SET trang_thai = N'Háº¿t háº¡n' " +
                    "WHERE ngay_kham <= CAST(GETDATE() AS DATE) AND trang_thai IN (N'Chá» xÃ¡c nháº­n', N'ÄÃ£ xÃ¡c nháº­n')";
            int rows = jdbcTemplate.update(sql);
            if (rows > 0) {
                logger.info("ÄÃ£ tá»± Ä‘á»™ng xá»­ lÃ½ " + rows + " lá»‹ch háº¹n quÃ¡ háº¡n.");
            }
        } catch (Exception e) {
            logger.severe("Lá»—i khi dá»n dáº¹p lá»‹ch háº¹n: " + e.getMessage());
        }
    }

    /**
     * Tá»± Ä‘á»™ng gá»­i Email nháº¯c nhá»Ÿ vÃ o lÃºc 08:00 sÃ¡ng cho cÃ¡c lá»‹ch háº¹n vÃ o ngÃ y mai.
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
                    "WHERE lh.ngay_kham = ? AND lh.trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', N'Chá» xÃ¡c nháº­n', N'ÄÃ£ xÃ¡c nháº­n')";

            List<Map<String, Object>> apps = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(tomorrow));
            int count = 0;

            for (Map<String, Object> app : apps) {
                if (app.get("email") != null && !app.get("email").toString().isEmpty()) {
                    String toEmail = app.get("email").toString();
                    String tenKhachHang = app.get("ten_khach_hang") != null ? app.get("ten_khach_hang").toString()
                            : "KhÃ¡ch hÃ ng";
                    String tenThuCung = app.get("ten_thu_cung") != null ? app.get("ten_thu_cung").toString()
                            : "ThÃº cÆ°ng";
                    String tenBacSi = app.get("ten_bac_si") != null ? app.get("ten_bac_si").toString() : "BÃ¡c sÄ© Rexi";
                    String tenDichVu = app.get("ten_dich_vu") != null ? app.get("ten_dich_vu").toString()
                            : "Dá»‹ch vá»¥ ThÃº y";
                    String gioKham = app.get("gio_kham").toString();

                    emailService.sendReminderEmail(toEmail, tenKhachHang, tenThuCung, tenBacSi, tomorrow.toString(),
                            gioKham, tenDichVu);
                    count++;
                }
            }
            logger.info("ÄÃ£ tá»± Ä‘á»™ng gá»­i " + count + " email nháº¯c nhá»Ÿ lá»‹ch háº¹n cho ngÃ y mai.");
        } catch (Exception e) {
            logger.severe("Lá»—i khi gá»­i email nháº¯c nhá»Ÿ: " + e.getMessage());
        }
    }

    /**
     * Tá»± Ä‘á»™ng chá»‘t cÃ´ng ná»£ cuá»‘i ngÃ y (23:55)
     * Thá»‘ng kÃª cÃ¡c hÃ³a Ä‘Æ¡n chÆ°a thanh toÃ¡n trong ngÃ y vÃ  ghi log (hoáº·c gá»­i email
     * bÃ¡o cÃ¡o)
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
                            : "KhÃ¡ch hÃ ng";
                    String idHoaDon = row.get("id_hoa_don").toString();

                    emailService.sendDebtReminderEmail(email, tenKhach, idHoaDon, amount);
                    mailSentCount++;
                }
            }

            if (soLuong > 0) {
                logger.info("ðŸ’° CHá»T CÃ”NG Ná»¢ CUá»I NGÃ€Y: HÃ´m nay cÃ³ " + soLuong + " hÃ³a Ä‘Æ¡n chÆ°a thu tiá»n. Tá»•ng ná»£: "
                        + tongNo + " VNÄ");
                logger.info("ðŸ“§ ÄÃ£ gá»­i " + mailSentCount + " email nháº¯c ná»£ tá»± Ä‘á»™ng cho khÃ¡ch hÃ ng.");
            } else {
                logger.info("ðŸ’° CHá»T CÃ”NG Ná»¢ CUá»I NGÃ€Y: Tuyá»‡t vá»i! Táº¥t cáº£ hÃ³a Ä‘Æ¡n hÃ´m nay Ä‘á»u Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n.");
            }
        } catch (Exception e) {
            logger.severe("Lá»—i khi chá»‘t cÃ´ng ná»£ cuá»‘i ngÃ y: " + e.getMessage());
        }
    }
}

