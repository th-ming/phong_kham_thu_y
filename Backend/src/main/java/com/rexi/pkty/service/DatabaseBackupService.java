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

    // Tá»± Ä‘á»™ng cháº¡y ngáº§m vÃ o lÃºc 02:00 sÃ¡ng má»—i ngÃ y
    @Scheduled(cron = "0 0 2 * * ?")
    public void autoBackup() {
        try {
            logger.info("Báº¯t Ä‘áº§u tiáº¿n trÃ¬nh sao lÆ°u cÆ¡ sá»Ÿ dá»¯ liá»‡u Ä‘á»‹nh ká»³...");
            backupDatabaseManual();
            cleanOldBackups();
        } catch (Exception e) {
            logger.severe("Lá»—i khi sao lÆ°u tá»± Ä‘á»™ng: " + e.getMessage());
        }
    }

    // HÃ m thá»±c thi viá»‡c dá»n dáº¹p cÃ¡c file backup cÅ© hÆ¡n 7 ngÃ y
    private void cleanOldBackups() {
        String backupDirPath = System.getProperty("user.dir") + File.separator + "backups";
        File backupDir = new File(backupDirPath);

        if (backupDir.exists() && backupDir.isDirectory()) {
            File[] files = backupDir.listFiles((dir, name) -> name.startsWith("PKTY_Backup_") && name.endsWith(".bak"));
            if (files != null) {
                // Láº¥y sá»‘ ngÃ y lÆ°u trá»¯ tá»« DB
                int retentionDays = 7;
                try {
                    String val = jdbcTemplate.queryForObject(
                            "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'backup_retention_days'",
                            String.class);
                    if (val != null) {
                        retentionDays = Integer.parseInt(val);
                    }
                } catch (Exception e) {
                    logger.warning("KhÃ´ng láº¥y Ä‘Æ°á»£c cáº¥u hÃ¬nh ngÃ y sao lÆ°u, dÃ¹ng máº·c Ä‘á»‹nh 7 ngÃ y");
                }

                // TÃ­nh toÃ¡n thá»i Ä‘iá»ƒm giá»›i háº¡n (tÃ­nh báº±ng milliseconds)
                long cutoffTime = System.currentTimeMillis() - ((long) retentionDays * 24 * 60 * 60 * 1000);
                for (File file : files) {
                    if (file.lastModified() < cutoffTime) {
                        if (file.delete()) {
                            logger.info("ðŸ§¹ ÄÃ£ tá»± Ä‘á»™ng xÃ³a file backup cÅ© (hÆ¡n " + retentionDays + " ngÃ y): "
                                    + file.getName());
                        } else {
                            logger.warning("âŒ KhÃ´ng thá»ƒ xÃ³a file backup cÅ©: " + file.getName());
                        }
                    }
                }
            }
        }
    }

    // HÃ m thá»±c thi lá»‡nh Backup SQL Server
    public String backupDatabaseManual() throws Exception {
        // Táº¡o thÆ° má»¥c "backups" náº±m ngay trong thÆ° má»¥c cháº¡y project Backend
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
        logger.info("âœ… ÄÃ£ sao lÆ°u CSDL thÃ nh cÃ´ng táº¡i: " + backupFileName);
        return backupFileName;
    }
}
