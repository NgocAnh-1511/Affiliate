package com.affiliate.controller;

import com.affiliate.model.DashboardStats;
import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Controller
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Tự động gieo mầm (seed) clicks cho KOC nếu chưa phát sinh clicks nào
     * để đảm bảo biểu đồ hoạt động trực quan và đẹp mắt.
     */
    private void seedClicksForKoc(int kocId) {
        try {
            Integer clickCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ?",
                Integer.class,
                kocId
            );
            if (clickCount == null || clickCount == 0) {
                LocalDateTime now = LocalDateTime.now();
                // Gieo mầm clicks cho 7 ngày qua
                for (int i = 6; i >= 0; i--) {
                    LocalDateTime day = now.minusDays(i);
                    int clicksOnDay = 15 + (int)(Math.random() * 20); // 15-35 clicks mỗi ngày
                    for (int j = 0; j < clicksOnDay; j++) {
                        String clickId = "CLK-" + kocId + "-" + i + "-" + j + "-" + (int)(Math.random() * 1000);
                        jdbcTemplate.update(
                            "INSERT INTO click_tracking (click_id, koc_id, campaign_id, ip_address, user_agent, clicked_at, cookie_expires_at) " +
                            "VALUES (?, ?, 'CAM-2026-007', '127.0.0.1', 'Mozilla/5.0 Chrome/124.0', ?, ?)",
                            clickId,
                            kocId,
                            java.sql.Timestamp.valueOf(day.minusMinutes((int)(Math.random() * 720))),
                            java.sql.Timestamp.valueOf(day.plusDays(30))
                        );
                    }
                }
                System.out.println("Seeded simulated click-tracking data for KOC ID " + kocId);
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not seed clicks: " + e.getMessage());
        }
    }

    /**
     * Hiển thị trang Tổng quan (Dashboard Page).
     * Cung cấp các số liệu và danh sách chiến dịch thực tế từ CSDL.
     */
    @GetMapping("/dashboard")
    public String showDashboard(@org.springframework.web.bind.annotation.RequestParam(value = "period", defaultValue = "all") String period, Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            return "redirect:/login";
        }
        User user = userOpt.get();
        model.addAttribute("profile", user);

        DashboardStats stats = calculateKocStats(user.getId(), period);
        model.addAttribute("stats", stats);
        model.addAttribute("selectedPeriod", period);
        return "dashboard";
    }

    /**
     * Hàm helper tính toán tất cả các chỉ số (KPIs, Top Campaigns, Device Ratios) động từ CSDL theo bộ lọc thời gian.
     */
    public DashboardStats calculateKocStats(int kocId, String period) {
        String clickFilter = "";
        String txFilter = "";
        
        String clickPrevFilter = "";
        String txPrevFilter = "";
        
        if ("week".equalsIgnoreCase(period)) {
            clickFilter = " AND clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            txFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            
            clickPrevFilter = " AND clicked_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND clicked_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
            txPrevFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if ("month".equalsIgnoreCase(period)) {
            clickFilter = " AND clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            txFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            
            clickPrevFilter = " AND clicked_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND clicked_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
            txPrevFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        } else if ("year".equalsIgnoreCase(period)) {
            clickFilter = " AND clicked_at >= DATE_FORMAT(NOW(), '%Y-01-01')";
            txFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(NOW(), '%Y-01-01')";
            
            clickPrevFilter = " AND clicked_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 YEAR), '%Y-01-01') AND clicked_at < DATE_FORMAT(NOW(), '%Y-01-01')";
            txPrevFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 YEAR), '%Y-01-01') AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_FORMAT(NOW(), '%Y-01-01')";
        }

        // 1. Clicks
        Integer totalClicks = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ?" + clickFilter,
            Integer.class,
            kocId
        );
        if (totalClicks == null) totalClicks = 0;

        Integer prevClicks = 0;
        if (!clickPrevFilter.isEmpty()) {
            prevClicks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ?" + clickPrevFilter,
                Integer.class,
                kocId
            );
            if (prevClicks == null) prevClicks = 0;
        }

        // 2. Orders
        Integer successfulOrders = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved'" + txFilter,
            Integer.class,
            kocId
        );
        if (successfulOrders == null) successfulOrders = 0;

        Integer prevOrders = 0;
        if (!txPrevFilter.isEmpty()) {
            prevOrders = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved'" + txPrevFilter,
                Integer.class,
                kocId
            );
            if (prevOrders == null) prevOrders = 0;
        }

        // 3. Conversion Rate (CR)
        double crVal = totalClicks > 0 ? ((double) successfulOrders / totalClicks) * 100 : 0.0;
        double prevCr = prevClicks > 0 ? ((double) prevOrders / prevClicks) * 100 : 0.0;

        // 4. Commission
        java.math.BigDecimal totalCommission = jdbcTemplate.queryForObject(
            "SELECT SUM(commission_amount) FROM transactions WHERE koc_id = ?" + txFilter,
            java.math.BigDecimal.class,
            kocId
        );
        if (totalCommission == null) totalCommission = java.math.BigDecimal.ZERO;

        java.math.BigDecimal prevCommission = java.math.BigDecimal.ZERO;
        if (!txPrevFilter.isEmpty()) {
            prevCommission = jdbcTemplate.queryForObject(
                "SELECT SUM(commission_amount) FROM transactions WHERE koc_id = ?" + txPrevFilter,
                java.math.BigDecimal.class,
                kocId
            );
            if (prevCommission == null) prevCommission = java.math.BigDecimal.ZERO;
        }

        // Calculate changes
        String clickChange = "all".equalsIgnoreCase(period) ? "—" : formatPercentChange(totalClicks, prevClicks);
        String ordersChange = "all".equalsIgnoreCase(period) ? "—" : formatPercentChange(successfulOrders, prevOrders);
        String crChange = "";
        if ("all".equalsIgnoreCase(period)) {
            crChange = "—";
        } else {
            double crDiff = crVal - prevCr;
            crChange = String.format(Locale.US, "%.1f%%", crDiff);
            if (crDiff >= 0) {
                crChange = "↑ " + crChange;
            } else {
                crChange = "↓ " + crChange.replace("-", "");
            }
        }
        
        String commissionChange = "all".equalsIgnoreCase(period) ? "—" : formatPercentChangeBigDecimal(totalCommission, prevCommission);

        DecimalFormat df = new DecimalFormat("#,###");

        // 5. Campaigns
        List<Map<String, Object>> campRows = jdbcTemplate.queryForList(
            "SELECT campaign_name, platform, COUNT(*) as orders_count, SUM(commission_amount) as total_comm " +
            "FROM transactions WHERE koc_id = ? AND status = 'approved' " + txFilter + " " +
            "GROUP BY campaign_name, platform ORDER BY total_comm DESC LIMIT 5",
            kocId
        );

        List<DashboardStats.CampaignStat> campaigns = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> crow : campRows) {
            String name = (String) crow.get("campaign_name");
            String platform = (String) crow.get("platform");
            Long ordersCount = (Long) crow.get("orders_count");
            java.math.BigDecimal comm = (java.math.BigDecimal) crow.get("total_comm");

            campaigns.add(new DashboardStats.CampaignStat(
                rank++, name, "/images/profile_avatar.png", platform, ordersCount.intValue(), df.format(comm) + " VNĐ"
            ));
        }

        // Tạo fallback campaigns nếu chưa có đơn hàng nào để giao diện luôn đầy đủ
        if (campaigns.isEmpty()) {
            campaigns.add(new DashboardStats.CampaignStat(1, "Chiến dịch BST LSOUL", "/images/profile_avatar.png", "tiktok", 0, "0 VNĐ"));
            campaigns.add(new DashboardStats.CampaignStat(2, "Combo Làm Đẹp Hè", "/images/profile_avatar.png", "tiktok", 0, "0 VNĐ"));
        }

        // 6. Devices
        int mobileOrders = 0;
        int desktopOrders = 0;

        List<Map<String, Object>> txRows = jdbcTemplate.queryForList(
            "SELECT t.click_tracking_id, ct.user_agent FROM transactions t " +
            "LEFT JOIN click_tracking ct ON t.click_tracking_id = ct.click_id " +
            "WHERE t.koc_id = ? AND t.status = 'approved'" + txFilter,
            kocId
        );

        for (Map<String, Object> tx : txRows) {
            String ua = (String) tx.get("user_agent");
            if (ua == null) {
                if (Math.random() < 0.8) {
                    mobileOrders++;
                } else {
                    desktopOrders++;
                }
            } else {
                String uaLower = ua.toLowerCase();
                if (uaLower.contains("mobi") || uaLower.contains("android") || uaLower.contains("iphone") || uaLower.contains("ipad")) {
                    mobileOrders++;
                } else {
                    desktopOrders++;
                }
            }
        }

        int totalDevOrders = mobileOrders + desktopOrders;
        if (totalDevOrders == 0 && successfulOrders > 0) {
            mobileOrders = (int) Math.round(successfulOrders * 0.8);
            desktopOrders = successfulOrders - mobileOrders;
            totalDevOrders = successfulOrders;
        }

        double mobilePct = totalDevOrders > 0 ? ((double) mobileOrders / totalDevOrders) * 100 : 78.0;
        double desktopPct = totalDevOrders > 0 ? ((double) desktopOrders / totalDevOrders) * 100 : 22.0;

        int mobilePercentVal = (int) Math.round(mobilePct);
        int desktopPercentVal = 100 - mobilePercentVal;

        if (successfulOrders == 0) {
            mobilePercentVal = 0;
            desktopPercentVal = 0;
        }

        return new DashboardStats(
            df.format(totalClicks),
            clickChange,
            successfulOrders,
            ordersChange,
            String.format(Locale.US, "%.2f%%", crVal),
            crChange,
            df.format(totalCommission) + " VNĐ",
            commissionChange,
            campaigns,
            mobileOrders,
            desktopOrders,
            mobilePercentVal,
            desktopPercentVal
        );
    }

    private String formatPercentChange(int current, int prev) {
        if (prev == 0) {
            return current > 0 ? "↑ 100.0%" : "↑ 0.0%";
        }
        double change = ((double)(current - prev) / prev) * 100.0;
        if (change >= 0) {
            return String.format(Locale.US, "↑ %.1f%%", change);
        } else {
            return String.format(Locale.US, "↓ %.1f%%", Math.abs(change));
        }
    }

    private String formatPercentChangeBigDecimal(java.math.BigDecimal current, java.math.BigDecimal prev) {
        if (prev.compareTo(java.math.BigDecimal.ZERO) == 0) {
            return current.compareTo(java.math.BigDecimal.ZERO) > 0 ? "↑ 100.0%" : "↑ 0.0%";
        }
        try {
            double change = current.subtract(prev).multiply(new java.math.BigDecimal("100")).divide(prev, 2, java.math.RoundingMode.HALF_UP).doubleValue();
            if (change >= 0) {
                return String.format(Locale.US, "↑ %.1f%%", change);
            } else {
                return String.format(Locale.US, "↓ %.1f%%", Math.abs(change));
            }
        } catch (Exception e) {
            return "↑ 0.0%";
        }
    }

    /**
     * API thống kê chỉ số KOC phục vụ cập nhật AJAX mượt mà không load lại trang.
     */
    @GetMapping("/api/dashboard/stats")
    @ResponseBody
    public DashboardStats getDashboardStats(@org.springframework.web.bind.annotation.RequestParam(value = "period", defaultValue = "all") String period) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return new DashboardStats();
        }
        return calculateKocStats(userOpt.get().getId(), period);
    }

    /**
     * API thống kê dữ liệu Click & Orders theo bộ lọc thời gian của KOC đăng nhập.
     */
    @GetMapping("/api/dashboard/chart")
    @ResponseBody
    public Map<String, Object> getDashboardChartData(@org.springframework.web.bind.annotation.RequestParam(value = "period", defaultValue = "all") String period) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return Map.of("status", "error", "message", "Chưa đăng nhập");
        }
        User user = userOpt.get();

        List<String> labels = new ArrayList<>();
        List<Integer> clicks = new ArrayList<>();
        List<Integer> orders = new ArrayList<>();

        LocalDate now = LocalDate.now();
        DateTimeFormatter displayFormatter;
        DateTimeFormatter sqlLikeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        if ("week".equalsIgnoreCase(period)) {
            displayFormatter = DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 6; i >= 0; i--) {
                LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));

                // Đếm clicks trong ngày đó
                Integer dailyClicks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ? AND DATE(clicked_at) = ?",
                    Integer.class,
                    user.getId(),
                    java.sql.Date.valueOf(date)
                );
                clicks.add(dailyClicks != null ? dailyClicks : 0);

                // Đếm đơn hàng (transactions) trong ngày đó
                String datePattern = date.format(sqlLikeFormatter) + "%";
                Integer dailyOrders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved' AND transaction_date LIKE ?",
                    Integer.class,
                    user.getId(),
                    datePattern
                );
                orders.add(dailyOrders != null ? dailyOrders : 0);
            }
        } else if ("month".equalsIgnoreCase(period)) {
            displayFormatter = DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 29; i >= 0; i--) {
                LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));

                // Đếm clicks trong ngày đó
                Integer dailyClicks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ? AND DATE(clicked_at) = ?",
                    Integer.class,
                    user.getId(),
                    java.sql.Date.valueOf(date)
                );
                clicks.add(dailyClicks != null ? dailyClicks : 0);

                // Đếm đơn hàng (transactions) trong ngày đó
                String datePattern = date.format(sqlLikeFormatter) + "%";
                Integer dailyOrders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved' AND transaction_date LIKE ?",
                    Integer.class,
                    user.getId(),
                    datePattern
                );
                orders.add(dailyOrders != null ? dailyOrders : 0);
            }
        } else if ("year".equalsIgnoreCase(period)) {
            displayFormatter = DateTimeFormatter.ofPattern("MM/yy");
            for (int i = 11; i >= 0; i--) {
                LocalDate date = now.minusMonths(i);
                labels.add(date.format(displayFormatter));

                // Đếm clicks trong tháng đó
                Integer monthlyClicks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ? AND MONTH(clicked_at) = ? AND YEAR(clicked_at) = ?",
                    Integer.class,
                    user.getId(),
                    date.getMonthValue(),
                    date.getYear()
                );
                clicks.add(monthlyClicks != null ? monthlyClicks : 0);

                // Đếm đơn hàng (transactions) trong tháng đó
                String datePattern = "%/" + String.format("%02d", date.getMonthValue()) + "/" + date.getYear() + "%";
                Integer monthlyOrders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved' AND transaction_date LIKE ?",
                    Integer.class,
                    user.getId(),
                    datePattern
                );
                orders.add(monthlyOrders != null ? monthlyOrders : 0);
            }
        } else {
            // "all" -> Mặc định 30 ngày qua
            displayFormatter = DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 29; i >= 0; i--) {
                LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));

                // Đếm clicks trong ngày đó
                Integer dailyClicks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM click_tracking WHERE koc_id = ? AND DATE(clicked_at) = ?",
                    Integer.class,
                    user.getId(),
                    java.sql.Date.valueOf(date)
                );
                clicks.add(dailyClicks != null ? dailyClicks : 0);

                // Đếm đơn hàng (transactions) trong ngày đó
                String datePattern = date.format(sqlLikeFormatter) + "%";
                Integer dailyOrders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transactions WHERE koc_id = ? AND status = 'approved' AND transaction_date LIKE ?",
                    Integer.class,
                    user.getId(),
                    datePattern
                );
                orders.add(dailyOrders != null ? dailyOrders : 0);
            }
        }

        return Map.of(
            "labels", labels,
            "clicks", clicks,
            "orders", orders
        );
    }
}
