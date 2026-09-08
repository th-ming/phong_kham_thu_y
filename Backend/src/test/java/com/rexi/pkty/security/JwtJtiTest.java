package com.rexi.pkty.security;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test jti claim trong JWT (dùng cho TokenBlacklistService).
 * jwt.secret được set qua reflection trước khi build token.
 */
class JwtJtiTest {

    private JwtUtil jwtUtilWithSecret() throws Exception {
        JwtUtil util = new JwtUtil();
        var field = JwtUtil.class.getDeclaredField("secretKey");
        field.setAccessible(true);
        field.set(util, "test-secret-key-that-is-at-least-32-bytes-long!!");
        var expField = JwtUtil.class.getDeclaredField("expiration");
        expField.setAccessible(true);
        expField.setLong(util, 3_600_000L);
        var refreshField = JwtUtil.class.getDeclaredField("refreshExpiration");
        refreshField.setAccessible(true);
        refreshField.setLong(util, 86_400_000L);
        return util;
    }

    @Test
    void accessTokenContainsJtiClaim() throws Exception {
        JwtUtil util = jwtUtilWithSecret();
        String token = util.generateToken("admin", "ADMIN");
        String jti = util.extractJti(token);
        assertNotNull(jti);
        assertFalse(jti.isBlank());
        assertTrue(jti.length() >= 32); // UUID dạng chuẩn
    }

    @Test
    void refreshTokenContainsJtiClaim() throws Exception {
        JwtUtil util = jwtUtilWithSecret();
        String token = util.generateRefreshToken("admin");
        String jti = util.extractJti(token);
        assertNotNull(jti);
        assertFalse(jti.isBlank());
    }

    @Test
    void twoTokensHaveDifferentJti() throws Exception {
        JwtUtil util = jwtUtilWithSecret();
        String t1 = util.generateToken("admin", "ADMIN");
        String t2 = util.generateToken("admin", "ADMIN");
        assertNotEquals(util.extractJti(t1), util.extractJti(t2));
    }

    @Test
    void accessTokenStillValidatesAndExtractsRole() throws Exception {
        JwtUtil util = jwtUtilWithSecret();
        String token = util.generateToken("bacsi", "BAC_SI");
        assertEquals("bacsi", util.extractUsername(token));
        assertEquals("BAC_SI", util.extractRole(token));
        assertTrue(util.validateToken(token, "bacsi"));
        assertNotNull(util.extractExpiration(token));
        assertTrue(util.extractExpiration(token).after(new Date()));
    }
}
