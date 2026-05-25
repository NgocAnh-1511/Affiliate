package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminTrackingData {
    private String totalClicks;
    private String validClicks;
    private String blockedClicks;
    private String trustScore; // e.g. "95/100"
    private List<FraudAlert> alerts;
    private List<SuspectTarget> suspects;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FraudAlert {
        private String time;
        private String message;
        private String severity; // "Cao", "Trung bình"
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SuspectTarget {
        private String id;
        private String kocName;
        private String username;
        private String avatar;
        private String platform;
        private String trafficSource;
        private String behavior;
        private String spamRate;
        private String blockedCount;
        private String lastDetection;
    }
}
