package com.affiliate.controller;

import com.affiliate.model.UserProfile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

    /**
     * Hiển thị trang thông tin hồ sơ cá nhân (Profile Page).
     * Khởi tạo và điền sẵn dữ liệu của đối tác KOC "Mai Phương" khớp hoàn toàn với bản thiết kế.
     */
    @GetMapping("/profile")
    public String showProfile(Model model) {
        // Điền dữ liệu giả định chuẩn thiết kế gốc
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
        return "profile";
    }
}
