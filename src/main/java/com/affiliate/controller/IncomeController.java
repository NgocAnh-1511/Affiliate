package com.affiliate.controller;

import com.affiliate.model.Transaction;
import com.affiliate.model.UserProfile;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;
import java.util.List;

@Controller
public class IncomeController {

    /**
     * Hiển thị trang Quản lý thu nhập (Income Page).
     * Cung cấp các số dư khả dụng và danh sách 8 giao dịch chi tiết trùng khớp bản thiết kế.
     */
    @GetMapping("/income")
    public String showIncomePage(Model model) {
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

        // Danh sách 8 giao dịch theo ảnh quản lý thu nhập.png
        List<Transaction> transactions = Arrays.asList(
            new Transaction("#ORD12345678", "BST LSOUL TikTok", "tiktok", "1,250,000 VNĐ", "187,500 VNĐ", "19/05/2024 14:32", "success", "Thành công"),
            new Transaction("#ORD12345677", "Sale Sinh Nhật Shopee", "shopee", "980,000 VNĐ", "117,600 VNĐ", "19/05/2024 11:15", "pending", "Chờ đối soát"),
            new Transaction("#ORD12345676", "Điện Tử - Công Nghệ", "lazada", "2,450,000 VNĐ", "245,000 VNĐ", "18/05/2024 20:45", "success", "Thành công"),
            new Transaction("#ORD12345675", "Combo Làm Đẹp Hè", "tiktok", "650,000 VNĐ", "97,500 VNĐ", "18/05/2024 16:20", "pending", "Chờ đối soát"),
            new Transaction("#ORD12345674", "Thời Trang Hè 2024", "shopee", "1,780,000 VNĐ", "213,600 VNĐ", "17/05/2024 09:35", "success", "Thành công"),
            new Transaction("#ORD12345673", "Nội Thất & Trang Trí", "tiki", "890,000 VNĐ", "89,000 VNĐ", "16/05/2024 18:50", "cancelled", "Hủy"),
            new Transaction("#ORD12345672", "BST LSOUL TikTok", "tiktok", "1,120,000 VNĐ", "168,000 VNĐ", "16/05/2024 10:22", "success", "Thành công"),
            new Transaction("#ORD12345671", "Điện Tử - Công Nghệ", "lazada", "3,250,000 VNĐ", "325,000 VNĐ", "15/05/2024 22:10", "success", "Thành công")
        );

        model.addAttribute("profile", profile);
        model.addAttribute("transactions", transactions);
        model.addAttribute("availableBalance", "15,500,000 VNĐ");
        model.addAttribute("pendingBalance", "2,300,000 VNĐ");
        
        return "income";
    }
}
