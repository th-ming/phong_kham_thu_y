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
 * CÃ”NG Cá»¤ Xá»¬ LÃ JWT TOKEN
 * - Quáº£n lÃ½ viá»‡c táº¡o, trÃ­ch xuáº¥t vÃ  xÃ¡c thá»±c tháº» bÃ i (Token)
 * - Token cÃ³ thá»i háº¡n sá»­ dá»¥ng vÃ  Ä‘Æ°á»£c mÃ£ hÃ³a báº£o máº­t
 */
@Component
public class JwtUtil {

    private static final Logger logger = Logger.getLogger(JwtUtil.class.getName());

    // KhÃ³a bÃ­ máº­t dÃ¹ng Ä‘á»ƒ kÃ½ tÃªn lÃªn Token (láº¥y tá»« cáº¥u hÃ¬nh hoáº·c dÃ¹ng máº·c Ä‘á»‹nh)
    @Value("${jwt.secret:RexiVeterinaryClinicManagementSystemSuperSecretKey1234567890!!!}")
    private String secretKey;

    // Thá»i gian háº¿t háº¡n cá»§a Token (máº·c Ä‘á»‹nh 7 ngÃ y)
    @Value("${jwt.expiration:604800000}")
    private long expiration;

    // Thá»i gian háº¿t háº¡n cá»§a Refresh Token (máº·c Ä‘á»‹nh 30 ngÃ y)
    @Value("${jwt.refreshExpiration:2592000000}")
    private long refreshExpiration;

    // Láº¥y khÃ³a kÃ½ tÃªn (Äáº£m báº£o Ä‘á»™ dÃ i tá»‘i thiá»ƒu 32 bytes Ä‘á»ƒ an toÃ n)
    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        if (keyBytes.length < 32) {
            logger.warning("Cáº¢NH BÃO: KhÃ³a bÃ­ máº­t JWT quÃ¡ ngáº¯n, khÃ´ng an toÃ n!");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Táº¡o Token má»›i kÃ¨m theo vai trÃ² (Role) cá»§a ngÆ°á»i dÃ¹ng
     */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role); // Gáº¯n chá»©c danh vÃ o Token
        return createToken(claims, username);
    }

    /**
     * Táº¡o Refresh Token dÃ i háº¡n (Chá»‰ chá»©a username)
     */
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshExpiration, ChronoUnit.MILLIS);
        return Jwts.builder().setSubject(username).setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt)).signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    // Khá»Ÿi táº¡o cÃ¡c thÃ´ng sá»‘ ká»¹ thuáº­t cho Token
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

    /**
     * Kiá»ƒm tra xem Token cÃ²n hiá»‡u lá»±c vÃ  Ä‘Ãºng ngÆ°á»i dÃ¹ng khÃ´ng
     */
    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.warning("XÃ¡c thá»±c Token tháº¥t báº¡i: " + e.getMessage());
            return false;
        }
    }

    /**
     * Láº¥y TÃªn Ä‘Äƒng nháº­p tá»« Token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Láº¥y Vai trÃ² (Role) tá»« Token
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // Kiá»ƒm tra thá»i háº¡n cá»§a Token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Äá»c toÃ n bá»™ ná»™i dung bÃªn trong Token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Kiá»ƒm tra xem Token Ä‘Ã£ háº¿t háº¡n chÆ°a
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}

