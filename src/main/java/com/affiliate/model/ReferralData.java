package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReferralData {
    private String referralCode;
    private String referralLink;
    private int totalReferred;
    private int activeReferred;
    private String totalCommissionEarned;
    private String totalReferredTrend;
    private String activeReferredTrend;
    private String commissionTrend;
    private List<ReferredKoc> referredKocs;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReferredKoc {
        private int id;
        private String fullName;
        private String username;
        private String avatar;
        private String joinDate;
        private int totalOrders;
        private String commissionEarned;
        private String status; // "Đang hoạt động", "Tạm khóa"
    }
}
