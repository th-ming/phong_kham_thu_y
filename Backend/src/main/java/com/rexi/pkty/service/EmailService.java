package com.rexi.pkty.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;

// * * DỊCH VỤ EMAIL HỆ THỐNG - REXI VET * - Xử lý gửi các loại email: xn đặt lịch, Nhắc hẹn, Marketing... * - Chạy bất đồng bộ (Async) để ko làm chậm trải nghiệm người dùng
@Service
public class EmailService {

    private static final Logger logger = Logger.getLogger(EmailService.class.getName());

    // Thread pool riêng cho mass email: tối đa 5 thread, hàng đợi 2000 task
    // CallerRunsPolicy: khi queue đầy thì caller tự gửi thay vì reject → không mất email
    private static final ExecutorService MASS_EMAIL_EXECUTOR = new ThreadPoolExecutor(
        2, 5,
        60L, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(2000),
        r -> { Thread t = new Thread(r, "mass-email"); t.setDaemon(true); return t; },
        new ThreadPoolExecutor.CallerRunsPolicy()
    );

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    private JavaMailSender getDynamicMailSender() {
        try {
            String host = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'mail_host'", String.class);
            String portStr = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'mail_port'", String.class);
            String username = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'mail_username'", String.class);
            String password = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'mail_password'", String.class);

            if (host != null && !host.trim().isEmpty() &&
                username != null && !username.trim().isEmpty() &&
                password != null && !password.trim().isEmpty()) {
                
                org.springframework.mail.javamail.JavaMailSenderImpl impl = new org.springframework.mail.javamail.JavaMailSenderImpl();
                impl.setHost(host.trim());
                impl.setPort(Integer.parseInt(portStr != null ? portStr.trim() : "587"));
                impl.setUsername(username.trim());
                impl.setPassword(password.trim());
                
                java.util.Properties props = impl.getJavaMailProperties();
                props.put("mail.smtp.auth", "true");
                props.put("mail.transport.protocol", "smtp");
                props.put("mail.smtp.timeout", "5000");
                props.put("mail.smtp.connectiontimeout", "5000");
                props.put("mail.debug", "false");

                if ("465".equals(portStr != null ? portStr.trim() : "")) {
                    props.put("mail.smtp.ssl.enable", "true");
                    props.put("mail.smtp.socketFactory.port", "465");
                    props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
                } else {
                    props.put("mail.smtp.starttls.enable", "true");
                }
                
                return impl;
            }
        } catch (Exception e) {
            // Lỗi truy vấn hoặc config trống -> Fallback sang mailSender tĩnh
        }
        return mailSender;
    }

