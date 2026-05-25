package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminCampaignData {
    private String name;
    private String duration;
    private String budget;
    private String status; // "active", "draft"
    private List<CommissionTier> commissionTiers;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CommissionTier {
        private String id;
        private String rankName;
        private String icon; // "diamond", "gold", "silver", "basic"
        private String requirement;
        private int rate; // e.g. 15, 12, 10, 8
        private boolean active;
    }
}
