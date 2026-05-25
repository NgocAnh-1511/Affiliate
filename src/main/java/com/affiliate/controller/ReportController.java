package com.affiliate.controller;

import com.affiliate.model.UserProfile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReportController {

    /**
     * Hiển thị trang Hỗ trợ & Khiếu nại (Support & Disputes / Report Page).
     * Cung cấp thông tin hồ sơ của Mai Phương để hiển thị chính xác ở Header.
     */
    @GetMapping("/report")
    public String showReportPage(Model model) {
        // Khởi tạo thông tin hồ sơ của Mai Phương để đồng bộ Sidebar & Header
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

        model.addAttribute("profile", profile);
        return "report";
    }
}
