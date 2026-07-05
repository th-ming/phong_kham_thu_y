package com.rexi.pkty.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

// DTO yêu cầu đăng ký, đã validate
@Data
public class RegisterRequest {
    
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3-50 ký tự")
    private String ten_dang_nhap;
    
    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[!@#$%^&*()_+\\-={}\\[\\]|;:'\",.<>/?]).{7,20}$", message = "Mat khau phai tu 7-20 ky tu va co it nhat 1 ky tu dac biet")
    @Size(min = 7, max = 20, message = "Mat khau phai tu 7-20 ky tu")
    private String mat_khau;
    
    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(min = 2, max = 100, message = "Tên khách hàng phải từ 2-100 ký tự")
    private String ten_khach_hang;
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải là 10-11 chữ số")
    private String sdt;
    
    @Size(max = 200, message = "Địa chỉ không quá 200 ký tự")
    private String dia_chi;

    // Nam sinh KHACH_HANG de ca nhan hoa trai nghiem ngay tu lan dang nhap dau tien
    @Min(value = 1900, message = "Năm sinh phải từ 1900 trở lên")
    private Integer nam_sinh;
}
