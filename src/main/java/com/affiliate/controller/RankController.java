package com.affiliate.controller;

import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Optional;

@Controller
public class RankController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Hiển thị trang Hạng thành viên (Membership Tier / Rank).
     * Cung cấp thông tin hạng của người dùng thực tế nhằm hiển thị chính xác tiến trình thăng hạng.
     */
    @GetMapping("/rank")
    public String showRankPage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // 1. Tính tổng doanh số của các đơn hàng 'approved' thành công
            java.math.BigDecimal currentRevenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE koc_id = ? AND status = 'approved'",
                java.math.BigDecimal.class,
                user.getId()
            );
            if (currentRevenue == null) {
                currentRevenue = java.math.BigDecimal.ZERO;
            }
            
            double revDouble = currentRevenue.doubleValue();
            
            // 2. Xác định phân hạng phù hợp dựa theo doanh thu tích lũy
            String calculatedTier = "silver";
            if (revDouble <= 20000000.0) {
                calculatedTier = "silver";
            } else if (revDouble <= 100000000.0) {
                calculatedTier = "gold";
            } else if (revDouble <= 500000000.0) {
                calculatedTier = "diamond";
            } else {
                calculatedTier = "vip";
            }
            
            // 3. Tự động nâng cấp phân hạng trong CSDL nếu đạt tiêu chuẩn cao hơn
            if (getTierWeight(calculatedTier) > getTierWeight(user.getTier())) {
                try {
                    user.setTier(calculatedTier);
                    userRepository.save(user);
                } catch (Exception e) {
                    System.err.println("Defensive Rank Upgrade Save Error: " + e.getMessage());
                }
            }
            
            String activeTier = user.getTier();
            String currentTierName = "";
            String nextTierName = "";
            double currentTierMin = 0.0;
            double nextTierGoal = 0.0;
            
            if ("vip".equalsIgnoreCase(activeTier)) {
                currentTierMin = 500000000.0;
                currentTierName = "Hạng VIP";
                nextTierName = "Hạng tối thượng";
                nextTierGoal = revDouble > 0 ? revDouble : 500000000.0;
            } else if ("diamond".equalsIgnoreCase(activeTier)) {
                currentTierMin = 100000000.0;
                currentTierName = "Hạng Kim Cương";
                nextTierName = "Hạng VIP";
                nextTierGoal = 500000000.0;
            } else if ("gold".equalsIgnoreCase(activeTier)) {
                currentTierMin = 20000000.0;
                currentTierName = "Hạng Vàng";
                nextTierName = "Hạng Kim Cương";
                nextTierGoal = 100000000.0;
            } else {
                currentTierMin = 0.0;
                currentTierName = "Hạng Bạc";
                nextTierName = "Hạng Vàng";
                nextTierGoal = 20000000.0;
            }
            
            double remainingAmount = Math.max(0.0, nextTierGoal - revDouble);
            double progressPercent = 100.0;
            if (nextTierGoal > currentTierMin) {
                progressPercent = ((revDouble - currentTierMin) / (nextTierGoal - currentTierMin)) * 100.0;
            }
            if (progressPercent > 100.0) {
                progressPercent = 100.0;
            }
            if (progressPercent < 0.0) {
                progressPercent = 0.0;
            }
            
            java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
            
            model.addAttribute("profile", user);
            model.addAttribute("currentRevenueVal", revDouble);
            model.addAttribute("currentRevenueStr", df.format(currentRevenue) + " VNĐ");
            model.addAttribute("currentTierMinStr", df.format(new java.math.BigDecimal(currentTierMin)) + " VNĐ");
            model.addAttribute("nextTierGoalVal", nextTierGoal);
            model.addAttribute("nextTierGoalStr", df.format(new java.math.BigDecimal(nextTierGoal)) + " VNĐ");
            model.addAttribute("remainingAmountStr", df.format(new java.math.BigDecimal(remainingAmount)) + " VNĐ");
            model.addAttribute("progressPercent", progressPercent);
            model.addAttribute("currentTierName", currentTierName.toUpperCase());
            model.addAttribute("nextTierName", nextTierName);
            model.addAttribute("activeTier", activeTier);
        } else {
            return "redirect:/login";
        }

        return "rank";
    }

    private int getTierWeight(String tier) {
        if (tier == null) return 0;
        switch (tier.toLowerCase()) {
            case "vip": return 4;
            case "diamond": return 3;
            case "gold": return 2;
            case "silver": return 1;
            case "basic":
            default: return 0;
        }
    }
}
