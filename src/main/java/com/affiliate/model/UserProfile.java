package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfile {
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String kocId;
    private String rank;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private String tiktokFollowers;
    private String tiktokHandle;
}
