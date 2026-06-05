package com.rexi.pkty;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void generateHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("admin@rexi.com");
        System.out.println("HASH_OUTPUT:" + hash + ":HASH_OUTPUT");
    }
}
