package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

/**
 * DỊCH VỤ EMAIL HỆ THỐNG
 * - Xử lý gửi các loại email: Xác nhận đặt lịch, Nhắc hẹn, Marketing...
 * - Chạy bất đồng bộ (Async) để không làm chậm trải nghiệm người dùng
 */
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Gửi email xác nhận khi khách hàng đặt lịch thành công
     */
    public void sendBookingConfirmation(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🐾 Xác nhận Đặt lịch thành công - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\nBé [" + petName + "] đã có lịch hẹn vào lúc " + time
                        + " ngày " + date + ".\n\nTeam Rexi 🐾";
                message.setText(text);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail xác nhận: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email kiểm tra kết nối hệ thống
     */
    public void sendTestEmail(String toEmail) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔔 TEST HỆ THỐNG MAIL - Rexi Vet");
                message.setText("Hệ thống mail của sếp hoạt động ngon lành cành đào rồi nhé!");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail test: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email chào mừng khi khách đăng ký Newsletter ở Footer
     */
    public void sendNewsletterWelcomeEmail(String toEmail) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🐾 Chào mừng đến với Gia đình Rexi!");
                message.setText(
                        "Cảm ơn sếp đã tin tưởng đăng ký nhận tin từ Rexi! Chúng tôi sẽ gửi tới sếp những kiến thức chăm sóc bé cưng bổ ích nhất. 🐾");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail chào mừng: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email ưu đãi/Marketing hàng loạt (Dành cho Admin)
     */
    public void sendCustomEmail(String toEmail, String subject, String content) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(content + "\n\nTrân trọng,\nTeam Rexi 🐾");
                mailSender.send(message);
                System.out.println("✅ Đã gửi mail Marketing tới: " + toEmail);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail Marketing: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email nhắc hẹn cho khách hàng (Dùng cho SchedulingService)
     */
    public void sendReminderEmail(String toEmail, String customerName, String petName, String doctorName,
            String date, String time, String serviceName) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔔 Nhắc hẹn: Lịch khám tại Rexi Vet vào ngày mai");
                String text = "Xin chào " + customerName + ",\n\nĐừng quên lịch hẹn của bé [" + petName + "] vào lúc "
                        + time + " ngày " + date + " nhé!\n\nChúng tôi rất mong được đón tiếp bé! 🐾";
                message.setText(text);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail nhắc hẹn: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email nhắc nhở thanh toán công nợ
     */
    public void sendDebtReminderEmail(String toEmail, String customerName, String invoiceId,
            java.math.BigDecimal amount) {
        if (mailSender == null)
            return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔔 Nhắc nhở thanh toán hóa đơn - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\n" +
                        "Phòng khám thú y Rexi xin thông báo hóa đơn #" + invoiceId + " của sếp với số tiền " +
                        String.format("%,.0f VNĐ", amount) + " hiện đang chờ thanh toán.\n\n" +
                        "Sếp vui lòng thanh toán sớm để hoàn tất hồ sơ nhé. Nếu sếp đã thanh toán, xin vui lòng bỏ qua email này.\n\n"
                        +
                        "Cảm ơn sếp và chúc bé cưng luôn khỏe mạnh! 🐾\n" +
                        "Team Rexi.";
                message.setText(text);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail nhắc nợ: " + e.getMessage());
            }
        });
    }

    /**
     * Gửi email cung cấp mật khẩu ngẫu nhiên cho khách vãng lai
     */
    public void sendPasswordEmail(String toEmail, String customerName, String password) {
        if (mailSender == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject("🔑 Thông tin tài khoản đăng nhập - Rexi Vet");
                String text = "Xin chào " + customerName + ",\n\nHệ thống đã tạo tài khoản cho bạn để theo dõi lịch sử khám bệnh.\n" +
                        "Tài khoản: " + toEmail + "\n" +
                        "Mật khẩu: " + password + "\n\n" +
                        "Vui lòng đăng nhập và đổi mật khẩu sớm nhất có thể.\n\nTeam Rexi 🐾";
                message.setText(text);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Lỗi gửi mail password: " + e.getMessage());
            }
        });
    }
}
