package com.rexi.pkty.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

/**
 * DỊCH VỤ EMAIL HỆ THỐNG - REXI VET
 * - Xử lý gửi các loại email: Xác nhận đặt lịch, Nhắc hẹn, Marketing...
 * - Chạy bất đồng bộ (Async) để không làm chậm trải nghiệm người dùng
 */
@Service
public class EmailService {

    private static final Logger logger = Logger.getLogger(EmailService.class.getName());

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.transport.protocol", "smtp");
                props.put("mail.smtp.timeout", "5000");
                props.put("mail.smtp.connectiontimeout", "5000");
                props.put("mail.debug", "false");
                
                return impl;
            }
        } catch (Exception e) {
            // Lỗi truy vấn hoặc cấu hình trống -> Fallback sang mailSender tĩnh
        }
        return mailSender;
    }

    /**
     * Gửi email xác nhận khi khách hàng đặt lịch thành công
     */
    public void sendBookingConfirmation(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🐾 Xác nhận Đặt lịch thành công - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\nBé [" + petName + "] đã có lịch hẹn vào lúc " + time
                        + " ngày " + date + ".\n\nCảm ơn bạn đã tin tưởng Rexi Vet! 🐾";
                message.setText(text);
                sender.send(message);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail xác nhận: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email chào mừng khi đăng nhập lần đầu (Thiết kế Premium HTML)
     */
    public void sendWelcomeEmailHTML(String toEmail, String customerName) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setTo(toEmail);
                helper.setSubject("🐾 Chào mừng bạn đến với Gia đình Rexi Vet!");
                
                String htmlContent = getWelcomeTemplate(customerName);
                helper.setText(htmlContent, true);
                
                sender.send(message);
                logger.info("Đã gửi mail chào mừng tới: " + toEmail);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail chào mừng: " + e.getMessage());
            }
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
               "      <a href='http://localhost:3005/khach-hang/dat-lich-hen' class='cta-button'>ĐẶT LỊCH KHÁM NGAY</a>" +
               "    </div>" +
               "    <div class='footer'>" +
               "      <p>Phòng Khám Thú Y Rexi - Đường dây cấp cứu 24/7: 0353 374 156</p>" +
               "      <p>© 2026 Rexi Vet Clinic. All rights reserved.</p>" +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    /**
     * Gửi email OTP lấy lại mật khẩu
     */
    public void sendOtpEmail(String toEmail, String otp) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔒 Mã xác minh OTP - Rexi Vet");
                String text = "Xin chào,\n\nMã OTP để đặt lại mật khẩu của bạn là: " + otp + "\n" +
                        "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai!\n\nCảm ơn bạn! 🐾";
                message.setText(text);
                sender.send(message);
                logger.info("Đã gửi OTP tới: " + toEmail);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail OTP: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email nhắc hẹn cho khách hàng
     */
    public void sendReminderEmail(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔔 Nhắc hẹn: Lịch khám tại Rexi Vet vào ngày mai");
                String text = "Xin chào " + customerName + ",\n\nĐừng quên lịch hẹn của bé [" + petName + "] vào lúc "
                        + time + " ngày " + date + " nhé!\n\nChúng tôi rất mong được đón tiếp bé! 🐾";
                message.setText(text);
                sender.send(message);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail nhắc hẹn: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi mật khẩu cho tài khoản mới được tạo bởi nhân viên
     */
    public void sendPasswordEmail(String toEmail, String customerName, String password) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔑 Thông tin tài khoản đăng nhập - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\nTài khoản của bạn đã được tạo thành công.\n" +
                        "Tài khoản: " + toEmail + "\n" +
                        "Mật khẩu: " + password + "\n\nVui lòng đăng nhập và đổi mật khẩu sớm nhất có thể. 🐾";
                message.setText(text);
                sender.send(message);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail password: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email nhắc nợ cho khách hàng còn hóa đơn chưa thanh toán
     */
    public void sendDebtReminderEmail(String toEmail, String customerName, String invoiceId, java.math.BigDecimal amount) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("💸 Thông báo: Nhắc thanh toán hóa đơn - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\nBạn còn hóa đơn [" + invoiceId + "] chưa thanh toán với số tiền là: " 
                        + String.format("%,.0f VNĐ", amount) + ".\n\nVui lòng hoàn tất thanh toán sớm để bé cưng tiếp tục được hưởng dịch vụ tốt nhất nhé! 🐾";
                message.setText(text);
                sender.send(message);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mail nhắc nợ: " + e.getMessage());
            }
        });
    }
    /**
     * Gửi email Marketing / Mass email
     */
    public void sendMassEmail(String toEmail, String subject, String htmlContent) {
        JavaMailSender sender = getDynamicMailSender();
        if (sender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                // Convert \n to <br> to support simple text with line breaks as HTML
                String formattedContent = htmlContent.replace("\n", "<br>");
                helper.setText(formattedContent, true);
                sender.send(message);
            } catch (Exception e) {
                logger.severe("Lỗi gửi mass mail cho " + toEmail + ": " + e.getMessage());
            }
        });
    }
}
