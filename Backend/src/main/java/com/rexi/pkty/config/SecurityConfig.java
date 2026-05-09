package com.rexi.pkty.config;

import com.rexi.pkty.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * CẤU HÌNH BẢO MẬT HỆ THỐNG (Security Config)
 * - Quản lý việc ai được truy cập vào đâu
 * - Thiết lập mã hóa mật khẩu và cấu hình CORS
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    /**
     * CÔNG CỤ MÃ HÓA MẬT KHẨU
     * - Sử dụng thuật toán BCrypt để băm mật khẩu khách hàng/nhân viên
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * THIẾT LẬP CHỐT CHẶN TRUY CẬP (Security Filter Chain)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // BẢO MẬT CAO: Ép buộc HTTPS (Đã cấu hình
        // server.forward-headers-strategy=native để NGINX pass SSL qua được)
        http.requiresChannel(channel -> channel.anyRequest().requiresSecure());

        http.csrf(csrf -> csrf.disable()) // Tắt CSRF vì chúng ta dùng JWT
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // BƯỚC 3: Mở cổng cho Swagger UI không cần đăng nhập
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // BẢO MẬT LỚP 1: Mở cổng GET cho danh sách Bác sĩ và Dịch vụ để hiển thị ở
                        // Trang chủ
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dich-vu/**", "/api/bac-si/**")
                        .permitAll()

                        // BẢO MẬT LỚP 2: Cổng Xác thực, Chatbot, Đặt lịch vãng lai và Webhook thanh
                        // toán tự động
                        .requestMatchers("/api/auth/**", "/api/chat/**", "/api/system/newsletter/**",
                                "/api/system/send-otp", "/api/system/verify-otp",
                                "/api/lich-hen/gio-ranh", "/api/lich-hen/khach-vang-lai",
                                "/api/payment/vietqr/webhook", "/api/payment/vnpay/return")
                        .permitAll()

                        // Các cổng API chỉ dành riêng cho ADMIN
                        .requestMatchers("/api/nhan-vien/reset-data").hasRole("ADMIN")
                        .requestMatchers("/api/system/cau-hinh/**", "/api/system/chuc-nang/**").hasRole("ADMIN")

                        // Các cổng API yêu cầu quyền ADMIN hoặc BÁC SĨ
                        .requestMatchers("/api/ho-so-benh-an/**").hasAnyRole("ADMIN", "BAC_SI")

                        // Cho phép các yêu cầu OPTIONS (kiểm tra CORS)
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        // Tất cả các yêu cầu khác đều phải đăng nhập mới được vào
                        .anyRequest().authenticated())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                // Hệ thống không lưu phiên làm việc (Stateless) vì dùng Token
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Gắn bộ lọc JWT vào trước quá trình xác thực mặc định
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CẤU HÌNH CORS (Chia sẻ tài nguyên giữa các nguồn)
     * - Cho phép Frontend (localhost:3000) kết nối tới Backend
     */
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                Arrays.asList("http://localhost:3000", "http://localhost:5173", "http://localhost:3001"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

