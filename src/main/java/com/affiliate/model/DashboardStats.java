package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStats {
    private String clicks;
    private String clickChange;
    private int orders;
    private String ordersChange;
    private String cr;
    private String crChange;
    private String commission;
    private String commissionChange;
    private List<CampaignStat> topCampaigns;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CampaignStat {
        private int rank;
        private String name;
        private String avatar;
        private String trafficSource; // "tiktok" or "shopee"
        private int orders;
        private String commission;
    }
}
