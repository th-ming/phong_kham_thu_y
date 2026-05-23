package com.rexi.pkty;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Configuration
@Profile("test")
public class TestSupportConfig {

    @Bean
    public TestJwtUtil jwtUtil() {
        return new TestJwtUtil();
    }

    @Bean
    public TestJwtFilter jwtFilter() {
        return new TestJwtFilter();
    }

    // We avoid creating a SimpMessagingTemplate here; controllers that need it should mark it optional for tests.
}
