package com.rexi.pkty.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Cấu trúc Dữ liệu yêu cầu Đăng nhập (Có kiểm tra tính hợp lệ)
 */
@Data
public class LoginRequest {
    
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3-50 ký tự")
    private String username;
    
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
    private String password;
}

