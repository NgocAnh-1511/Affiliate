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
    private List<OrderTransaction> orderTransactions;

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

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderTransaction {
        private String id;
        private String kocName;
        private String username;
        private String avatar;
        private String campaignName;
        private String platform;
        private String orderAmount;
        private String commissionAmount;
        private java.math.BigDecimal commissionVal;
        private String date;
        private String status;
    }
}
