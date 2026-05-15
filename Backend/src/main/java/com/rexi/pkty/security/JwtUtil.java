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
 * CÔNG CỤ XỬ LÝ JWT TOKEN
 * - Quản lý việc tạo, trích xuất và xác thực thẻ bài (Token)
 * - Token có thời hạn sử dụng và được mã hóa bảo mật
 */
@Component
public class JwtUtil {

    private static final Logger logger = Logger.getLogger(JwtUtil.class.getName());

    // Khóa bí mật dùng để ký tên lên Token (lấy từ cấu hình hoặc dùng mặc định)
    @Value("${jwt.secret:RexiVeterinaryClinicManagementSystemSuperSecretKey1234567890!!!}")
    private String secretKey;

    // Thời gian hết hạn của Token (mặc định 7 ngày)
    @Value("${jwt.expiration:604800000}")
    private long expiration;

    // Thời gian hết hạn của Refresh Token (mặc định 30 ngày)
    @Value("${jwt.refreshExpiration:2592000000}")
    private long refreshExpiration;

    // Lấy khóa ký tên (Đảm bảo độ dài tối thiểu 32 bytes để an toàn)
    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        if (keyBytes.length < 32) {
            logger.warning("CẢNH BÁO: Khóa bí mật JWT quá ngắn, không an toàn!");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo Token mới kèm theo vai trò (Role) của người dùng
     */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role); // Gắn chức danh vào Token
        return createToken(claims, username);
    }

     /**
     * Tạo Refresh Token dài hạn (Chỉ chứa username)
     */
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshExpiration, ChronoUnit.MILLIS);
        return Jwts.builder().setSubject(username).setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt)).signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    // Khởi tạo các thông số kỹ thuật cho Token
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
     * Kiểm tra xem Token còn hiệu lực và đúng người dùng không
     */
    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.warning("Xác thực Token thất bại: " + e.getMessage());
            return false;
        }
    }

    /**
     * Lấy Tên đăng nhập từ Token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

     /**
     * Lấy Vai trò (Role) từ Token
     */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // Kiểm tra thời hạn của Token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Đọc toàn bộ nội dung bên trong Token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Kiểm tra xem Token đã hết hạn chưa
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}

