package com.rexi.pkty.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.logging.Logger;

/**
 * CÔNG CỤ XỬ LÝ JWT TOKEN (Đã đổi tên sang tiếng Việt theo yêu cầu)
 * - Quản lý việc tạo, trích xuất và xác thực thẻ bài (Token)
 */
@Component
public class JwtCongCu {

    private static final Logger logger = Logger.getLogger(JwtCongCu.class.getName());

    @Value("${jwt.secret:RexiVeterinaryClinicManagementSystemSuperSecretKey1234567890!!!}")
    private String secretKey;

    @Value("${jwt.expiration:604800000}")
    private long expiration;

    @Value("${jwt.refreshExpiration:2592000000}")
    private long refreshExpiration;

    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        if (keyBytes.length < 32) {
            logger.warning("CẢNH BÁO: Khóa bí mật JWT quá ngắn, không an toàn!");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username);
    }

    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshExpiration, ChronoUnit.MILLIS);
        return Jwts.builder().setSubject(username).setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt)).signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expiration, ChronoUnit.MILLIS);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.warning("Xác thực Token thất bại: " + e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
