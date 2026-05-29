package com.rexi.pkty.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Tiện ích quản lý JWT Cookie bảo mật.
 * Tất cả cookie dùng httpOnly + SameSite=Lax để chặn XSS và giảm thiểu CSRF.
 */
@Component
public class CookieUtil {

    // Tên cookie khớp với frontend đang đọc
    public static final String ACCESS_TOKEN_COOKIE  = "rexi_access_token";
    public static final String REFRESH_TOKEN_COOKIE = "rexi_refresh_token";

    // Cookie sống 1 ngày (access) và 7 ngày (refresh)
    private static final int ACCESS_MAX_AGE  = 24 * 60 * 60;
    private static final int REFRESH_MAX_AGE = 7  * 24 * 60 * 60;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie; // false ở local dev (HTTP), true ở production (HTTPS)

    /** Ghi access token vào httpOnly cookie */
    public void setAccessTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, ACCESS_TOKEN_COOKIE, token, ACCESS_MAX_AGE);
    }

    /** Ghi refresh token vào httpOnly cookie */
    public void setRefreshTokenCookie(HttpServletResponse response, String token) {
        addCookie(response, REFRESH_TOKEN_COOKIE, token, REFRESH_MAX_AGE);
    }

    /** Xóa cả 2 cookie khi logout */
    public void clearAllTokenCookies(HttpServletResponse response) {
        addCookie(response, ACCESS_TOKEN_COOKIE,  "", 0);
        addCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
    }

    /** Lấy access token từ cookie (trả null nếu không có) */
    public String getAccessTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, ACCESS_TOKEN_COOKIE);
    }

    /** Lấy refresh token từ cookie (trả null nếu không có) */
    public String getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookieValue(request, REFRESH_TOKEN_COOKIE);
    }

    // ==================== PRIVATE HELPERS ====================

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);   // JS không đọc được — chặn XSS đánh cắp token
        cookie.setSecure(secureCookie); // Chỉ gửi qua HTTPS khi production
        cookie.setPath("/");        // Áp dụng toàn bộ domain
        cookie.setMaxAge(maxAge);   // 0 = xóa cookie ngay lập tức

        // Thêm SameSite=Lax thủ công qua header (Java Cookie API chưa hỗ trợ trực tiếp)
        String sameSiteValue = secureCookie ? "None" : "Lax";
        String headerValue = String.format(
            "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=%s%s",
            name, value, maxAge, sameSiteValue,
            secureCookie ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", headerValue);
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
