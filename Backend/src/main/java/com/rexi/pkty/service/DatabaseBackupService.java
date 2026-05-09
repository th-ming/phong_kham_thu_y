package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.logging.Logger;

@Service
@EnableScheduling
public class DatabaseBackupService {

    private static final Logger logger = Logger.getLogger(DatabaseBackupService.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Tự động chạy ngầm vào lúc 02:00 sáng mỗi ngày
    @Scheduled(cron = "0 0 2 * * ?")
    public void autoBackup() {
        try {
            logger.info("Bắt đầu tiến trình sao lưu cơ sở dữ liệu định kỳ...");
            backupDatabaseManual();
            cleanOldBackups();
        } catch (Exception e) {
            logger.severe("Lỗi khi sao lưu tự động: " + e.getMessage());
        }
    }

    // Hàm thực thi việc dọn dẹp các file backup cũ hơn 7 ngày
    private void cleanOldBackups() {
        String backupDirPath = System.getProperty("user.dir") + File.separator + "backups";
        File backupDir = new File(backupDirPath);

        if (backupDir.exists() && backupDir.isDirectory()) {
            File[] files = backupDir.listFiles((dir, name) -> name.startsWith("PKTY_Backup_") && name.endsWith(".bak"));
            if (files != null) {
                // Lấy số ngày lưu trữ từ DB
                int retentionDays = 7;
                try {
                    String val = jdbcTemplate.queryForObject(
                            "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'backup_retention_days'",
                            String.class);
                    if (val != null) {
                        retentionDays = Integer.parseInt(val);
                    }
                } catch (Exception e) {
                    logger.warning("Không lấy được cấu hình ngày sao lưu, dùng mặc định 7 ngày");
                }

                // Tính toán thời điểm giới hạn (tính bằng milliseconds)
                long cutoffTime = System.currentTimeMillis() - ((long) retentionDays * 24 * 60 * 60 * 1000);
                for (File file : files) {
                    if (file.lastModified() < cutoffTime) {
                        if (file.delete()) {
                            logger.info("🧹 Đã tự động xóa file backup cũ (hơn " + retentionDays + " ngày): "
                                    + file.getName());
                        } else {
                            logger.warning("❌ Không thể xóa file backup cũ: " + file.getName());
                        }
                    }
                }
            }
        }
    }

    // Hàm thực thi lệnh Backup SQL Server
    public String backupDatabaseManual() throws Exception {
        // Tạo thư mục "backups" nằm ngay trong thư mục chạy project Backend
        String backupDirPath = System.getProperty("user.dir") + File.separator + "backups";
        File backupDir = new File(backupDirPath);
        if (!backupDir.exists()) {
            backupDir.mkdirs();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupFileName = backupDir.getAbsolutePath() + File.separator + "PKTY_Backup_" + timestamp + ".bak";
        String dbName = jdbcTemplate.queryForObject("SELECT DB_NAME()", String.class);
        String sql = "BACKUP DATABASE [" + dbName + "] TO DISK = '" + backupFileName + "' WITH FORMAT, INIT;";
        jdbcTemplate.execute(sql);
        logger.info("✅ Đã sao lưu CSDL thành công tại: " + backupFileName);
        return backupFileName;
    }
}
