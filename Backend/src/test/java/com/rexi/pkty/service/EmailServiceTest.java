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
        // Thử gửi mail cho mạng thực tế
        System.out.println("--- BẮT ĐẦU TEST GỬI MAIL THẬT ---");
        emailService.sendWelcomeEmailHTML("thuyvan09818@gmail.com", "Khách hàng Thúy Vân");
        System.out.println("---   GỬI LỆNH GỬI MAIL (ASYNCHRONOUS) ---");
        
        // Đợi một chút để log lại hiện ra nếu có
        try { Thread.sleep(5000); } catch (InterruptedException e) {}
    }
}
