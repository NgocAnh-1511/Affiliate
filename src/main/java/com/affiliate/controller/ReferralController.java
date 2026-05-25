package com.affiliate.controller;

import com.affiliate.model.UserProfile;
import com.affiliate.model.ReferralData;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.ArrayList;
import java.util.List;

@Controller
public class ReferralController {

    /**
     * Hiển thị trang Hệ thống Giới thiệu (Referral Invite Page) cho KOL/KOC.
     * Khởi tạo thông số và danh sách mạng lưới KOC đồng bộ hoàn hảo với ảnh chụp thiết kế GIỚI THIỆU.png
     */
    @GetMapping("/referral")
    public String showReferral(Model model) {
        // Khởi tạo thông tin cá nhân của Mai Phương để hiển thị Avatar/Thẻ hạng KOC ở Sidebar
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

        // Khởi tạo danh sách KOC được mời trong mạng lưới
        List<ReferralData.ReferredKoc> referredKocs = new ArrayList<>();
        referredKocs.add(new ReferralData.ReferredKoc(1, "Nguyễn Minh Đức", "@duc.review", "profile_avatar.png", "15/04/2024", 28, "560,000 VNĐ", "Đang hoạt động"));
        referredKocs.add(new ReferralData.ReferredKoc(2, "Trần Quốc Bảo", "@bao.store", "profile_avatar.png", "18/04/2024", 22, "440,000 VNĐ", "Đang hoạt động"));
        referredKocs.add(new ReferralData.ReferredKoc(3, "Phạm Thu Hương", "@huong.unbox", "profile_avatar.png", "20/04/2024", 16, "320,000 VNĐ", "Đang hoạt động"));
        referredKocs.add(new ReferralData.ReferredKoc(4, "Lê Hoàng Nam", "@nam.tech", "profile_avatar.png", "22/04/2024", 19, "380,000 VNĐ", "Đang hoạt động"));
        referredKocs.add(new ReferralData.ReferredKoc(5, "Vũ Thảo Vy", "@vy.beauty", "profile_avatar.png", "25/04/2024", 14, "280,000 VNĐ", "Đang hoạt động"));
        referredKocs.add(new ReferralData.ReferredKoc(6, "Đỗ Anh Khoa", "@khoa.gaming", "profile_avatar.png", "28/04/2024", 11, "220,000 VNĐ", "Đang hoạt động"));

        ReferralData referralData = new ReferralData(
            "REF-KOC2026",
            "aff.vn/invite/koc123",
            24,
            18,
            "3,200,000 VNĐ",
            referredKocs
        );
        model.addAttribute("referralData", referralData);

        return "referral";
    }
}
