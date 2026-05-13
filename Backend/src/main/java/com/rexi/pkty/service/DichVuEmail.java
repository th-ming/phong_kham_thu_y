package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class DichVuEmail {

    @Autowired
    private JavaMailSender mailSender;

    public void guiOtp(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Mã OTP xác thực - Rexi Vet");
        message.setText("Chào bạn,\n\nMã OTP của bạn là: " + otp + "\nMã này có hiệu lực trong 5 phút.\n\nTrân trọng,\nĐội ngũ Rexi.");
        mailSender.send(message);
    }

    public void guiEmailChaoMung(String to, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Chào mừng bạn đến với Rexi Veterinary!");
        message.setText("Chào " + name + ",\n\nCảm ơn bạn đã tin tưởng và đăng ký tài khoản tại Rexi.\nChúng tôi luôn sẵn sàng chăm sóc thú cưng của bạn.\n\nTrân trọng,\nRexi Team.");
        mailSender.send(message);
    }

    public void sendBookingConfirmation(String to, String customerName, String petName, String date, String time, String service, String doctor) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác nhận lịch hẹn thành công - Rexi Vet");
        message.setText("Chào " + customerName + ",\n\nLịch hẹn của bé " + petName + " đã được xác nhận:\n" +
                "- Ngày: " + date + "\n" +
                "- Giờ: " + time + "\n" +
                "- Dịch vụ: " + service + "\n" +
                "- Bác sĩ: " + doctor + "\n\n" +
                "Vui lòng đến đúng giờ để được phục vụ tốt nhất.\n\nTrân trọng,\nRexi Vet.");
        mailSender.send(message);
    }

    public void sendReminderEmail(String to, String customerName, String petName, String date, String time, String service) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Nhắc lịch hẹn khám - Rexi Vet");
        message.setText("Chào " + customerName + ",\n\nĐừng quên lịch hẹn khám cho bé " + petName + " vào ngày mai nhé:\n" +
                "- Ngày: " + date + "\n" +
                "- Giờ: " + time + "\n" +
                "- Dịch vụ: " + service + "\n\n" +
                "Hẹn gặp lại bạn và bé tại Rexi Vet!\n\nTrân trọng,\nRexi Vet.");
        mailSender.send(message);
    }

    public void guiEmailBaoCaoDoanhThu(String to, String date, BigDecimal revenue, Integer bookings) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Báo cáo doanh thu ngày " + date + " - Rexi Vet");
        message.setText("Chào sếp,\n\nBáo cáo hoạt động ngày " + date + ":\n" +
                "- Tổng doanh thu: " + revenue + " VNĐ\n" +
                "- Tổng số lịch hẹn: " + bookings + "\n\n" +
                "Chúc sếp một ngày tốt lành!\n\nTrân trọng,\nHệ thống quản lý Rexi.");
        mailSender.send(message);
    }

    public void sendPasswordEmail(String to, String customerName, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Thông tin tài khoản Rexi Vet");
        message.setText("Chào " + customerName + ",\n\nTài khoản của bạn đã được tạo thành công.\n" +
                "Mật khẩu đăng nhập của bạn là: " + password + "\n" +
                "Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.\n\nTrân trọng,\nRexi Vet.");
        mailSender.send(message);
    }

    public void guiEmailBaoCao(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }
}
