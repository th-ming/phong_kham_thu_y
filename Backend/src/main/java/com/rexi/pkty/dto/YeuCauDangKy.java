package com.rexi.pkty.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class YeuCauDangKy {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3-50 ký tự")
    private String ten_dang_nhap;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
    @Pattern(regexp = "^(?=.*[@$!%*#?&]).*$", message = "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*#?&)")
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