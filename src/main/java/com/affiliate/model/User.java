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

    @Column(length = 50)
    private String phone; // Hỗ trợ lưu trữ số điện thoại phục vụ đăng nhập

    @Column(length = 255)
    private String avatar = "profile_avatar.png";

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
