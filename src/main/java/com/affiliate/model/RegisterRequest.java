package com.affiliate.model;

import lombok.Data;

/**
 * Model (DTO) đại diện cho dữ liệu yêu cầu đăng ký tài khoản gửi từ View lên Controller.
 */
@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String socialChannelLink; // Link kênh MXH chính (TikTok/Shopee)
    private String password;
    private String confirmPassword;
    private boolean agreeToTerms;
}
