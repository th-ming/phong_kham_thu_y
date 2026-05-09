package com.rexi.pkty;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "***REMOVED***-DB_PASSWORD";
        System.out.println("HASH:" + encoder.encode(password));
    }
}

