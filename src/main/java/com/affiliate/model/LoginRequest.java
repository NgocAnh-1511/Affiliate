package com.affiliate.model;

import lombok.Data;

/**
 * Model (DTO) đại diện cho dữ liệu yêu cầu đăng nhập gửi từ View lên Controller.
 */
@Data
public class LoginRequest {
    private String username; // Có thể là Email hoặc Số điện thoại
    private String password;
    private boolean rememberMe;
}
