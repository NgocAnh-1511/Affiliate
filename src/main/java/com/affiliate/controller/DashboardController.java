package com.affiliate.controller;

import com.affiliate.model.DashboardStats;
import com.affiliate.model.UserProfile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.List;

@Controller
public class DashboardController {

    /**
     * Hiển thị trang Tổng quan (Dashboard Page).
     * Cung cấp các số liệu và danh sách chiến dịch mẫu chuẩn xác theo thiết kế gốc.
     */
    @GetMapping("/dashboard")
    public String showDashboard(Model model) {
        // Khởi tạo thông tin cá nhân của Mai Phương giống trang Profile để đồng bộ Sidebar
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

        // Khởi tạo dữ liệu chỉ số chiến dịch theo thiết kế dashboard.png
        List<DashboardStats.CampaignStat> campaigns = Arrays.asList(
            new DashboardStats.CampaignStat(1, "Chiến dịch BST LSOUL", "/images/campaign1.png", "tiktok", 124, "3,120,000 VNĐ"),
            new DashboardStats.CampaignStat(2, "Sale Sinh Nhật Shopee", "/images/campaign2.png", "shopee", 98, "2,450,000 VNĐ"),
            new DashboardStats.CampaignStat(3, "Combo Làm Đẹp Hè", "/images/campaign3.png", "tiktok", 67, "1,560,000 VNĐ"),
            new DashboardStats.CampaignStat(4, "Điện Gia Dụng Thông Minh", "/images/campaign4.png", "shopee", 45, "980,000 VNĐ"),
            new DashboardStats.CampaignStat(5, "Thời Trang Hè 2024", "/images/campaign5.png", "tiktok", 32, "650,000 VNĐ")
        );

        DashboardStats stats = new DashboardStats(
            "12,450",
            "18.6%",
            342,
            "22.4%",
            "2.75%",
            "8.7%",
            "8,500,000 VNĐ",
            "16.3%",
            campaigns
        );

        model.addAttribute("profile", profile);
        model.addAttribute("stats", stats);
        return "dashboard";
    }
}
