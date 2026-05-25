package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminStats {
    private String gmv;
    private String gmvChange;
    private String systemCommission;
    private String commissionChange;
    private int activeKocCount;
    private String kocChange;
    private int activeCampaigns;
    private String campaignChange;
    private List<ReconciliationItem> pendingReconciliations;
    private List<TopKocItem> topKocs;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReconciliationItem {
        private String id;
        private String kocName;
        private String amount;
        private String campaign;
        private String date;
        private String status; // "pending" (Chờ duyệt), "processing" (Đang xử lý), "approved" (Đã duyệt)
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopKocItem {
        private int rank;
        private String name;
        private String avatar;
        private String rankLevel; // "diamond" (Kim cương), "gold" (Vàng), "silver" (Bạc)
        private String sales;
        private String commission;
    }
}
