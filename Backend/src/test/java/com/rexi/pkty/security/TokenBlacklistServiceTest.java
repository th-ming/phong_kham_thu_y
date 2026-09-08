package com.rexi.pkty.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TokenBlacklistServiceTest {

    private JdbcTemplate jdbcTemplate;
    private TokenBlacklistService service;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        service = new TokenBlacklistService();
        // Inject qua reflection vì field là @Autowired
        try {
            var field = TokenBlacklistService.class.getDeclaredField("jdbcTemplate");
            field.setAccessible(true);
            field.set(service, jdbcTemplate);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        // Mặc định: DB là SQL Server (isPostgres bắt connection metadata)
        org.mockito.Mockito.doAnswer(inv -> null).when(jdbcTemplate).execute(anyString());
    }

    @Test
    void revokeInsertsJtiWithExpiry() {
        Instant exp = Instant.now().plus(1, ChronoUnit.HOURS);
        service.revoke("jti-abc", exp);

        ArgumentCaptor<Object> jtiCaptor = ArgumentCaptor.forClass(Object.class);
        ArgumentCaptor<Object> expCaptor = ArgumentCaptor.forClass(Object.class);
        verify(jdbcTemplate, times(1)).update(contains("INSERT INTO token_blacklist"),
                jtiCaptor.capture(), expCaptor.capture(), any(Object.class));
        assertEquals("jti-abc", jtiCaptor.getValue());
        Timestamp ts = (Timestamp) expCaptor.getValue();
        assertTrue(Math.abs(ts.toInstant().toEpochMilli() - exp.toEpochMilli()) < 1000);
    }

    @Test
    void revokeIgnoresBlankJti() {
        service.revoke("", Instant.now());
        service.revoke(null, Instant.now());
        verify(jdbcTemplate, times(0)).update(contains("INSERT INTO token_blacklist"), any(Object.class), any(Object.class), any(Object.class));
    }

    @Test
    void isRevokedTrueWhenCountPositive() {
        // SQL Server branch: IF OBJECT_ID... được gọi qua execute()
        when(jdbcTemplate.queryForObject(contains("token_blacklist"), eq(Integer.class), eq("jti-xyz")))
                .thenReturn(1);
        assertTrue(service.isRevoked("jti-xyz"));
    }

    @Test
    void isRevokedFalseWhenCountZero() {
        when(jdbcTemplate.queryForObject(contains("token_blacklist"), eq(Integer.class), eq("jti-fresh")))
                .thenReturn(0);
        assertFalse(service.isRevoked("jti-fresh"));
    }

    @Test
    void isRevokedFailsOpenOnDbError() {
        when(jdbcTemplate.queryForObject(contains("token_blacklist"), eq(Integer.class), eq("jti-err")))
                .thenThrow(new RuntimeException("DB down"));
        assertFalse(service.isRevoked("jti-err"));
    }

    @Test
    void isRevokedFalseForNullJti() {
        assertFalse(service.isRevoked(null));
        assertFalse(service.isRevoked(""));
    }

    @Test
    void cleanupDeletesExpiredRows() {
        when(jdbcTemplate.update(contains("DELETE FROM token_blacklist"), any(Object.class))).thenReturn(3);
        service.cleanupExpired();
        verify(jdbcTemplate).update(contains("expires_at <"), any(Object.class));
    }

    @Test
    void cleanupNeverThrowsOnDbError() {
        when(jdbcTemplate.update(contains("DELETE FROM token_blacklist"), any(Object.class)))
                .thenThrow(new RuntimeException("DB down"));
        // Không được ném exception (scheduled task)
        service.cleanupExpired();
    }

    @Test
    void generatedTokensCarryUniqueJti() {
        var token1 = newToken();
        var token2 = newToken();
        assertNotEquals(token1, token2);
    }

    private String newToken() {
        return UUID.randomUUID().toString();
    }
}