    private boolean sendViaBrevoApi(String toEmail, String recipientName, String subject, String content, boolean isHtml) {
        try {
            String apiKey = null;
            try {
                apiKey = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'brevo_api_key'", String.class);
            } catch (Exception e) {
                // Ignore database miss, check system properties / env
            }
            if (apiKey == null || apiKey.trim().isEmpty()) {
                apiKey = System.getProperty("BREVO_API_KEY");
            }
            if (apiKey == null || apiKey.trim().isEmpty()) {
                apiKey = System.getenv("BREVO_API_KEY");
            }
            
            if (apiKey == null || apiKey.trim().isEmpty()) {
                return false; // No Brevo key, fallback to SMTP
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("api-key", apiKey.trim());

            String senderEmail = "rexivetsys@gmail.com";
            try {
                String dbSender = jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'mail_username'", String.class);
                if (dbSender != null && !dbSender.trim().isEmpty()) {
                    senderEmail = dbSender.trim();
                }
            } catch (Exception e) {}

            Map<String, Object> sender = Map.of("name", "Rexi Vet Clinic", "email", senderEmail);
            Map<String, Object> to = Map.of("email", toEmail, "name", recipientName != null ? recipientName : toEmail);
            
            Map<String, Object> body = Map.of(
                "sender", sender,
                "to", List.of(to),
                "subject", subject,
                isHtml ? "htmlContent" : "textContent", content
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully sent email via Brevo API to: " + toEmail);
                return true;
            } else {
                logger.severe("Failed to send email via Brevo API: " + response.getBody());
            }
        } catch (Exception e) {
            logger.severe("Error sending email via Brevo API: " + e.getMessage());
        }
        return false;
    }

    private boolean sendEmailHelper(String toEmail, String recipientName, String subject, String content, boolean isHtml) {
        // Try Brevo HTTP API first if key exists
        if (sendViaBrevoApi(toEmail, recipientName, subject, content, isHtml)) {
            return true;
        }
        
        // Fallback to SMTP
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return false;
        try {
            if (isHtml) {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(content, true);
                sender.send(message);
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(content);
                sender.send(message);
            }
            logger.info("Email sent successfully via SMTP to: " + toEmail);
            return true;
        } catch (Exception e) {
            logger.severe("SMTP email send failed: " + e.getMessage());
            return false;
        }
    }

    // * * Gửi email xn khi khách hàng đặt lịch thành công
    public void sendBookingConfirmation(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        CompletableFuture.runAsync(() -> {
            String text = "Xin chào " + customerName + ",\n\nBé [" + petName + "] đã có lịch hẹn vào lúc " + time
                    + " ngày " + date + ".\n\nCảm ơn bạn đã tin tưởng Rexi Vet! 🐾";
            sendEmailHelper(toEmail, customerName, "🐾 Xác nhận Đặt lịch thành công - Rexi Vet", text, false);
        });
    }

    // * * Gửi email chào mừng khi đăng nhập lần đầu (Thiết kế Premium HTML)
    public void sendWelcomeEmailHTML(String toEmail, String customerName) {
        CompletableFuture.runAsync(() -> {
            sendEmailHelper(toEmail, customerName, "🐾 Chào mừng bạn đến với Gia đình Rexi Vet!", getWelcomeTemplate(customerName), true);
        });
    }

    private String getWelcomeTemplate(String customerName) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "  <meta charset='UTF-8'>" +
               "  <style>" +
               "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 0; }" +
               "    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }" +
               "    .header { background: #0f9d8a; padding: 30px; text-align: center; color: white; }" +
               "    .content { padding: 30px; text-align: center; }" +
               "    .highlight { color: #0f9d8a; font-weight: 700; }" +
               "    .cta-button { display: inline-block; background: #0f9d8a; color: #ffffff !important; text-decoration: none; padding: 15px 30px; border-radius: 50px; font-weight: 800; margin-top: 20px; box-shadow: 0 4px 10px rgba(15,157,138,0.3); }" +
               "    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }" +
               "  </style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'><h1>Chào mừng đến với Rexi Vet!</h1></div>" +
               "    <div class='content'>" +
               "      <p>Xin chào <span class='highlight'>" + customerName + "</span>,</p>" +
               "      <p>Chào mừng bạn đã gia nhập cộng đồng yêu thú cưng của <strong>Rexi Vet</strong>.</p>" +
               "      <p>Chúng tôi mang đến tiêu chuẩn y khoa quốc tế kết hợp cùng tình yêu thương vô bờ bến. Bé cưng của bạn sẽ được chăm sóc như chính gia đình chúng tôi.</p>" +
               "      <a href='" + frontendUrl("/khach-hang/dat-lich-hen") + "' class='cta-button'>ĐẶT LỊCH KHÁM NGAY</a>" +
               "    </div>" +
               "    <div class='footer'>" +
               "      <p>Phòng Khám Thú Y Rexi - Đường dây cấp cứu 24/7: 0353 374 156</p>" +
               "      <p>© 2026 Rexi Vet Clinic. All rights reserved.</p>" +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    private String frontendUrl(String path) {
        String base = frontendUrl == null || frontendUrl.isBlank() ? "http://localhost:3005" : frontendUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + path;
    }

    // * * Gửi email OTP lấy lại mật khẩu
    public boolean sendOtpEmail(String toEmail, String otp) {
        String text = "Xin chào,\n\nMã OTP để đặt lại mật khẩu của bạn là: " + otp + "\n" +
                "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai!\n\nCảm ơn bạn! 🐾";
        return sendEmailHelper(toEmail, "Khách hàng", "🔒 Mã xác minh OTP - Rexi Vet", text, false);
    }

    // * * Gửi email nhắc hẹn cho khách hàng
    public void sendReminderEmail(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        CompletableFuture.runAsync(() -> {
            String text = "Xin chào " + customerName + ",\n\nĐừng quên lịch hẹn của bé [" + petName + "] vào lúc "
                    + time + " ngày " + date + " nhé!\n\nChúng tôi rất mong được đón tiếp bé! 🐾";
            sendEmailHelper(toEmail, customerName, "🔔 Nhắc hẹn: Lịch khám tại Rexi Vet vào ngày mai", text, false);
        });
    }

    // * * Gửi mật khẩu cho tài khoản mới được tạo bởi nhân viên
    public void sendPasswordEmail(String toEmail, String customerName, String password) {
        CompletableFuture.runAsync(() -> {
            String text = "Xin chào " + customerName + ",\n\nTài khoản của bạn đã được tạo thành công.\n" +
                    "Tài khoản: " + toEmail + "\n" +
                    "Mật khẩu: " + password + "\n\nVui lòng đăng nhập và đổi mật khẩu sớm nhất có thể. 🐾";
            sendEmailHelper(toEmail, customerName, "🔑 Thông tin tài khoản đăng nhập - Rexi Vet", text, false);
        });
    }

    // * * Gửi email nhắc nợ cho khách hàng còn hóa đơn chưa thanh toán
    public void sendDebtReminderEmail(String toEmail, String customerName, String invoiceId, java.math.BigDecimal amount) {
        CompletableFuture.runAsync(() -> {
            String text = "Xin chào " + customerName + ",\n\nBạn còn hóa đơn [" + invoiceId + "] chưa thanh toán với số tiền là: " 
                    + String.format("%,.0f VNĐ", amount) + ".\n\nVui lòng hoàn tất thanh toán sớm để bé cưng tiếp tục được hưởng dịch vụ tốt nhất nhé! 🐾";
            sendEmailHelper(toEmail, customerName, "💸 Thông báo: Nhắc thanh toán hóa đơn - Rexi Vet", text, false);
        });
    }

    // * * Gửi email Marketing / Mass email — chạy qua executor có giới hạn để tránh OOM và IP bị blacklist
    public void sendMassEmail(String toEmail, String subject, String htmlContent) {
        MASS_EMAIL_EXECUTOR.submit(() -> {
            String formattedContent = htmlContent.replace("\n", "<br>");
            sendEmailHelper(toEmail, "", subject, formattedContent, true);
        });
    }

    public void sendSecurityAlertEmail(String toEmail, java.util.Map<String, Object> alert) {
        CompletableFuture.runAsync(() -> {
            String text = "Rexi Security phát hiện hành vi tấn công và đã tự động chặn IP.\n\n" +
                    "IP: " + alert.getOrDefault("ip", "") + "\n" +
                    "Vị trí suy đoán: " + alert.getOrDefault("locationHint", "") + "\n" +
                    "Hình thức: " + alert.getOrDefault("attackType", "") + "\n" +
                    "Method/Path: " + alert.getOrDefault("method", "") + " " + alert.getOrDefault("path", "") + "\n" +
                    "User-Agent: " + alert.getOrDefault("userAgent", "") + "\n" +
                    "Bằng chứng: " + alert.getOrDefault("evidence", "") + "\n" +
                    "Thời gian: " + alert.getOrDefault("detectedAt", "") + "\n\n" +
                    "Mức độ: " + alert.getOrDefault("severity", "") + "\n" +
                    "Phân tích: " + alert.getOrDefault("riskSummary", "") + "\n" +
                    "Hướng xử lý: " + alert.getOrDefault("recommendedActions", "") + "\n" +
                    "Quyết định đề xuất: " + alert.getOrDefault("adminDecision", "") + "\n\n" +
                    "IP này chỉ được gỡ chặn khi Admin xóa khỏi danh sách chặn trong hệ thống.";
            sendEmailHelper(toEmail, "Admin", "🚨 Rexi Security Alert - IP đã bị chặn tự động", text, false);
        });
    }
}
