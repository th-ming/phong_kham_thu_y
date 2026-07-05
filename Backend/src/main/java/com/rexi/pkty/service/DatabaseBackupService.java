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

    // Khôi phục CSDL từ file .bak có sẵn trong thư mục backups/
    // Bảo vệ: chỉ nhận filename thuần (không cho phép path traversal)
    // FIX: Dùng JDBC connection riêng đến master DB để tránh SQL Server error 3102
    //      (không thể restore database khi đang kết nối vào chính nó)
    public void restoreDatabase(String filename) throws Exception {
        // Chặn path traversal: chỉ cho phép tên file không có ký tự phân cách đường dẫn
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Tên file không hợp lệ.");
        }
        if (!filename.endsWith(".bak")) {
            throw new IllegalArgumentException("Chỉ hỗ trợ khôi phục từ file .bak.");
        }

        String backupDirPath = System.getProperty("user.dir") + File.separator + "backups";
        File backupFile = new File(backupDirPath, filename);

        // Xác nhận file tồn tại trong đúng thư mục backups
        if (!backupFile.exists() || !backupFile.isFile()) {
            throw new IllegalArgumentException("File backup không tồn tại: " + filename);
        }
        if (!backupFile.getCanonicalPath().startsWith(new File(backupDirPath).getCanonicalPath())) {
            throw new SecurityException("Truy cập file ngoài thư mục backup bị từ chối.");
        }

        String dbName = jdbcTemplate.queryForObject("SELECT DB_NAME()", String.class);
        String absolutePath = backupFile.getAbsolutePath();

        logger.info("Kết nối đến master DB để thực hiện restore...");

        // Dùng try-with-resources để đảm bảo connection tự đóng
        try (java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection();
             java.sql.Statement stmt = conn.createStatement()) {

            // Switch sang master DB trên connection hiện tại
            stmt.execute("USE [master]");

            // Đặt DB về single-user mode để tránh conflict
            stmt.execute("ALTER DATABASE [" + dbName + "] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;");
            logger.info("Đã đặt DB vào SINGLE_USER mode.");

            // Thực hiện restore
            stmt.execute("RESTORE DATABASE [" + dbName + "] FROM DISK = '" + absolutePath.replace("'", "''") + "' WITH REPLACE;");
            logger.info("Restore thành công!");

            // Trả lại multi-user
            stmt.execute("ALTER DATABASE [" + dbName + "] SET MULTI_USER;");
            logger.info("Đã trả DB về MULTI_USER mode.");

        } catch (Exception e) {
            // Cố gắng trả lại multi-user nếu có lỗi
            try (java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection();
                 java.sql.Statement stmt = conn.createStatement()) {
                stmt.execute("USE [master]");
                stmt.execute("ALTER DATABASE [" + dbName + "] SET MULTI_USER;");
            } catch (Exception ignored) {
                logger.severe("⚠️ Không thể đặt lại MULTI_USER sau khi restore. DB có thể cần khởi động lại.");
            }
            throw e;
        } finally {
            // Luôn invalidate HikariCP connection pool sau restore (thành công hay thất bại)
            // Tránh connection cũ sau khi DB đã thay đổi
            try {
                if (jdbcTemplate.getDataSource() instanceof com.zaxxer.hikari.HikariDataSource hikari) {
                    var pool = hikari.getHikariPoolMXBean();
                    if (pool != null) {
                        pool.softEvictConnections();
                        logger.info("Đã invalidate HikariCP connection pool sau restore.");
                    }
                }
            } catch (Exception ignored) {
            }
        }

        logger.info("✅ Đã khôi phục CSDL thành công từ file: " + filename);
    }
}
