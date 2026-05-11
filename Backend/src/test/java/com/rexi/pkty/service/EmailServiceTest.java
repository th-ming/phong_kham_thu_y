package com.rexi.pkty.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class EmailServiceTest {

    @Autowired
    private EmailService emailService;

    @Test
    public void testSendWelcomeEmail() {
        // Thử gửi mail chào mừng thực tế
        System.out.println("--- BẮT ĐẦU TEST GỬI MAIL THẬT ---");
        emailService.sendWelcomeEmailHTML("thuyvan09818@gmail.com", "Khách hàng Thúy Vân");
        System.out.println("--- ĐÃ GỬI LỆNH GỬI MAIL (ASYNCHRONOUS) ---");
        
        // Đợi một chút để log lỗi hiện ra nếu có
        try { Thread.sleep(5000); } catch (InterruptedException e) {}
    }
}
