package com.rexi.pkty;

import com.rexi.pkty.security.JwtUtil;

import java.util.Date;
import java.util.function.Function;

public class TestJwtUtil extends JwtUtil {
    @Override
    public String extractUsername(String token) {
        return null;
    }

    @Override
    public String extractRole(String token) {
        return null;
    }

    @Override
    public Date extractExpiration(String token) {
        return new Date(0);
    }

    @Override
    public <T> T extractClaim(String token, Function<io.jsonwebtoken.Claims, T> claimsResolver) {
        return null;
    }

    @Override
    public Boolean validateToken(String token, String username) {
        return false;
    }
}
