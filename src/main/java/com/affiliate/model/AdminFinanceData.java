package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminFinanceData {
    private int pendingCount;
    private String pendingAmount;
    private String totalPaidThisMonth;
    private List<PayoutRequest> payoutRequests;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PayoutRequest {
        private String id;
        private String kocName;
        private String username;
        private String avatar;
        private String amount;
        private String bankName;
        private String bankLogo; // css helper class or name
        private String bankCard;
        private String date;
        private String status; // "pending"
    }
}
