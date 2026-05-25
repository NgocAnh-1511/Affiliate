package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Transaction {
    private String orderId;
    private String campaignName;
    private String trafficSource; // "tiktok", "shopee", "lazada", "tiki"
    private String totalAmount;
    private String commission;
    private String createdDate;
    private String status;        // "success", "pending", "cancelled"
    private String statusText;    // "Thành công", "Chờ đối soát", "Hủy"
}
