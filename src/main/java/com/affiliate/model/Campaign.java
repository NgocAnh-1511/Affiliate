package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Campaign {
    private int id;
    private String dbId;
    private String name;
    private String imageUrl;
    private String trafficSource; // "tiktok", "shopee", "lazada", "tiki"
    private String commission;    // "Hoa hồng 15%" etc.
    private String time;          // "10/05/2024 - 31/05/2024"
    private String joinedCount;   // "1,245 KOC/KOL"
    private boolean featured;     // true if "Nổi bật"
    private String tag;           // "NỔI BẬT", "NEW ARRIVAL", etc.
    private String bannerClass;   // "lsoul", "shopee-sale", "electronics", "beauty", "summer", "furniture"
    private boolean joined;       // true nếu KOC đã đăng ký tham gia chiến dịch này
    private String productLink;   // Đường dẫn sản phẩm gốc / gian hàng mục tiêu
}
