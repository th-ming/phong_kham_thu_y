package com.rexi.pkty.security;

import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.logging.Logger;

/**
 * Blacklist JWT theo jti, lưu DB (bền vững giữa các lần restart / nhiều instance).
 * Dùng khi logout và khi thu hồi token. Schema tự tạo, tương thích SQL Server + PostgreSQL.
 */
@Component
public class TokenBlacklistService {

    private static final Logger logger = Logger.getLogger(TokenBlacklistService.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean schemaReady = false;
    private final Object schemaLock = new Object();

    /** Đảm bảo bảng tồn tại (lazy, chạy 1 lần) — tương thích dual-dialect. */
    private void ensureSchema() {
        if (schemaReady) return;
        synchronized (schemaLock) {
            if (schemaReady) return;
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            String ddl = pg
                    ? "CREATE TABLE IF NOT EXISTS token_blacklist ("
                        + "jti VARCHAR(64) PRIMARY KEY, "
                        + "expires_at TIMESTAMP NOT NULL, "
                        + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
                    : "IF OBJECT_ID(N'dbo.token_blacklist', N'U') IS NULL "
                        + "CREATE TABLE token_blacklist ("
                        + "jti VARCHAR(64) PRIMARY KEY, "
                        + "expires_at DATETIME NOT NULL, "
                        + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP)";
            jdbcTemplate.execute(ddl);
            schemaReady = true;
        }
    }

    /** Đưa một token (theo jti) vào blacklist đến thời điểm hết hạn của chính nó. */
    public void revoke(String jti, Instant expiresAt) {
        if (jti == null || jti.isBlank() || expiresAt == null) return;
        try {
            ensureSchema();
            jdbcTemplate.update(
                    "DELETE FROM token_blacklist WHERE jti = ?",
                    jti);
            jdbcTemplate.update(
                    "INSERT INTO token_blacklist (jti, expires_at, created_at) VALUES (?, ?, ?)",
                    jti, Timestamp.from(expiresAt), Timestamp.from(Instant.now()));
        } catch (Exception e) {
            // Không chặn logout — chỉ log để theo dõi
            logger.warning("[TOKEN_BLACKLIST] Không revoke được jti: " + e.getMessage());
        }
    }

    /** true nếu jti đã bị thu hồi và chưa tới hạn hết hạn của token đó. */
    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) return false;
        try {
            ensureSchema();
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM token_blacklist WHERE jti = ?",
                    Integer.class, jti);
            return count != null && count > 0;
        } catch (Exception e) {
            // DB lỗi → fail-open (giữ hành vi cũ khi chưa có blacklist)
            logger.warning("[TOKEN_BLACKLIST] Không kiểm tra được blacklist: " + e.getMessage());
            return false;
        }
    }

    /** Dọn các dòng đã quá hạn, mỗi giờ một lần. */
    @Scheduled(initialDelay = 600_000L, fixedDelay = 3_600_000L)
    public void cleanupExpired() {
        try {
            ensureSchema();
            int removed = jdbcTemplate.update("DELETE FROM token_blacklist WHERE expires_at < ?", Timestamp.from(Instant.now()));
            if (removed > 0) {
                logger.info("[TOKEN_BLACKLIST] Đã dọn " + removed + " dòng hết hạn.");
            }
        } catch (Exception e) {
            logger.warning("[TOKEN_BLACKLIST] Cleanup lỗi: " + e.getMessage());
        }
    }
}
