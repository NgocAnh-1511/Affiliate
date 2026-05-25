package com.affiliate.controller;

import com.affiliate.model.DashboardStats;
import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Controller
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Hiển thị trang Tổng quan (Dashboard Page).
     * Cung cấp các số liệu và danh sách chiến dịch mẫu chuẩn xác theo thiết kế gốc.
     */
    @GetMapping("/dashboard")
    public String showDashboard(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);
        } else {
            return "redirect:/login";
        }

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

        model.addAttribute("stats", stats);
        return "dashboard";
    }
}
