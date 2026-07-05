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

/** CÔNG CỤ XỬ LÝ JWT TOKEN (Tạo, giải mã, validate) */
@Component
public class JwtUtil {

    private static final Logger logger = Logger.getLogger(JwtUtil.class.getName());

    // Secret Key ký Token
    @Value("${jwt.secret:}")
    private String secretKey;

    // Expire Token (mặc định 7 ngày)
    @Value("${jwt.expiration:604800000}")
    private long expiration;

    // Expire Refresh Token (mặc định 30 ngày)
    @Value("${jwt.refreshExpiration:2592000000}")
    private long refreshExpiration;

    // Startup validation: kiểm tra JWT_SECRET đã được cấu hình chưa
    @jakarta.annotation.PostConstruct
    public void validateJwtSecret() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                "JWT_SECRET chưa được cấu hình! Vui lòng set env var JWT_SECRET trước khi khởi động app.");
        }
        if (secretKey.getBytes().length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET phải có ít nhất 32 bytes! Giá trị hiện tại quá ngắn.");
        }
        logger.info("JWT_SECRET đã được cấu hình đúng (length=" + secretKey.length() + " chars).");
    }

    // Lấy khóa ký (min 32 bytes an toàn)
    private Key getSigningKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT_SECRET chưa được cấu hình.");
        }
        byte[] keyBytes = secretKey.getBytes();
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET phải có ít nhất 32 bytes.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /** Tạo Token kèm Role và last_password_change */
    public String generateToken(String username, String role, long lastPasswordChangeEpoch) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("lpc", lastPasswordChangeEpoch); // last_password_change epoch millis
        return createToken(claims, username);
    }

    /** Tạo Refresh Token dài hạn */
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshExpiration, ChronoUnit.MILLIS);
        return Jwts.builder().setSubject(username).setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt)).signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    // Build Token params
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

    /** Validate Token */
    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.warning("Xác thực Token thất bại: " + e.getMessage());
            return false;
        }
    }

    /** Get username từ Token */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Get Role từ Token */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Get last_password_change epoch millis từ Token */
    public long extractLastPasswordChange(String token) {
        Object lpc = extractAllClaims(token).get("lpc");
        return lpc != null ? ((Number) lpc).longValue() : 0L;
    }

    // Get ngày hết hạn
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Decode claims từ Token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Kiểm tra đã hết hạn chưa
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
