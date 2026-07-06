package com.rexi.pkty.service;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootTest
public class EmailServiceTest {

    @BeforeAll
    public static void setup() {
        try {
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.err.println("Could not load .env file: " + e.getMessage());
        }
    }

    @Autowired
    private EmailService emailService;

    @Test
    public void testSendWelcomeEmail() {
        // Th gi mail cho mng thc t
        System.out.println("--- BT U TEST GI MAIL THT ---");
        emailService.sendWelcomeEmailHTML("thuyvan09818@gmail.com", "Khch hng Thy Vn");
        System.out.println("---  GI LNH GI MAIL (ASYNCHRONOUS) ---");
        
        // i mt cht  log li hin ra nu c
        try { Thread.sleep(5000); } catch (InterruptedException e) {}
    }
}
