package com.rexi.pkty;

import com.rexi.pkty.security.JwtFilter;
import com.rexi.pkty.security.RateLimitFilter;
import com.rexi.pkty.security.ActionAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired(required = false)
    private JwtFilter jwtFilter;

    @Autowired(required = false)
    private ActionAuthFilter actionAuthFilter;

    @Autowired(required = false)
    private RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/system/health", "/api/system/cau-hinh").permitAll()
                .requestMatchers(
                    "/api/auth/**", "/api/chat", "/api/chat/**",
                    "/api/system/send-otp", "/api/system/verify-otp",
                    "/api/payment/**", "/api/lich-hen/gio-ranh",
                    "/api/lich-hen/khach-vang-lai", "/api/dich-vu/**", "/api/bac-si/**",
                    "/ws/**",
                    "/public/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/api/test-doanh-thu"
                ).permitAll()
                .requestMatchers("/api/system/**").authenticated()
                .requestMatchers("/api/admin/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(b -> b.disable())
            .formLogin(f -> f.disable());

        if (rateLimitFilter != null) {
            http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        }

        if (jwtFilter != null) {
            if (rateLimitFilter != null) {
                http.addFilterAfter(jwtFilter, RateLimitFilter.class);
            } else {
                http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
            }
        }

        if (actionAuthFilter != null) {
            if (jwtFilter != null) {
                http.addFilterAfter(actionAuthFilter, JwtFilter.class);
            } else if (rateLimitFilter != null) {
                http.addFilterAfter(actionAuthFilter, RateLimitFilter.class);
            } else {
                http.addFilterAfter(actionAuthFilter, UsernamePasswordAuthenticationFilter.class);
            }
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://localhost:3005", 
            "http://localhost:5173", 
            "http://localhost:5174", 
            "https://accounts.google.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-AI-ACTION",
            "X-Current-Path",
            "X-Current-DOM-Context",
            "X-User-Activity-Logs",
            "X-User-Name",
            "X-Forwarded-For",
            "CF-IPCountry",
            "X-Region",
            "X-City"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
