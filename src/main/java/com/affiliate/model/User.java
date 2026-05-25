package com.affiliate.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 50, unique = true)
    private String phone; // Hỗ trợ lưu trữ số điện thoại phục vụ đăng nhập

    @Column(length = 255)
    private String avatar = "default_avatar.png"; // Mặc định avatar trắng sạch

    @Column(name = "cover_image", length = 255)
    private String coverImage = "default_cover.png"; // Mặc định cover trắng sạch

    @Column(length = 255)
    private String address; // Địa chỉ (mặc định để trống khi đăng ký)

    @Column(name = "tiktok_link", length = 255)
    private String tiktokLink; // Link kênh TikTok

    @Column(name = "shopee_link", length = 255)
    private String shopeeLink; // Link cửa hàng Shopee

    @Column(name = "facebook_link", length = 255)
    private String facebookLink; // Link trang cá nhân Facebook

    @Column(name = "instagram_link", length = 255)
    private String instagramLink; // Link trang cá nhân Instagram

    @Column(name = "bank_name", length = 100)
    private String bankName; // Tên ngân hàng

    @Column(name = "bank_account_name", length = 150)
    private String bankAccountName; // Tên chủ tài khoản ngân hàng

    @Column(name = "bank_account_number", length = 100)
    private String bankAccountNumber; // Số tài khoản ngân hàng

    @Column(nullable = false, length = 50)
    private String role; // "ADMIN", "STAFF", "KOL/KOC"

    @Column(length = 50)
    private String tier = "basic"; // "diamond", "gold", "silver", "basic"

    @Column(length = 50)
    private String status = "active"; // "active", "suspended", "pending"

    @Column(name = "referred_by_id")
    private Integer referredById;

    @Column(name = "referral_code", unique = true, length = 50)
    private String referralCode;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
