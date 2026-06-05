package com.rexi.pkty;

import com.rexi.pkty.security.JwtFilter;
import com.rexi.pkty.security.RateLimitFilter;
import com.rexi.pkty.security.ActionAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

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

    @Autowired
    private Environment environment;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:3005,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3005,http://127.0.0.1:5173,http://127.0.0.1:5174}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // STATELESS: ko session RAM
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .contentTypeOptions(contentTypeOptions -> {})
                .frameOptions(frameOptions -> frameOptions.deny())
                .referrerPolicy(referrerPolicy -> referrerPolicy.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .permissionsPolicyHeader(permissions -> permissions.policy("camera=(), microphone=(self), geolocation=(self)"))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/system/health", "/api/system/public-cau-hinh").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/system/newsletter").permitAll()
                .requestMatchers("/public/audit/**").hasRole("ADMIN")
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                    .access((authentication, context) -> {
                        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
                        boolean isAdmin = authentication.get().getAuthorities().stream()
                                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                        return new AuthorizationDecision(isDev || isAdmin);
                    })
                .requestMatchers(
                    "/api/auth/**", "/api/chat", "/api/chat/**",
                    "/api/system/send-otp", "/api/system/verify-otp",
                    "/api/payment/**", "/api/lich-hen/gio-ranh", "/api/lich-hen/dat-lich-nhanh",
                    "/api/lich-hen/khach-vang-lai", "/api/dich-vu/**", "/api/bac-si/**",
                    "/ws/**",
                    "/public/**"
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
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-AI-ACTION",
            "X-Interaction-Source",
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
