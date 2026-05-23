package com.rexi.pkty;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.rexi.pkty.security.JwtUtil;
import org.mockito.Mockito;
import com.rexi.pkty.security.JwtFilter;

@Configuration
@Profile("test")
public class TestBeansConfig {

    @Bean
    public SimpMessagingTemplate simpMessagingTemplate() {
        return Mockito.mock(SimpMessagingTemplate.class);
    }

    @Bean
    public JwtUtil jwtUtil() {
        return Mockito.mock(JwtUtil.class);
    }

    @Bean
    public JwtFilter jwtFilter() {
        return Mockito.mock(JwtFilter.class);
    }
}
