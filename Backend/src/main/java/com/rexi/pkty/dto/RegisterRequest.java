package com.rexi.pkty.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Cấu trúc Dữ liệu yêu cầu Đăng ký Tài khoản (Có kiểm tra tính hợp lệ)
 */
@Data
public class RegisterRequest {
    
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3-50 ký tự")
    private String ten_dang_nhap;
    
    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[!@#$%^&*()_+\\-={}\\[\\]|;:'\",.<>/?]).{6,}$", message = "Mật khẩu phải có ít nhất 6 ký tự và ít nhất một ký tự đặc biệt")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
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
}

