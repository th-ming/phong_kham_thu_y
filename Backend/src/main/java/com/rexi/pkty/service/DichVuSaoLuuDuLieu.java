package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.logging.Logger;

@Service
public class DichVuSaoLuuDuLieu {

    private static final Logger logger = Logger.getLogger(DichVuSaoLuuDuLieu.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Tự động chạy ngầm vào lúc 02:00 sáng mỗi ngày
    @Scheduled(cron = "0 0 2 * * ?")
    public void autoBackup() {
        try {
            logger.info("Bắt đầu tiến trình sao lưu cơ sở dữ liệu định kỳ...");
            executeBackup();
            cleanOldBackups();
        } catch (Exception e) {
            logger.severe("Lỗi khi sao lưu tự động: " + e.getMessage());
        }
    }

    // Hàm thực thi việc dọn dẹp các file backup cũ hơn 7 ngày
    public void cleanOldBackups() {
        try {
            File backupDir = new File("backups");
            if (!backupDir.exists()) return;

            File[] files = backupDir.listFiles();
            if (files != null) {
                // Lấy số ngày lưu trữ từ DB
                int retentionDays = 7;
                try {
                    String sql = "SELECT gia_tri FROM CauHinhHeThong WHERE ma_cau_hinh = 'BACKUP_RETENTION_DAYS'";
                    String val = jdbcTemplate.queryForObject(sql, String.class);
                    if (val != null) retentionDays = Integer.parseInt(val);
                } catch (Exception e) {
                    logger.warning("Không lấy được cấu hình ngày sao lưu, dùng mặc định 7 ngày");
                }

                // Tính toán thời điểm giới hạn (tính bằng milliseconds)
                long limitTime = System.currentTimeMillis() - (retentionDays * 24L * 3600L * 1000L);

                for (File file : files) {
                    if (file.lastModified() < limitTime) {
                        if (file.delete()) {
                            logger.info("🧹 Đã tự động xóa file backup cũ (hơn " + retentionDays + " ngày): " + file.getName());
                        } else {
                            logger.warning("❌ Không thể xóa file backup cũ: " + file.getName());
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.severe("Lỗi dọn dẹp file backup: " + e.getMessage());
        }
    }

    // Hàm thực thi lệnh Backup SQL Server
    public void executeBackup() throws Exception {
        // Tạo thư mục "backups" nằm ngay trong thư mục chạy project Backend
        File backupDir = new File("backups");
        if (!backupDir.exists()) {
            backupDir.mkdirs();
        }

        String timestamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
        String backupFileName = backupDir.getAbsolutePath() + File.separator + "Rexi_Backup_" + timestamp + ".bak";

        String sql = "BACKUP DATABASE [PKTY] TO DISK = ? WITH FORMAT, MEDIANAME = 'RexiBackup', NAME = 'Full Backup of PKTY'";
        jdbcTemplate.execute(sql);
        
        logger.info("✅ Đã sao lưu CSDL thành công tại: " + backupFileName);
    }
}
