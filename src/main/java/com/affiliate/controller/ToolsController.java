package com.affiliate.controller;

import com.affiliate.model.Campaign;
import com.affiliate.model.UserProfile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.List;

@Controller
public class ToolsController {

    /**
     * Hiển thị trang Công cụ Affiliate & Chiến dịch (Tools Page).
     * Điền đầy đủ thông tin mẫu của 6 chiến dịch lớn trùng khớp hoàn toàn với bản thiết kế.
     */
    @GetMapping("/tools")
    public String showToolsPage(Model model) {
        // Khởi tạo thông tin hồ sơ của Mai Phương để hiển thị đồng bộ ở chân Sidebar & Header
        UserProfile profile = new UserProfile(
            "Mai Phương",
            "maiphuong@gmail.com",
            "0987 654 321",
            "Gò Vấp, TP. Hồ Chí Minh",
            "KOC123456",
            "KOC Hạng Vàng",
            "Vietcombank",
            "Mai Phương",
            "**** **** 1234",
            "150K Followers",
            "@koc_khampha"
        );

        // Khởi tạo danh sách 6 chiến dịch mẫu chuẩn xác theo bản thiết kế
        List<Campaign> campaigns = Arrays.asList(
            new Campaign(1, "Chiến dịch BST LSOUL", "/images/campaign1.png", "tiktok", "Hoa hồng 15%", "Thời gian: 10/05/2024 - 31/05/2024", "Đã tham gia: 1,245 KOC/KOL", true, "NỔI BẬT", "lsoul"),
            new Campaign(2, "Siêu Sale Shopee 5.5", "/images/campaign2.png", "shopee", "Hoa hồng 12%", "Thời gian: 01/05/2024 - 05/05/2024", "Đã tham gia: 2,560 KOC/KOL", false, "", "shopee-sale"),
            new Campaign(3, "Điện Tử - Công Nghệ", "/images/campaign3.png", "lazada", "Hoa hồng 10%", "Thời gian: 05/05/2024 - 20/05/2024", "Đã tham gia: 980 KOC/KOL", false, "", "electronics"),
            new Campaign(4, "Làm Đẹp - Chăm Sóc Da", "/images/campaign4.png", "tiktok", "Hoa hồng 12%", "Thời gian: 01/05/2024 - 31/05/2024", "Đã tham gia: 1,876 KOC/KOL", false, "", "beauty"),
            new Campaign(5, "Thời Trang Hè 2024", "/images/campaign5.png", "shopee", "Hoa hồng 11%", "Thời gian: 15/05/2024 - 15/06/2024", "Đã tham gia: 1,432 KOC/KOL", false, "NEW ARRIVAL", "summer"),
            new Campaign(6, "Nội Thất & Trang Trí", "/images/campaign6.png", "tiki", "Hoa hồng 9%", "Thời gian: 10/05/2024 - 25/05/2024", "Đã tham gia: 654 KOC/KOL", false, "", "furniture")
        );

        model.addAttribute("profile", profile);
        model.addAttribute("campaigns", campaigns);
        return "tools";
    }
}
