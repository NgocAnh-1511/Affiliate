package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUsersData {
    private int pendingCount;
    private List<JoinRequest> pendingRequests;
    private List<ActiveKoc> activeKocs;
    private List<StaffMember> staffMembers;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class JoinRequest {
        private String id;
        private String name;
        private String username;
        private String avatar;
        private String platform; // "tiktok", "shopee"
        private String followers;
        private String date;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActiveKoc {
        private String id;
        private String name;
        private String username;
        private String avatar;
        private String platform; // "tiktok", "shopee"
        private String followers;
        private String tier; // "diamond" (Kim cương), "gold" (Vàng), "silver" (Bạc), "basic" (Cơ bản)
        private String status; // "active" (Hoạt động), "suspended" (Tạm khóa)
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StaffMember {
        private String id;
        private String name;
        private String email;
        private String avatar;
        private String role; // "accounting" (Kế toán), "cskh" (CSKH), "campaign_manager" (Quản lý chiến dịch)
        private List<String> permissions; // e.g. ["view_balance", "approve_withdrawal", "manage_koc", "edit_campaign", "manage_users", "delete_data"]
        private String username;
        private String phone;
    }
}
