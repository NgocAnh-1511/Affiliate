package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminDisputesData {
    private int pendingCount;
    private String responseTime;
    private List<DisputeTicket> tickets;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DisputeTicket {
        private String id;
        private String kocName;
        private String username;
        private String avatar;
        private String tier; // "Vàng", "Bạc", "Kim Cương"
        private String subject;
        private String date;
        private int commentCount;
        private String status; // "pending" (Chờ xử lý), "resolved" (Đã giải quyết), "closed" (Đóng)
        private String description;
        private String updateTime;
        private List<String> attachments; // file names
    }
}
