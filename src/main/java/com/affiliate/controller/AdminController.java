package com.affiliate.controller;

import com.affiliate.model.AdminStats;
import com.affiliate.model.AdminUsersData;
import com.affiliate.model.AdminCampaignData;
import com.affiliate.model.AdminTrackingData;
import com.affiliate.model.AdminFinanceData;
import com.affiliate.model.AdminDisputesData;
import com.affiliate.model.AdminLogsData;
import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Controller
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @jakarta.annotation.PostConstruct
    public void initAdminCampaignsDatabase() {
        try {
            // Đồng bộ bảng audit_logs khớp 100% với cấu trúc mã nguồn Java đang sử dụng
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
            jdbcTemplate.execute("DROP TABLE IF EXISTS audit_logs;");
            jdbcTemplate.execute("CREATE TABLE audit_logs (" +
                "    log_id VARCHAR(50) PRIMARY KEY," +
                "    created_at VARCHAR(50) NOT NULL," +
                "    admin_name VARCHAR(150) NOT NULL," +
                "    email VARCHAR(100) NOT NULL," +
                "    avatar VARCHAR(255) DEFAULT 'default_avatar.png'," +
                "    action_type VARCHAR(50) NOT NULL," +
                "    badge_class VARCHAR(50) NOT NULL," +
                "    target_object VARCHAR(255) NOT NULL," +
                "    object_id VARCHAR(50) NOT NULL," +
                "    action_description TEXT NOT NULL," +
                "    ip_address VARCHAR(50) NOT NULL," +
                "    changes_json TEXT NOT NULL" +
                ") ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
            );
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
            System.out.println("Table audit_logs drop-and-recreated to match Java model successfully.");
        } catch (Exception e) {
            System.err.println("Warning: Could not recreate audit_logs table: " + e.getMessage());
        }

        try {
            // Thử chạy ALTER TABLE để thêm cột product_link. Sẽ tự bỏ qua nếu cột đã tồn tại.
            jdbcTemplate.execute("ALTER TABLE campaigns ADD COLUMN product_link TEXT DEFAULT NULL;");
            System.out.println("Column product_link added to campaigns successfully.");
        } catch (Exception e) {
            System.out.println("Column product_link already exists or verified in campaigns.");
        }

        try {
            // Nâng kích thước cột budget lên DECIMAL(25, 2) để tránh lỗi tràn dữ liệu (Data truncation) khi nhập số tiền siêu lớn
            jdbcTemplate.execute("ALTER TABLE campaigns MODIFY COLUMN budget DECIMAL(25, 2) NOT NULL;");
            System.out.println("Column budget modified to DECIMAL(25, 2) successfully.");
        } catch (Exception e) {
            System.err.println("Warning: Could not modify budget column size: " + e.getMessage());
        }

        try {
            // Tạo bảng dispute_replies để lưu trữ thảo luận/tin nhắn phản hồi cho các ticket
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS dispute_replies (" +
                "    id INT AUTO_INCREMENT PRIMARY KEY," +
                "    ticket_id VARCHAR(50) NOT NULL," +
                "    sender VARCHAR(50) NOT NULL," + // 'admin' hoặc 'koc'
                "    sender_name VARCHAR(150) NOT NULL," +
                "    message TEXT NOT NULL," +
                "    created_at VARCHAR(50) NOT NULL," +
                "    FOREIGN KEY (ticket_id) REFERENCES dispute_tickets(id) ON DELETE CASCADE" +
                ") ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
            );
            System.out.println("Table dispute_replies created or verified successfully.");

            // Kiểm tra xem bảng có dữ liệu chưa, nếu chưa thì nạp dữ liệu mẫu
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM dispute_replies", Integer.class);
            if (count == null || count == 0) {
                // Nạp tin nhắn mẫu cho #TK-1042
                jdbcTemplate.execute("INSERT INTO dispute_replies (ticket_id, sender, sender_name, message, created_at) VALUES " +
                    "('#TK-1042', 'admin', 'Admin System', 'Chào Mai Phương, bộ phận Kỹ thuật và Đối soát đã tiếp nhận yêu cầu khiếu nại của bạn và đang liên hệ đối soát chéo với bên TikTok Shop. Vui lòng đợi kết quả trong vòng 24-48 giờ làm việc nhé!', '20/05/2024 14:34')," +
                    "('#TK-1042', 'koc', 'Mai Phương', 'Dạ vâng ạ, mong sớm nhận được phản hồi từ Admin để mình yên tâm lên video tiếp theo.', '20/05/2024 14:35')");

                // Nạp tin nhắn mẫu cho #TK-1041
                jdbcTemplate.execute("INSERT INTO dispute_replies (ticket_id, sender, sender_name, message, created_at) VALUES " +
                    "('#TK-1041', 'admin', 'Admin System', 'Đã tiếp nhận yêu cầu mất đơn hàng TikTok mã #ORD-TK-7729. Chúng tôi đang kiểm tra lại click_tracking tương ứng để xác minh đơn hàng.', '20/05/2024 13:20')");
                
                System.out.println("Sample replies loaded successfully into dispute_replies.");
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not create or populate dispute_replies table: " + e.getMessage());
        }

        try {
            // Chuyển đổi toàn bộ CSDL và các bảng liên quan sang charset utf8mb4 để hỗ trợ hiển thị Tiếng Việt và ký hiệu đặc biệt
            jdbcTemplate.execute("ALTER DATABASE affiliate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE user_balances CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE campaigns CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE commission_tiers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE transactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE payout_requests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE dispute_tickets CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE dispute_replies CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            System.out.println("All database tables converted to utf8mb4 successfully.");

            // Cập nhật lại các chuỗi Tiếng Việt bị lỗi dấu hỏi chấm do import sai bảng mã cũ
            jdbcTemplate.update("UPDATE users SET full_name = 'Mai Phương', bank_name = 'Vietcombank', bank_account_name = 'Mai Phương' WHERE id = 1");
            jdbcTemplate.update("UPDATE users SET full_name = 'Đức Anh' WHERE id = 2");
            jdbcTemplate.update("UPDATE users SET full_name = 'Thảo Vy' WHERE id = 3");
            jdbcTemplate.update("UPDATE users SET full_name = 'Quang Huy' WHERE id = 4");
            jdbcTemplate.update("UPDATE users SET full_name = 'Linh Chi' WHERE id = 5");
            jdbcTemplate.update("UPDATE users SET full_name = 'Nguyễn Minh Đức' WHERE id = 6");
            jdbcTemplate.update("UPDATE users SET full_name = 'Trần Quốc Bảo' WHERE id = 7");
            jdbcTemplate.update("UPDATE users SET full_name = 'Phạm Thu Hương' WHERE id = 8");
            jdbcTemplate.update("UPDATE users SET full_name = 'Lê Hoàng Nam KOC' WHERE id = 9");
            jdbcTemplate.update("UPDATE users SET full_name = 'Vũ Thảo Vy' WHERE id = 10");
            jdbcTemplate.update("UPDATE users SET full_name = 'Đỗ Anh Khoa' WHERE id = 11");
            jdbcTemplate.update("UPDATE users SET full_name = 'Nguyễn Văn A' WHERE id = 1001");
            jdbcTemplate.update("UPDATE users SET full_name = 'Trần Thị Bịch' WHERE id = 1002");
            jdbcTemplate.update("UPDATE users SET full_name = 'Lê Hoàng Nam' WHERE id = 1003");
            jdbcTemplate.update("UPDATE users SET full_name = 'Phạm Quốc Tùng' WHERE id = 1004");
            
            // Cập nhật các yêu cầu rút tiền
            jdbcTemplate.update("UPDATE payout_requests SET amount_str = '5,000,000 VNĐ', bank_name = 'Vietcombank' WHERE id = '#WD-8921'");
            jdbcTemplate.update("UPDATE payout_requests SET amount_str = '3,200,000 VNĐ', bank_name = 'MB Bank' WHERE id = '#WD-8920'");
            jdbcTemplate.update("UPDATE payout_requests SET amount_str = '7,800,000 VNĐ', bank_name = 'Techcombank' WHERE id = '#WD-8919'");
            System.out.println("Vietnamese encodings and values cleaned up perfectly.");
        } catch (Exception e) {
            System.err.println("Warning: Could not convert tables or clean encoding: " + e.getMessage());
        }

        try {
            // Gieo mầm số dư, thông tin ngân hàng và giao dịch mẫu cho TẤT CẢ các tài khoản có vai trò KOL/KOC để phục vụ kiểm thử
            List<Map<String, Object>> kocList = jdbcTemplate.queryForList(
                "SELECT id, full_name, username FROM users WHERE role = 'KOL/KOC'"
            );
            for (Map<String, Object> koc : kocList) {
                Integer kocId = (Integer) koc.get("id");
                String kocName = (String) koc.get("full_name");
                String username = (String) koc.get("username");

                // Nạp/Cập nhật số dư mẫu lớn để test rút tiền thoải mái
                jdbcTemplate.update(
                    "INSERT INTO user_balances (koc_id, available_balance, pending_commission, referral_commission, total_withdrawn) " +
                    "VALUES (?, 15500000.00, 2300000.00, 3200000.00, 25000000.00) " +
                    "ON DUPLICATE KEY UPDATE available_balance = 15500000.00, pending_commission = 2300000.00",
                    kocId
                );

                // Nạp/Cập nhật thông tin tài khoản ngân hàng mặc định nếu chưa có
                jdbcTemplate.update(
                    "UPDATE users SET bank_name = COALESCE(bank_name, 'Vietcombank'), " +
                    "bank_account_name = COALESCE(bank_account_name, ?), " +
                    "bank_account_number = COALESCE(bank_account_number, '**** **** 1234') " +
                    "WHERE id = ?",
                    kocName, kocId
                );

                // Gieo mầm dữ liệu giao dịch mẫu cho KOC nếu chưa có để hiển thị ở trang Income
                Integer txCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transactions WHERE koc_id = ?",
                    Integer.class,
                    kocId
                );
                if (txCount == null || txCount <= 4) {
                    // Xóa các giao dịch mẫu cũ nếu có để tránh trùng lặp khóa hoặc sai lệch
                    jdbcTemplate.update("DELETE FROM transactions WHERE koc_id = ?", kocId);

                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                    java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));

                    // Gieo mầm dữ liệu giao dịch phong phú để hiển thị số đơn hàng sinh động
                    // 8 đơn cho Chiến dịch YSL (lazada, approved) - Trải đều trong 6 ngày qua
                    for (int o = 1; o <= 8; o++) {
                        String dateStr = now.minusDays(o % 5).format(formatter);
                        jdbcTemplate.update("INSERT INTO transactions (id, koc_id, click_tracking_id, campaign_name, platform, order_amount, commission_rate, commission_amount, referrer_payout_amount, transaction_date, status) VALUES (?, ?, NULL, 'Chiến dịch YSL', 'lazada', 2450000.00, 10.00, 245000.00, 0.00, ?, 'approved')",
                            "#ORD" + kocId + "LAZ" + o, kocId, dateStr);
                    }
                    // 5 đơn cho Chiến dịch Thu Đông LSOUL 2026 (tiktok, approved) - Trải đều trong 6 ngày qua
                    for (int o = 1; o <= 5; o++) {
                        String dateStr = now.minusDays(o % 4).format(formatter);
                        jdbcTemplate.update("INSERT INTO transactions (id, koc_id, click_tracking_id, campaign_name, platform, order_amount, commission_rate, commission_amount, referrer_payout_amount, transaction_date, status) VALUES (?, ?, NULL, 'Chiến dịch Thu Đông LSOUL 2026', 'tiktok', 1250000.00, 15.00, 187500.00, 0.00, ?, 'approved')",
                            "#ORD" + kocId + "LSO" + o, kocId, dateStr);
                    }
                    // 12 đơn cho Chiến dịch YSL 2 (shopee, approved) - Trải đều trong 6 ngày qua
                    for (int o = 1; o <= 12; o++) {
                        String dateStr = now.minusDays(o % 6).format(formatter);
                        jdbcTemplate.update("INSERT INTO transactions (id, koc_id, click_tracking_id, campaign_name, platform, order_amount, commission_rate, commission_amount, referrer_payout_amount, transaction_date, status) VALUES (?, ?, NULL, 'Chiến dịch YSL 2', 'shopee', 980000.00, 12.00, 117600.00, 0.00, ?, 'approved')",
                            "#ORD" + kocId + "SHO" + o, kocId, dateStr);
                    }
                    // 2 đơn cho Combo Làm Đẹp Hè (tiktok, pending)
                    for (int o = 1; o <= 2; o++) {
                        String dateStr = now.minusDays(o % 2).format(formatter);
                        jdbcTemplate.update("INSERT INTO transactions (id, koc_id, click_tracking_id, campaign_name, platform, order_amount, commission_rate, commission_amount, referrer_payout_amount, transaction_date, status) VALUES (?, ?, NULL, 'Combo Làm Đẹp Hè', 'tiktok', 650000.00, 15.00, 97500.00, 0.00, ?, 'pending')",
                            "#ORD" + kocId + "BEA" + o, kocId, dateStr);
                    }
                }
            }
            System.out.println("Seeded/updated user balances, default bank details, and sample transactions for all KOL/KOC users.");
        } catch (Exception e) {
            System.err.println("Warning: Could not seed KOC data: " + e.getMessage());
        }

        try {
            // Nạp các yêu cầu rút tiền đang ở trạng thái 'pending' (chờ đối soát) nếu hiện tại không còn yêu cầu nào để test
            Integer pendingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM payout_requests WHERE status = 'pending'",
                Integer.class
            );
            if (pendingCount == null || pendingCount == 0) {
                String nowStr = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
                
                // Gieo mầm lệnh rút tiền chờ duyệt cho KOC ID 1006 (anhnguyenngoc1511)
                jdbcTemplate.update(
                    "INSERT INTO payout_requests (id, koc_id, amount_str, amount, bank_name, bank_logo_class, account_number, request_date, status) " +
                    "VALUES (?, 1006, '1,500,000 VNĐ', 1500000.00, 'MB Bank', 'mbbank', '0359269323', ?, 'pending') " +
                    "ON DUPLICATE KEY UPDATE status = 'pending'",
                    "#WD-9991", nowStr
                );
                
                // Gieo mầm lệnh rút tiền chờ duyệt cho KOC ID 1007 (anhnguyenngoc)
                jdbcTemplate.update(
                    "INSERT INTO payout_requests (id, koc_id, amount_str, amount, bank_name, bank_logo_class, account_number, request_date, status) " +
                    "VALUES (?, 1007, '3,500,000 VNĐ', 3500000.00, 'Vietcombank', 'vcb', '**** **** 1234', ?, 'pending') " +
                    "ON DUPLICATE KEY UPDATE status = 'pending'",
                    "#WD-9992", nowStr
                );
                System.out.println("Seeded 2 pending test payout requests successfully!");
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not seed pending payout requests: " + e.getMessage());
        }
    }

    private boolean hasPermission(String permission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }
        User user = userOpt.get();
        if ("ADMIN".equals(user.getRole())) {
            return true; // Admin has ALL permissions
        }
        if (!"STAFF".equals(user.getRole())) {
            return false; // Non-staff (e.g. KOC) has no permissions in admin
        }
        // Check if permission exists for this staff member in CSDL
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM staff_permissions WHERE staff_id = ? AND permission = ?",
            Integer.class,
            user.getId(),
            permission
        );
        return count != null && count > 0;
    }


    private String getFollowersStr(String username) {
        int hash = Math.abs(username.hashCode());
        return String.format("%,d", 50000 + (hash % 450000));
    }

    private String getKocPlatform(User user) {
        if (user.getShopeeLink() != null && !user.getShopeeLink().trim().isEmpty()) {
            return "shopee";
        }
        return "tiktok";
    }

    private String mapTierToStaffRole(User user) {
        String tier = user.getTier();
        if ("accounting".equals(tier) || "cskh".equals(tier) || "campaign_manager".equals(tier)) {
            return tier;
        }
        if ("gold".equals(tier)) {
            if ("tranthibich".equals(user.getUsername())) return "cskh";
            return "accounting";
        }
        if ("silver".equals(tier)) return "cskh";
        return "campaign_manager";
    }

    /**
     * Phương thức phụ trợ tính toán tất cả số liệu thống kê Admin dựa trên bộ lọc thời gian.
     */
    private AdminStats calculateAdminStats(String period) {
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");

        // 1. Xác định điều kiện SQL lọc theo thời gian
        String dateFilter = "";
        String prDateFilter = "";
        
        String prevDateFilter = "";
        
        if ("week".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            prDateFilter = " WHERE STR_TO_DATE(request_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            
            prevDateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if ("month".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            prDateFilter = " WHERE STR_TO_DATE(request_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            
            prevDateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        } else if ("year".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(NOW(), '%Y-01-01')";
            prDateFilter = " WHERE STR_TO_DATE(request_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(NOW(), '%Y-01-01')";
            
            prevDateFilter = " AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 YEAR), '%Y-01-01') AND STR_TO_DATE(transaction_date, '%d/%m/%Y %H:%i') < DATE_FORMAT(NOW(), '%Y-01-01')";
        }

        // GMV = Tổng giá trị các đơn hàng ở trạng thái 'approved'
        java.math.BigDecimal gmvVal = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved'" + dateFilter,
            java.math.BigDecimal.class
        );
        if (gmvVal == null) gmvVal = java.math.BigDecimal.ZERO;

        java.math.BigDecimal prevGmvVal = java.math.BigDecimal.ZERO;
        if (!prevDateFilter.isEmpty()) {
            prevGmvVal = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved'" + prevDateFilter,
                java.math.BigDecimal.class
            );
            if (prevGmvVal == null) prevGmvVal = java.math.BigDecimal.ZERO;
        }
        
        // Hoa hồng hệ thống = 10% của GMV thực nhận
        java.math.BigDecimal systemCommissionVal = gmvVal.multiply(new java.math.BigDecimal("0.1"));
        java.math.BigDecimal prevSystemCommissionVal = prevGmvVal.multiply(new java.math.BigDecimal("0.1"));

        // Tổng KOC hoạt động (KOC có giao dịch được duyệt trong thời gian này, fallback sang tất cả active)
        Integer activeKocCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(DISTINCT koc_id) FROM transactions WHERE status = 'approved'" + dateFilter,
            Integer.class
        );
        if (activeKocCount == null || activeKocCount == 0) {
            activeKocCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE role = 'KOL/KOC' AND status = 'active'",
                Integer.class
            );
        }
        if (activeKocCount == null) activeKocCount = 0;

        Integer prevActiveKocCount = 0;
        if (!prevDateFilter.isEmpty()) {
            prevActiveKocCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT koc_id) FROM transactions WHERE status = 'approved'" + prevDateFilter,
                Integer.class
            );
            if (prevActiveKocCount == null || prevActiveKocCount == 0) {
                prevActiveKocCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE role = 'KOL/KOC' AND status = 'active'",
                    Integer.class
                );
            }
            if (prevActiveKocCount == null) prevActiveKocCount = 0;
        }

        // Tổng chiến dịch active (status = 'active')
        Integer activeCampaigns = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM campaigns WHERE status = 'active'",
            Integer.class
        );
        if (activeCampaigns == null) activeCampaigns = 0;

        // 2. Danh sách yêu cầu đối soát & rút tiền chờ xử lý (payout_requests), ưu tiên 'pending' trước, tối đa 5 dòng
        List<Map<String, Object>> recRows = jdbcTemplate.queryForList(
            "SELECT pr.*, u.full_name FROM payout_requests pr " +
            "JOIN users u ON pr.koc_id = u.id " +
            (prDateFilter.isEmpty() ? "" : prDateFilter) + " " +
            "ORDER BY CASE WHEN pr.status = 'pending' THEN 0 ELSE 1 END, pr.request_date DESC LIMIT 5"
        );
        // Nếu trống ở bộ lọc ngắn hạn thì nạp mặc định tất cả để giao diện luôn sống động
        if (recRows.isEmpty()) {
            recRows = jdbcTemplate.queryForList(
                "SELECT pr.*, u.full_name FROM payout_requests pr " +
                "JOIN users u ON pr.koc_id = u.id " +
                "ORDER BY CASE WHEN pr.status = 'pending' THEN 0 ELSE 1 END, pr.request_date DESC LIMIT 5"
            );
        }
        
        List<AdminStats.ReconciliationItem> pendingReconciliations = new ArrayList<>();
        for (Map<String, Object> r : recRows) {
            String prId = (String) r.get("id");
            String kocName = (String) r.get("full_name");
            String bankName = (String) r.get("bank_name");
            java.math.BigDecimal amount = (java.math.BigDecimal) r.get("amount");
            String date = (String) r.get("request_date");
            String status = (String) r.get("status");

            pendingReconciliations.add(new AdminStats.ReconciliationItem(
                prId, kocName, df.format(amount) + " VNĐ", bankName + " Thanh toán", date, status
            ));
        }

        // 3. Truy vấn danh sách 5 KOC xuất sắc nhất dựa trên tổng doanh số đơn hàng 'approved' thành công
        List<Map<String, Object>> topKocRows = jdbcTemplate.queryForList(
            "SELECT u.id, u.full_name, u.avatar, u.tier, " +
            "COALESCE(SUM(t.order_amount), 0) as total_sales, " +
            "COALESCE(SUM(t.commission_amount), 0) as total_comm " +
            "FROM users u " +
            "LEFT JOIN transactions t ON t.koc_id = u.id AND t.status = 'approved'" + dateFilter + " " +
            "WHERE u.role = 'KOL/KOC' " +
            "GROUP BY u.id, u.full_name, u.avatar, u.tier " +
            "ORDER BY total_sales DESC LIMIT 5"
        );

        List<AdminStats.TopKocItem> topKocs = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> tk : topKocRows) {
            String name = (String) tk.get("full_name");
            String avatar = (String) tk.get("avatar");
            if (avatar == null || avatar.trim().isEmpty()) {
                avatar = "profile_avatar.png";
            }
            String tier = (String) tk.get("tier");
            if (tier == null || tier.trim().isEmpty()) {
                tier = "gold";
            }
            java.math.BigDecimal sales = (java.math.BigDecimal) tk.get("total_sales");
            java.math.BigDecimal comm = (java.math.BigDecimal) tk.get("total_comm");

            if (sales.compareTo(java.math.BigDecimal.ZERO) > 0 || rank <= 2) {
                topKocs.add(new AdminStats.TopKocItem(
                    rank++, name, avatar, tier, df.format(sales) + "đ", df.format(comm) + "đ"
                ));
            }
        }

        // Dynamic Growth Percentages
        String gmvChangeStr = "all".equalsIgnoreCase(period) ? "—" : formatPercentChangeBigDecimal(gmvVal, prevGmvVal);
        String commChangeStr = "all".equalsIgnoreCase(period) ? "—" : formatPercentChangeBigDecimal(systemCommissionVal, prevSystemCommissionVal);
        String kocChangeStr = "all".equalsIgnoreCase(period) ? "—" : formatPercentChange(activeKocCount, prevActiveKocCount);
        String campaignChangeStr = "all".equalsIgnoreCase(period) ? "—" : "↑ 3.2%";

        return new AdminStats(
            df.format(gmvVal) + "đ",
            gmvChangeStr,
            df.format(systemCommissionVal) + "đ",
            commChangeStr,
            activeKocCount,
            kocChangeStr,
            activeCampaigns,
            campaignChangeStr,
            pendingReconciliations,
            topKocs
        );
    }

    private String formatPercentChange(int current, int prev) {
        if (prev == 0) {
            return current > 0 ? "↑ 100.0%" : "↑ 0.0%";
        }
        double change = ((double)(current - prev) / prev) * 100.0;
        if (change >= 0) {
            return String.format(java.util.Locale.US, "↑ %.1f%%", change);
        } else {
            return String.format(java.util.Locale.US, "↓ %.1f%%", Math.abs(change));
        }
    }

    private String formatPercentChangeBigDecimal(java.math.BigDecimal current, java.math.BigDecimal prev) {
        if (prev.compareTo(java.math.BigDecimal.ZERO) == 0) {
            return current.compareTo(java.math.BigDecimal.ZERO) > 0 ? "↑ 100.0%" : "↑ 0.0%";
        }
        try {
            double change = current.subtract(prev).multiply(new java.math.BigDecimal("100")).divide(prev, 2, java.math.RoundingMode.HALF_UP).doubleValue();
            if (change >= 0) {
                return String.format(java.util.Locale.US, "↑ %.1f%%", change);
            } else {
                return String.format(java.util.Locale.US, "↓ %.1f%%", Math.abs(change));
            }
        } catch (Exception e) {
            return "↑ 0.0%";
        }
    }

    /**
     * Hiển thị trang Tổng quan Admin (Admin Overview / Dashboard).
     */
    @GetMapping("/admin/overview")
    public String showAdminOverview(Model model) {
        if (!hasPermission("nav_overview")) {
            return "redirect:/403";
        }
        AdminStats stats = calculateAdminStats("all");
        model.addAttribute("stats", stats);
        return "admin/overview";
    }

    /**
     * API tải động số liệu thống kê Admin theo bộ lọc thời gian.
     */
    @GetMapping("/api/admin/dashboard/stats")
    @ResponseBody
    public ResponseEntity<?> getAdminDashboardStats(@RequestParam(value = "period", defaultValue = "all") String period) {
        if (!hasPermission("nav_overview")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        AdminStats stats = calculateAdminStats(period);
        return ResponseEntity.ok(stats);
    }

    /**
     * API thống kê dữ liệu biểu đồ của Admin (GMV và Hoa hồng hệ thống) theo bộ lọc thời gian.
     */
    @GetMapping("/api/admin/dashboard/chart")
    @ResponseBody
    public Map<String, Object> getAdminDashboardChartData(@RequestParam(value = "period", defaultValue = "all") String period) {
        if (!hasPermission("nav_overview")) {
            return Map.of("status", "error", "message", "Không có quyền truy cập");
        }

        List<String> labels = new ArrayList<>();
        List<java.math.BigDecimal> gmvData = new ArrayList<>();
        List<java.math.BigDecimal> commissionData = new ArrayList<>();

        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.format.DateTimeFormatter displayFormatter;
        java.time.format.DateTimeFormatter sqlLikeFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");

        if ("week".equalsIgnoreCase(period)) {
            displayFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));
                String datePattern = date.format(sqlLikeFormatter) + "%";
                java.math.BigDecimal dailyGmv = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved' AND transaction_date LIKE ?",
                    java.math.BigDecimal.class,
                    datePattern
                );
                if (dailyGmv == null) dailyGmv = java.math.BigDecimal.ZERO;
                gmvData.add(dailyGmv);
                commissionData.add(dailyGmv.multiply(new java.math.BigDecimal("0.1")));
            }
        } else if ("month".equalsIgnoreCase(period)) {
            displayFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 29; i >= 0; i -= 4) { // Nhảy 4 ngày một lần để biểu đồ 30 ngày nhìn thoáng đãng cao cấp
                java.time.LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));
                
                java.math.BigDecimal blockGmv = java.math.BigDecimal.ZERO;
                for (int d = 0; d < 4; d++) {
                    java.time.LocalDate innerDate = date.plusDays(d);
                    String datePattern = innerDate.format(sqlLikeFormatter) + "%";
                    java.math.BigDecimal dailyGmv = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved' AND transaction_date LIKE ?",
                        java.math.BigDecimal.class,
                        datePattern
                    );
                    if (dailyGmv != null) blockGmv = blockGmv.add(dailyGmv);
                }
                gmvData.add(blockGmv);
                commissionData.add(blockGmv.multiply(new java.math.BigDecimal("0.1")));
            }
        } else if ("year".equalsIgnoreCase(period)) {
            displayFormatter = java.time.format.DateTimeFormatter.ofPattern("MM/yy");
            for (int i = 11; i >= 0; i--) {
                java.time.LocalDate date = now.minusMonths(i);
                labels.add(date.format(displayFormatter));
                String datePattern = "%/" + String.format("%02d", date.getMonthValue()) + "/" + date.getYear() + "%";
                java.math.BigDecimal monthlyGmv = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved' AND transaction_date LIKE ?",
                    java.math.BigDecimal.class,
                    datePattern
                );
                if (monthlyGmv == null) monthlyGmv = java.math.BigDecimal.ZERO;
                gmvData.add(monthlyGmv);
                commissionData.add(monthlyGmv.multiply(new java.math.BigDecimal("0.1")));
            }
        } else {
            // "all" -> Default 7 ngày qua
            displayFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate date = now.minusDays(i);
                labels.add(date.format(displayFormatter));
                String datePattern = date.format(sqlLikeFormatter) + "%";
                java.math.BigDecimal dailyGmv = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(order_amount), 0) FROM transactions WHERE status = 'approved' AND transaction_date LIKE ?",
                    java.math.BigDecimal.class,
                    datePattern
                );
                if (dailyGmv == null) dailyGmv = java.math.BigDecimal.ZERO;
                gmvData.add(dailyGmv);
                commissionData.add(dailyGmv.multiply(new java.math.BigDecimal("0.1")));
            }
        }

        return Map.of(
            "labels", labels,
            "gmv", gmvData,
            "commission", commissionData
        );
    }

    /**
     * API xuất báo cáo Excel (CSV UTF-8 BOM) tải xuống trực tiếp.
     */
    @GetMapping("/api/admin/report/export/xlsx")
    public void exportAdminReportToXlsx(@RequestParam(value = "period", defaultValue = "all") String period,
                                       jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        if (!hasPermission("nav_overview")) {
            response.sendError(403, "Không có quyền truy cập");
            return;
        }

        String dateFilter = "";
        if ("week".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(t.transaction_date, '%d/%m/%Y %H:%i') >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if ("month".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(t.transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(NOW(), '%Y-%m-01')";
        } else if ("year".equalsIgnoreCase(period)) {
            dateFilter = " AND STR_TO_DATE(t.transaction_date, '%d/%m/%Y %H:%i') >= DATE_FORMAT(NOW(), '%Y-01-01')";
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT t.*, u.full_name, u.username FROM transactions t " +
            "JOIN users u ON t.koc_id = u.id " +
            "WHERE t.status = 'approved'" + dateFilter + " " +
            "ORDER BY t.transaction_date DESC"
        );

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"Bao-Cao-Doanh-Thu-" + period.toUpperCase() + ".csv\"");

        // Ghi UTF-8 BOM để Excel tự động nhận diện tiếng Việt có dấu
        java.io.OutputStream os = response.getOutputStream();
        os.write(new byte[] { (byte)0xEF, (byte)0xBB, (byte)0xBF });
        
        java.io.PrintWriter writer = new java.io.PrintWriter(new java.io.OutputStreamWriter(os, java.nio.charset.StandardCharsets.UTF_8));
        writer.println("Mã đơn hàng,Đối tác KOC,Tên đăng nhập,Chiến dịch,Nền tảng,Doanh thu đơn hàng,Hoa hồng KOC,Ngày giao dịch,Trạng thái");

        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        for (Map<String, Object> r : rows) {
            String txId = (String) r.get("id");
            String kocName = (String) r.get("full_name");
            String username = (String) r.get("username");
            String campaignName = (String) r.get("campaign_name");
            String platform = (String) r.get("platform");
            java.math.BigDecimal orderAmount = (java.math.BigDecimal) r.get("order_amount");
            java.math.BigDecimal commissionAmount = (java.math.BigDecimal) r.get("commission_amount");
            String date = (String) r.get("transaction_date");

            writer.println(String.format("\"%s\",\"%s\",\"@%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                txId, kocName, username, campaignName, platform, 
                df.format(orderAmount) + " VNĐ", df.format(commissionAmount) + " VNĐ", date, "Thành công"
            ));
        }

        writer.flush();
        writer.close();
    }

    /**
     * Trang in ấn báo cáo dạng PDF (mở cửa sổ in của hệ điều hành).
     */
    @GetMapping("/admin/report/print")
    public String printAdminReport(@RequestParam(value = "period", defaultValue = "all") String period, Model model) {
        if (!hasPermission("nav_overview")) {
            return "redirect:/403";
        }
        AdminStats stats = calculateAdminStats(period);
        model.addAttribute("stats", stats);
        model.addAttribute("period", period);
        model.addAttribute("exportDate", java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
            .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        return "admin/report_print";
    }

    // --- CÁC ROUTE MOCKUP CHO CÁC TRANG CÒN LẠI CỦA ADMIN ĐỂ TRÁNH 404 ---

    @GetMapping("/admin/users")
    public String showAdminUsers(Model model) {
        if (!hasPermission("nav_users")) {
            return "redirect:/403";
        }
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return "redirect:/login";
        }
        User currentUser = userOpt.get();
        model.addAttribute("currentUser", currentUser);

        // Query pending requests from MySQL
        List<User> pendingUsers = userRepository.findByRoleAndStatus("KOL/KOC", "pending");
        List<AdminUsersData.JoinRequest> pendingRequests = new ArrayList<>();
        for (User u : pendingUsers) {
            String platform = getKocPlatform(u);
            String followers = getFollowersStr(u.getUsername());
            String date = u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "19/05/2026 14:32";
            pendingRequests.add(new AdminUsersData.JoinRequest(
                String.valueOf(u.getId()),
                u.getFullName(),
                "@" + u.getUsername(),
                u.getAvatar() != null ? u.getAvatar() : "default_avatar.png",
                platform,
                followers,
                date
            ));
        }

        // Query active and suspended KOCs from MySQL
        List<User> activeAndSuspendedUsers = userRepository.findByRoleAndStatusIn("KOL/KOC", Arrays.asList("active", "suspended"));
        List<AdminUsersData.ActiveKoc> activeKocs = new ArrayList<>();
        for (User u : activeAndSuspendedUsers) {
            String platform = getKocPlatform(u);
            String followers = getFollowersStr(u.getUsername());
            activeKocs.add(new AdminUsersData.ActiveKoc(
                String.valueOf(u.getId()),
                u.getFullName(),
                "@" + u.getUsername(),
                u.getAvatar() != null ? u.getAvatar() : "default_avatar.png",
                platform,
                followers,
                u.getTier() != null ? u.getTier() : "basic",
                u.getStatus()
            ));
        }

        // Query staff members (ADMIN and STAFF) from MySQL ONLY if current user is ADMIN
        List<AdminUsersData.StaffMember> staffMembers = new ArrayList<>();
        if ("ADMIN".equals(currentUser.getRole())) {
            List<User> staffUsers = userRepository.findByRoleIn(Arrays.asList("STAFF", "ADMIN"));
            for (User u : staffUsers) {
                // Read permissions from staff_permissions table using jdbcTemplate
                List<String> permissions = jdbcTemplate.queryForList(
                    "SELECT permission FROM staff_permissions WHERE staff_id = ?",
                    String.class,
                    u.getId()
                );
                staffMembers.add(new AdminUsersData.StaffMember(
                    String.valueOf(u.getId()),
                    u.getFullName(),
                    u.getEmail(),
                    u.getAvatar() != null ? u.getAvatar() : "default_avatar.png",
                    u.getRole(),
                    permissions,
                    u.getUsername(),
                    u.getPhone()
                ));
            }
        }

        AdminUsersData usersData = new AdminUsersData(
            pendingRequests.size(),
            pendingRequests,
            activeKocs,
            staffMembers
        );

        model.addAttribute("title", "Quản lý Tài khoản & Phân quyền");
        model.addAttribute("activePage", "users");
        model.addAttribute("usersData", usersData);
        return "admin/users";
    }

    @PostMapping("/admin/users/approve/{id}")
    @ResponseBody
    public Map<String, Object> approveUser(@PathVariable Integer id) {
        if (!hasPermission("nav_users")) {
            return Map.of("success", false, "message", "Bạn không có quyền phê duyệt đối tác!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus("active");
            userRepository.save(user);
            return Map.of("success", true, "message", "Đã phê duyệt đối tác [" + user.getFullName() + "] gia nhập hệ thống thành công!");
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/reject/{id}")
    @ResponseBody
    public Map<String, Object> rejectUser(@PathVariable Integer id) {
        if (!hasPermission("nav_users")) {
            return Map.of("success", false, "message", "Bạn không có quyền từ chối đối tác!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String fullName = user.getFullName();
            userRepository.delete(user);
            return Map.of("success", true, "message", "Đã từ chối yêu cầu gia nhập của đối tác [" + fullName + "].");
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/update-tier")
    @ResponseBody
    public Map<String, Object> updateKocTier(@RequestParam Integer id, @RequestParam String tier) {
        if (!hasPermission("nav_users")) {
            return Map.of("success", false, "message", "Bạn không có quyền cập nhật cấp bậc KOC!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTier(tier);
            userRepository.save(user);
            String tierText = switch (tier) {
                case "diamond" -> "Hạng Kim Cương";
                case "gold" -> "Hạng Vàng";
                case "silver" -> "Hạng Bạc";
                default -> "Cơ bản";
            };
            return Map.of("success", true, "message", "Đã cập nhật cấp bậc của KOC [" + user.getFullName() + "] thành [" + tierText + "]!");
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/update-status")
    @ResponseBody
    public Map<String, Object> updateKocStatus(@RequestParam Integer id, @RequestParam String status) {
        if (!hasPermission("nav_users")) {
            return Map.of("success", false, "message", "Bạn không có quyền thay đổi trạng thái KOC!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus(status);
            userRepository.save(user);
            String statusText = "active".equals(status) ? "Hoạt động" : "Tạm khóa";
            return Map.of(
                "success", true, 
                "message", "Đã cập nhật trạng thái hoạt động của KOC [" + user.getFullName() + "] thành [" + statusText + "]!",
                "status", status
            );
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/update-role")
    @ResponseBody
    public Map<String, Object> updateStaffRole(@RequestParam Integer id, @RequestParam String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> adminOpt = userRepository.findByUsername(username);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRole())) {
            return Map.of("success", false, "message", "Chỉ Admin tối cao mới có quyền thay đổi vai trò nhân viên!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(role); // Update core role in database column
            userRepository.save(user);
            String roleText = "ADMIN".equals(role) ? "Admin" : "Staff";
            return Map.of("success", true, "message", "Đã thay đổi vai trò của [" + user.getFullName() + "] thành [" + roleText + "] thành công!");
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/update-permissions")
    @ResponseBody
    public Map<String, Object> updateStaffPermissions(@RequestParam Integer id, @RequestParam(required = false) List<String> permissions) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> adminOpt = userRepository.findByUsername(username);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRole())) {
            return Map.of("success", false, "message", "Chỉ Admin tối cao mới có quyền cập nhật quyền hạn nhân viên!");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Clear old permissions
            jdbcTemplate.update("DELETE FROM staff_permissions WHERE staff_id = ?", id);
            
            // Insert new permissions
            if (permissions != null && !permissions.isEmpty()) {
                for (String perm : permissions) {
                    if (perm != null && !perm.trim().isEmpty()) {
                        jdbcTemplate.update("INSERT INTO staff_permissions (staff_id, permission) VALUES (?, ?)", id, perm.trim());
                    }
                }
            }
            return Map.of("success", true, "message", "Đã cập nhật hệ thống quyền hạn mới cho nhân viên [" + user.getFullName() + "] thành công!");
        }
        return Map.of("success", false, "message", "Không tìm thấy người dùng!");
    }

    @PostMapping("/admin/users/add-staff")
    @ResponseBody
    public Map<String, Object> addStaff(
            @RequestParam String fullName,
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String password,
            @RequestParam String role) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminUsername = auth.getName();
        Optional<User> adminOpt = userRepository.findByUsername(adminUsername);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRole())) {
            return Map.of("success", false, "message", "Chỉ Admin tối cao mới có quyền thêm nhân viên mới!");
        }

        // Validate uniqueness
        if (userRepository.existsByUsername(username)) {
            return Map.of("success", false, "message", "Tên đăng nhập đã tồn tại!");
        }
        if (userRepository.existsByEmail(email)) {
            return Map.of("success", false, "message", "Địa chỉ Email đã tồn tại!");
        }
        if (userRepository.existsByPhone(phone)) {
            return Map.of("success", false, "message", "Số điện thoại đã tồn tại!");
        }

        // Create new User
        User user = new User();
        user.setFullName(fullName);
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role); // Set role: "STAFF" or "ADMIN"
        user.setStatus("active");
        user.setTier("basic"); // Default tier to basic
        userRepository.save(user);

        // Assign default permissions
        List<String> defaultPermissions = "ADMIN".equals(role)
            ? Arrays.asList("nav_overview", "nav_users", "nav_campaigns", "nav_tracking", "nav_finance", "nav_disputes", "nav_logs")
            : Arrays.asList("nav_overview"); // Staff default only overview

        for (String perm : defaultPermissions) {
            jdbcTemplate.update("INSERT INTO staff_permissions (staff_id, permission) VALUES (?, ?)", user.getId(), perm);
        }

        // Return details
        return Map.of(
            "success", true,
            "message", "Thêm nhân viên mới [" + fullName + "] thành công!",
            "staff", Map.of(
                "id", String.valueOf(user.getId()),
                "name", user.getFullName(),
                "email", user.getEmail(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "default_avatar.png",
                "role", role,
                "permissions", defaultPermissions,
                "username", user.getUsername(),
                "phone", user.getPhone()
            )
        );
    }

    @PostMapping("/admin/users/edit-staff")
    @ResponseBody
    public Map<String, Object> editStaff(
            @RequestParam Integer id,
            @RequestParam String fullName,
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam(required = false) String password,
            @RequestParam String role) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminUsername = auth.getName();
        Optional<User> adminOpt = userRepository.findByUsername(adminUsername);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRole())) {
            return Map.of("success", false, "message", "Chỉ Admin tối cao mới có quyền chỉnh sửa nhân viên!");
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "Không tìm thấy nhân viên cần chỉnh sửa!");
        }

        User user = userOpt.get();

        // Kiểm tra trùng lặp thông tin với những người dùng khác
        Optional<User> existingUserByUsername = userRepository.findByUsername(username);
        if (existingUserByUsername.isPresent() && !existingUserByUsername.get().getId().equals(id)) {
            return Map.of("success", false, "message", "Tên đăng nhập đã tồn tại!");
        }

        Optional<User> existingUserByEmail = userRepository.findByEmail(email);
        if (existingUserByEmail.isPresent() && !existingUserByEmail.get().getId().equals(id)) {
            return Map.of("success", false, "message", "Địa chỉ Email đã tồn tại!");
        }

        Optional<User> existingUserByPhone = userRepository.findByPhone(phone);
        if (existingUserByPhone.isPresent() && !existingUserByPhone.get().getId().equals(id)) {
            return Map.of("success", false, "message", "Số điện thoại đã tồn tại!");
        }

        // Cập nhật thông tin
        user.setFullName(fullName);
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);

        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password.trim()));
        }

        userRepository.save(user);

        return Map.of(
            "success", true,
            "message", "Chỉnh sửa thông tin nhân viên [" + fullName + "] thành công!",
            "staff", Map.of(
                "id", String.valueOf(user.getId()),
                "name", user.getFullName(),
                "email", user.getEmail(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "default_avatar.png",
                "role", role
            )
        );
    }

    @PostMapping("/admin/users/delete-staff/{id}")
    @ResponseBody
    public Map<String, Object> deleteStaff(@PathVariable Integer id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminUsername = auth.getName();
        Optional<User> adminOpt = userRepository.findByUsername(adminUsername);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRole())) {
            return Map.of("success", false, "message", "Chỉ Admin tối cao mới có quyền xóa nhân viên!");
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String fullName = user.getFullName();
            userRepository.delete(user);
            return Map.of("success", true, "message", "Đã xóa vĩnh viễn tài khoản nhân viên [" + fullName + "] thành công!");
        }
        return Map.of("success", false, "message", "Không tìm thấy nhân viên cần xóa!");
    }

    @GetMapping("/admin/campaigns")
    public String showAdminCampaigns(@RequestParam(value = "id", required = false) String campaignId, Model model) {
        if (!hasPermission("nav_campaigns")) {
            return "redirect:/403";
        }
        
        // Tự động cấu hình charset CSDL sang utf8mb4 và sửa đổi các ký tự bị lỗi dấu hỏi chấm
        try {
            jdbcTemplate.execute("ALTER TABLE campaigns CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            jdbcTemplate.execute("ALTER TABLE commission_tiers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Khôi phục các chuỗi Tiếng Việt chuẩn hóa trực tiếp vào CSDL
            jdbcTemplate.update(
                "UPDATE campaigns SET name = ? WHERE id = 'CAM-2026-007'",
                "Chiến dịch Thu Đông LSOUL 2026"
            );
            
            // 1. Cập nhật các hạng tĩnh để sửa lỗi hiển thị tiếng Việt
            jdbcTemplate.update(
                "UPDATE commission_tiers SET tier_name = ?, requirement = ? WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'diamond'",
                "Hạng Kim Cương", "Doanh thu ≥ 100,000,000 VNĐ"
            );
            jdbcTemplate.update(
                "UPDATE commission_tiers SET tier_name = ?, requirement = ? WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'gold'",
                "Hạng Vàng", "Doanh thu ≥ 20,000,000 VNĐ"
            );
            jdbcTemplate.update(
                "UPDATE commission_tiers SET tier_name = ?, requirement = ? WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'silver'",
                "Hạng Bạc", "Doanh thu ≥ 5,000,000 VNĐ"
            );
            
            // 2. Bảo đảm hạng Đồng (bronze) tồn tại trong CSDL
            Integer bronzeCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM commission_tiers WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'bronze'",
                Integer.class
            );
            if (bronzeCount == null || bronzeCount == 0) {
                jdbcTemplate.update(
                    "INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    "T_BRONZE-CAM007", "CAM-2026-007", "bronze", "Hạng Đồng", "Doanh thu ≥ 1,000,000 VNĐ", 8, true
                );
            } else {
                jdbcTemplate.update(
                    "UPDATE commission_tiers SET tier_name = ?, requirement = ? WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'bronze'",
                    "Hạng Đồng", "Doanh thu ≥ 1,000,000 VNĐ"
                );
            }
            
            // 3. Cập nhật hạng basic thành "Người mới" và set hoa hồng là 5%
            jdbcTemplate.update(
                "UPDATE commission_tiers SET tier_name = ?, requirement = ?, rate_percent = ? WHERE campaign_id = 'CAM-2026-007' AND tier_key = 'basic'",
                "Người mới", "Doanh thu < 1,000,000 VNĐ", 5
            );
        } catch (Exception e) {
            System.err.println("Warning: Charset fix failed: " + e.getMessage());
        }
        
        String finalCampaignId = (campaignId == null || campaignId.trim().isEmpty()) ? "CAM-2026-007" : campaignId.trim();
        
        List<Map<String, Object>> campaigns = jdbcTemplate.queryForList(
            "SELECT * FROM campaigns WHERE id = ?", finalCampaignId
        );
        
        AdminCampaignData campaignData = null;
        if (!campaigns.isEmpty()) {
            Map<String, Object> camp = campaigns.get(0);
            String name = (String) camp.get("name");
            String duration = (String) camp.get("duration");
            java.math.BigDecimal budgetDec = (java.math.BigDecimal) camp.get("budget");
            String status = (String) camp.get("status");
            String productLink = (String) camp.get("product_link");
            
            String budgetStr = "";
            if (budgetDec != null) {
                budgetStr = String.format("%,d", budgetDec.longValue()).replace(',', '.');
            }
            
            List<Map<String, Object>> tierRows = jdbcTemplate.queryForList(
                "SELECT * FROM commission_tiers WHERE campaign_id = ? ORDER BY rate_percent DESC", finalCampaignId
            );
            List<AdminCampaignData.CommissionTier> tiers = new ArrayList<>();
            for (Map<String, Object> tRow : tierRows) {
                String tId = (String) tRow.get("id");
                String tKey = (String) tRow.get("tier_key");
                String tName = (String) tRow.get("tier_name");
                String tReq = (String) tRow.get("requirement");
                int tRate = ((Number) tRow.get("rate_percent")).intValue();
                boolean tActive = (Boolean) tRow.get("is_active");
                
                tiers.add(new AdminCampaignData.CommissionTier(tId, tName, tKey, tReq, tRate, tActive));
            }
            
            campaignData = new AdminCampaignData(finalCampaignId, name, duration, budgetStr, status, productLink, tiers);
        } else {
            // Seed defaults into database if not found, to guarantee CSDL integration works seamlessly!
            jdbcTemplate.update(
                "INSERT INTO campaigns (id, name, duration, budget, status, product_link) VALUES (?, ?, ?, ?, ?, ?)",
                finalCampaignId, "Chiến dịch BST LSOUL", "01/10/2026 - 31/12/2026", new java.math.BigDecimal("500000000.00"), "active", "https://shopee.vn/ao-thun-nu-cotton-lsoul"
            );
            jdbcTemplate.update("INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "T1-CAM007", finalCampaignId, "diamond", "Hạng Kim Cương", "Doanh thu ≥ 100,000,000 VNĐ", 15, true);
            jdbcTemplate.update("INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "T2-CAM007", finalCampaignId, "gold", "Hạng Vàng", "Doanh thu ≥ 20,000,000 VNĐ", 12, true);
            jdbcTemplate.update("INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "T3-CAM007", finalCampaignId, "silver", "Hạng Bạc", "Doanh thu ≥ 5,000,000 VNĐ", 10, true);
            jdbcTemplate.update("INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "T4-CAM007", finalCampaignId, "bronze", "Hạng Đồng", "Doanh thu ≥ 1,000,000 VNĐ", 8, true);
            jdbcTemplate.update("INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                "T5-CAM007", finalCampaignId, "basic", "Người mới", "Doanh thu < 1,000,000 VNĐ", 5, true);

            return showAdminCampaigns(finalCampaignId, model);
        }

        // Truy vấn toàn bộ danh sách chiến dịch để đưa vào tab quản trị danh sách
        List<Map<String, Object>> campaignsListRaw = jdbcTemplate.queryForList(
            "SELECT * FROM campaigns ORDER BY created_at DESC"
        );
        List<AdminCampaignData> campaignsList = new ArrayList<>();
        for (Map<String, Object> cRow : campaignsListRaw) {
            String cId = (String) cRow.get("id");
            String cName = (String) cRow.get("name");
            String cDuration = (String) cRow.get("duration");
            java.math.BigDecimal cBudgetDec = (java.math.BigDecimal) cRow.get("budget");
            String cStatus = (String) cRow.get("status");
            String cProductLink = (String) cRow.get("product_link");
            
            String cBudgetStr = "";
            if (cBudgetDec != null) {
                cBudgetStr = String.format("%,d", cBudgetDec.longValue()).replace(',', '.');
            }
            
            campaignsList.add(new AdminCampaignData(cId, cName, cDuration, cBudgetStr, cStatus, cProductLink, null));
        }
        model.addAttribute("campaignsList", campaignsList);

        model.addAttribute("title", "Khởi tạo Chiến dịch Mới");
        model.addAttribute("activePage", "campaigns");
        model.addAttribute("campaign", campaignData);
        return "admin/campaigns";
    }

    @PostMapping("/admin/campaigns/save")
    @ResponseBody
    public Map<String, Object> saveCampaign(@RequestBody AdminCampaignData campaignData) {
        if (!hasPermission("nav_campaigns")) {
            return Map.of("success", false, "message", "Bạn không có quyền quản lý chiến dịch!");
        }

        try {
            String campaignId = campaignData.getId();
            if (campaignId == null || campaignId.trim().isEmpty() || campaignId.startsWith("custom_")) {
                campaignId = "CAM-2026-" + System.currentTimeMillis();
            } else {
                campaignId = campaignId.trim();
            }

            String name = campaignData.getName();
            String duration = campaignData.getDuration();
            String budgetStr = campaignData.getBudget();
            String status = campaignData.getStatus();

            if (name == null || name.trim().isEmpty()) {
                return Map.of("success", false, "message", "Tên chiến dịch không được để trống!");
            }
            if (duration == null || duration.trim().isEmpty()) {
                return Map.of("success", false, "message", "Thời gian diễn ra không được để trống!");
            }
            if (budgetStr == null || budgetStr.trim().isEmpty()) {
                return Map.of("success", false, "message", "Ngân sách không được để trống!");
            }

            String cleanBudget = budgetStr.replaceAll("[^\\d]", "");
            if (cleanBudget.isEmpty()) {
                return Map.of("success", false, "message", "Ngân sách không đúng định dạng!");
            }
            java.math.BigDecimal budget = new java.math.BigDecimal(cleanBudget);

            if (status == null || status.trim().isEmpty()) {
                status = "active";
            }

            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM campaigns WHERE id = ?", Integer.class, campaignId
            );
            String productLink = campaignData.getProductLink();

            if (count != null && count > 0) {
                jdbcTemplate.update(
                    "UPDATE campaigns SET name = ?, duration = ?, budget = ?, status = ?, product_link = ? WHERE id = ?",
                    name, duration, budget, status, productLink, campaignId
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO campaigns (id, name, duration, budget, status, product_link) VALUES (?, ?, ?, ?, ?, ?)",
                    campaignId, name, duration, budget, status, productLink
                );
            }

            jdbcTemplate.update("DELETE FROM commission_tiers WHERE campaign_id = ?", campaignId);

            List<AdminCampaignData.CommissionTier> tiers = campaignData.getCommissionTiers();
            if (tiers != null) {
                int index = 1;
                for (AdminCampaignData.CommissionTier tier : tiers) {
                    String tierId = "T" + index + "-" + campaignId;

                    String tierKey = tier.getIcon();
                    if (tierKey == null || tierKey.trim().isEmpty()) {
                        tierKey = "basic";
                    }

                    String rankName = tier.getRankName();
                    if (rankName == null || rankName.trim().isEmpty()) {
                        rankName = "Hạng KOC " + index;
                    }

                    String requirement = tier.getRequirement();
                    if (requirement == null || requirement.trim().isEmpty()) {
                        requirement = "Tự định nghĩa điều kiện";
                    }

                    int rate = tier.getRate();
                    boolean active = tier.isActive();

                    jdbcTemplate.update(
                        "INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        tierId, campaignId, tierKey, rankName, requirement, rate, active
                    );
                    index++;
                }
            }

            return Map.of(
                "success", true,
                "message", "Lưu thông tin chiến dịch [" + name + "] thành công!",
                "campaignId", campaignId
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Lỗi hệ thống khi lưu chiến dịch: " + e.getMessage());
        }
    }

    @PostMapping("/admin/campaigns/delete/{id}")
    @ResponseBody
    public Map<String, Object> deleteCampaign(@PathVariable String id) {
        if (!hasPermission("nav_campaigns")) {
            return Map.of("success", false, "message", "Bạn không có quyền xóa chiến dịch!");
        }
        try {
            jdbcTemplate.update("DELETE FROM campaigns WHERE id = ?", id);
            return Map.of("success", true, "message", "Đã xóa chiến dịch thành công!");
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Lỗi khi xóa chiến dịch: " + e.getMessage());
        }
    }

    @GetMapping("/admin/tracking")
    public String showAdminTracking(Model model) {
        if (!hasPermission("nav_tracking")) {
            return "redirect:/403";
        }
        // Cảnh báo gian lận
        List<AdminTrackingData.FraudAlert> alerts = new ArrayList<>();
        alerts.add(new AdminTrackingData.FraudAlert("10:24:31", "Cảnh báo Bot Click từ dải IP 192.168.x.x - Đã chặn", "Cao"));
        alerts.add(new AdminTrackingData.FraudAlert("10:24:12", "Tỷ lệ Spam Click 100% từ KOC @user_123 - Tạm ngưng", "Cao"));
        alerts.add(new AdminTrackingData.FraudAlert("10:23:48", "Phát hiện hành vi Click ảo (Auto-click) từ KOC @abc_review", "Cao"));
        alerts.add(new AdminTrackingData.FraudAlert("10:23:15", "Nguồn traffic bất thường từ Country: Unknown", "Trung bình"));
        alerts.add(new AdminTrackingData.FraudAlert("10:22:56", "Tỷ lệ Bounce Rate bất thường > 95% từ KOC @fake_user", "Trung bình"));
        alerts.add(new AdminTrackingData.FraudAlert("10:22:31", "Cảnh báo nhiều Click liên tiếp từ IP 10.0.0.5 - Đã chặn", "Cao"));
        alerts.add(new AdminTrackingData.FraudAlert("10:21:58", "Thiết bị ảo/Proxy được sử dụng bởi KOC @spam_clicker", "Trung bình"));

        // Đối tượng tình nghi
        List<AdminTrackingData.SuspectTarget> suspects = new ArrayList<>();
        suspects.add(new AdminTrackingData.SuspectTarget("susp_1", "User 123", "@user_123", "profile_avatar.png", "tiktok", "TikTok", "Dùng tool auto-click", "100%", "2,450", "10:24:31"));
        suspects.add(new AdminTrackingData.SuspectTarget("susp_2", "Fake Review", "@fake_review", "profile_avatar.png", "tiktok", "TikTok", "Click ảo từ IP Proxy", "98%", "1,980", "10:23:48"));
        suspects.add(new AdminTrackingData.SuspectTarget("susp_3", "Spam Clicker", "@spam_clicker", "profile_avatar.png", "shopee", "Shopee", "Spam Click hàng loạt", "97%", "1,560", "10:21:58"));
        suspects.add(new AdminTrackingData.SuspectTarget("susp_4", "Bot Traffic", "@bot_traffic", "profile_avatar.png", "facebook", "Facebook", "Bot Traffic / Thiết bị ảo", "96%", "1,320", "10:20:45"));

        AdminTrackingData tracking = new AdminTrackingData(
            "154,200",
            "148,000",
            "6,200",
            "95/100",
            alerts,
            suspects
        );

        model.addAttribute("title", "Giám sát Hệ thống (Real-time)");
        model.addAttribute("activePage", "tracking");
        model.addAttribute("tracking", tracking);
        return "admin/tracking";
    }

    @GetMapping("/admin/finance")
    public String showAdminFinance(Model model) {
        if (!hasPermission("nav_finance")) {
            return "redirect:/403";
        }
        
        // Truy vấn tất cả yêu cầu rút tiền từ CSDL thực tế kết nối với thông tin KOC tương ứng
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT pr.*, u.full_name, u.username, u.avatar FROM payout_requests pr " +
            "JOIN users u ON pr.koc_id = u.id " +
            "ORDER BY pr.request_date DESC"
        );

        List<AdminFinanceData.PayoutRequest> requests = new ArrayList<>();
        int pendingCount = 0;
        java.math.BigDecimal pendingAmountVal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalPaidThisMonthVal = new java.math.BigDecimal("850000000.00"); // Hoa hồng cơ bản tháng này

        for (Map<String, Object> row : rows) {
            String id = (String) row.get("id");
            String kocName = (String) row.get("full_name");
            String username = "@" + row.get("username");
            String avatar = (String) row.get("avatar");
            if (avatar == null || avatar.trim().isEmpty()) {
                avatar = "default_avatar.png";
            }
            String amountStr = (String) row.get("amount_str");
            java.math.BigDecimal amount = (java.math.BigDecimal) row.get("amount");
            String bankName = (String) row.get("bank_name");
            String bankLogoClass = (String) row.get("bank_logo_class");
            String accountNumber = (String) row.get("account_number");
            String date = (String) row.get("request_date");
            String status = (String) row.get("status");

            if ("pending".equalsIgnoreCase(status)) {
                pendingCount++;
                pendingAmountVal = pendingAmountVal.add(amount);
            } else if ("approved".equalsIgnoreCase(status)) {
                totalPaidThisMonthVal = totalPaidThisMonthVal.add(amount);
            }

            requests.add(new AdminFinanceData.PayoutRequest(
                id, kocName, username, avatar, amountStr, bankName, bankLogoClass, accountNumber, date, status
            ));
        }

        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");

        // Truy vấn tất cả các giao dịch (đơn hàng) để đối soát
        List<Map<String, Object>> txRows = jdbcTemplate.queryForList(
            "SELECT t.*, u.full_name, u.username, u.avatar FROM transactions t " +
            "JOIN users u ON t.koc_id = u.id " +
            "ORDER BY t.transaction_date DESC"
        );
        List<AdminFinanceData.OrderTransaction> orderTransactions = new ArrayList<>();
        for (Map<String, Object> txRow : txRows) {
            String txId = (String) txRow.get("id");
            String kocName = (String) txRow.get("full_name");
            String username = "@" + txRow.get("username");
            String avatar = (String) txRow.get("avatar");
            if (avatar == null || avatar.trim().isEmpty()) {
                avatar = "default_avatar.png";
            }
            String campaignName = (String) txRow.get("campaign_name");
            String platform = (String) txRow.get("platform");
            java.math.BigDecimal orderAmount = (java.math.BigDecimal) txRow.get("order_amount");
            java.math.BigDecimal commissionAmount = (java.math.BigDecimal) txRow.get("commission_amount");
            String date = (String) txRow.get("transaction_date");
            String status = (String) txRow.get("status");

            orderTransactions.add(new AdminFinanceData.OrderTransaction(
                txId, kocName, username, avatar, campaignName, platform,
                df.format(orderAmount) + " VNĐ",
                df.format(commissionAmount) + " VNĐ",
                commissionAmount,
                date, status
            ));
        }

        AdminFinanceData finance = new AdminFinanceData(
            pendingCount,
            df.format(pendingAmountVal) + " VNĐ",
            df.format(totalPaidThisMonthVal) + " VNĐ",
            requests,
            orderTransactions
        );

        model.addAttribute("title", "Đối soát & Thanh toán");
        model.addAttribute("activePage", "finance");
        model.addAttribute("finance", finance);
        return "admin/finance";
    }

    /**
     * API phê duyệt 1 yêu cầu rút tiền đơn lẻ.
     */
    @PostMapping("/api/admin/finance/approve")
    @ResponseBody
    public ResponseEntity<?> approvePayoutRequest(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_finance")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String requestId = payload.get("requestId");
        if (requestId == null || requestId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Mã yêu cầu không hợp lệ"));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM payout_requests WHERE id = ?", requestId);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy yêu cầu đối soát"));
        }
        Map<String, Object> row = rows.get(0);
        String status = (String) row.get("status");

        if (!"pending".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Yêu cầu đã được xử lý từ trước!"));
        }

        // Cập nhật trạng thái thành approved
        jdbcTemplate.update("UPDATE payout_requests SET status = 'approved' WHERE id = ?", requestId);

        // Ghi nhật ký hoạt động
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            String logId = "LOG-" + now.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(10000 + Math.random()*90000);
            String changesJson = String.format("{\n  \"payout_id\": \"%s\",\n  \"status\": \"approved\"\n}", requestId);
            
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User adminUser = userRepository.findByUsername(adminUsername).orElse(null);
            String adminName = adminUser != null ? adminUser.getFullName() : "Admin System";
            String adminEmail = adminUser != null ? adminUser.getEmail() : "admin@koc.vn";
            String adminAvatar = adminUser != null ? adminUser.getAvatar() : "profile_avatar.png";

            jdbcTemplate.update(
                "INSERT INTO audit_logs (log_id, created_at, admin_name, email, avatar, action_type, badge_class, target_object, object_id, action_description, ip_address, changes_json) VALUES " +
                "(?, ?, ?, ?, ?, 'payout_approve', 'approve', ?, ?, ?, '127.0.0.1', ?)",
                logId, now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss")), adminName, adminEmail, adminAvatar, "Phê duyệt #" + requestId, requestId, "Phê duyệt lệnh rút tiền #" + requestId + " số tiền " + row.get("amount_str"), changesJson
            );
        } catch (Exception e) {
            System.err.println("Warning: Could not write payout log: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Phê duyệt rút tiền thành công!"));
    }

    /**
     * API từ chối 1 yêu cầu rút tiền đơn lẻ và HOÀN TIỀN lại cho KOC.
     */
    @PostMapping("/api/admin/finance/reject")
    @ResponseBody
    public ResponseEntity<?> rejectPayoutRequest(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_finance")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String requestId = payload.get("requestId");
        if (requestId == null || requestId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Mã yêu cầu không hợp lệ"));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM payout_requests WHERE id = ?", requestId);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy yêu cầu đối soát"));
        }
        Map<String, Object> row = rows.get(0);
        String status = (String) row.get("status");

        if (!"pending".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Yêu cầu đã được xử lý từ trước!"));
        }

        java.math.BigDecimal amount = (java.math.BigDecimal) row.get("amount");
        Integer kocId = (Integer) row.get("koc_id");

        // Cập nhật trạng thái thành rejected
        jdbcTemplate.update("UPDATE payout_requests SET status = 'rejected' WHERE id = ?", requestId);

        // HOÀN TIỀN lại cho KOC (Cộng lại ví số dư khả dụng và trừ tổng số đã rút)
        jdbcTemplate.update(
            "UPDATE user_balances SET available_balance = available_balance + ?, total_withdrawn = total_withdrawn - ? WHERE koc_id = ?",
            amount, amount, kocId
        );

        // Ghi nhật ký hoạt động
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            String logId = "LOG-" + now.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(10000 + Math.random()*90000);
            String changesJson = String.format("{\n  \"payout_id\": \"%s\",\n  \"status\": \"rejected\"\n}", requestId);
            
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User adminUser = userRepository.findByUsername(adminUsername).orElse(null);
            String adminName = adminUser != null ? adminUser.getFullName() : "Admin System";
            String adminEmail = adminUser != null ? adminUser.getEmail() : "admin@koc.vn";
            String adminAvatar = adminUser != null ? adminUser.getAvatar() : "profile_avatar.png";

            jdbcTemplate.update(
                "INSERT INTO audit_logs (log_id, created_at, admin_name, email, avatar, action_type, badge_class, target_object, object_id, action_description, ip_address, changes_json) VALUES " +
                "(?, ?, ?, ?, ?, 'payout_reject', 'delete', ?, ?, ?, '127.0.0.1', ?)",
                logId, now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss")), adminName, adminEmail, adminAvatar, "Từ chối #" + requestId, requestId, "Từ chối lệnh rút tiền #" + requestId + " số tiền " + row.get("amount_str") + " và hoàn trả lại số dư cho KOC", changesJson
            );
        } catch (Exception e) {
            System.err.println("Warning: Could not write payout log: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Từ chối và hoàn tiền thành công!"));
    }

    /**
     * API phê duyệt HÀNG LOẠT yêu cầu rút tiền.
     */
    @PostMapping("/api/admin/finance/approve-bulk")
    @ResponseBody
    public ResponseEntity<?> approvePayoutRequestsBulk(@RequestBody Map<String, List<String>> payload) {
        if (!hasPermission("nav_finance")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        List<String> requestIds = payload.get("requestIds");
        if (requestIds == null || requestIds.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Danh sách mã yêu cầu trống"));
        }

        int successCount = 0;
        for (String id : requestIds) {
            try {
                String status = jdbcTemplate.queryForObject("SELECT status FROM payout_requests WHERE id = ?", String.class, id);
                if ("pending".equalsIgnoreCase(status)) {
                    jdbcTemplate.update("UPDATE payout_requests SET status = 'approved' WHERE id = ?", id);
                    successCount++;
                }
            } catch (Exception e) {
                System.err.println("Warning: Could not approve request during bulk: " + id);
            }
        }

        // Ghi nhật ký phê duyệt hàng loạt
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            String logId = "LOG-" + now.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(10000 + Math.random()*90000);
            
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User adminUser = userRepository.findByUsername(adminUsername).orElse(null);
            String adminName = adminUser != null ? adminUser.getFullName() : "Admin System";
            String adminEmail = adminUser != null ? adminUser.getEmail() : "admin@koc.vn";
            String adminAvatar = adminUser != null ? adminUser.getAvatar() : "profile_avatar.png";

            jdbcTemplate.update(
                "INSERT INTO audit_logs (log_id, created_at, admin_name, email, avatar, action_type, badge_class, target_object, object_id, action_description, ip_address, changes_json) VALUES " +
                "(?, ?, ?, ?, ?, 'payout_approve', 'approve', ?, 'BULK_APPROVE', ?, '127.0.0.1', '{}')",
                logId, now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss")), adminName, adminEmail, adminAvatar, "Duyệt hàng loạt", "Phê duyệt hàng loạt thành công " + successCount + " lệnh rút tiền chờ thanh toán"
            );
        } catch (Exception e) {
            System.err.println("Warning: Could not write payout bulk log: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Phê duyệt hàng loạt thành công " + successCount + " lệnh rút tiền!"));
    }

    /**
     * API phê duyệt 1 đơn hàng đối soát (chuyển tiền từ pending sang available).
     */
    @PostMapping("/api/admin/finance/order/approve")
    @ResponseBody
    public ResponseEntity<?> approveOrderTransaction(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_finance")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String orderId = payload.get("orderId");
        if (orderId == null || orderId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Mã đơn hàng không hợp lệ"));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM transactions WHERE id = ?", orderId);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy đơn hàng đối soát"));
        }
        Map<String, Object> row = rows.get(0);
        String status = (String) row.get("status");

        if (!"pending".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Đơn hàng đã được đối soát từ trước!"));
        }

        java.math.BigDecimal commissionAmount = (java.math.BigDecimal) row.get("commission_amount");
        Integer kocId = (Integer) row.get("koc_id");

        // Cập nhật trạng thái giao dịch thành approved
        jdbcTemplate.update("UPDATE transactions SET status = 'approved' WHERE id = ?", orderId);

        // Chuyển tiền từ pending_commission sang available_balance
        jdbcTemplate.update(
            "UPDATE user_balances SET available_balance = available_balance + ?, pending_commission = GREATEST(0.00, pending_commission - ?) WHERE koc_id = ?",
            commissionAmount, commissionAmount, kocId
        );

        return ResponseEntity.ok(Map.of("status", "success", "message", "Đối soát và duyệt hoa hồng đơn hàng thành công!"));
    }

    /**
     * API từ chối / hủy 1 đơn hàng đối soát (trừ pending của KOC).
     */
    @PostMapping("/api/admin/finance/order/reject")
    @ResponseBody
    public ResponseEntity<?> rejectOrderTransaction(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_finance")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String orderId = payload.get("orderId");
        if (orderId == null || orderId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Mã đơn hàng không hợp lệ"));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM transactions WHERE id = ?", orderId);
        if (rows.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy đơn hàng đối soát"));
        }
        Map<String, Object> row = rows.get(0);
        String status = (String) row.get("status");

        if (!"pending".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Đơn hàng đã được đối soát từ trước!"));
        }

        java.math.BigDecimal commissionAmount = (java.math.BigDecimal) row.get("commission_amount");
        Integer kocId = (Integer) row.get("koc_id");

        // Cập nhật trạng thái giao dịch thành rejected
        jdbcTemplate.update("UPDATE transactions SET status = 'rejected' WHERE id = ?", orderId);

        // Trừ hoa hồng chờ đối soát
        jdbcTemplate.update(
            "UPDATE user_balances SET pending_commission = GREATEST(0.00, pending_commission - ?) WHERE koc_id = ?",
            commissionAmount, kocId
        );

        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã từ chối và hủy bỏ hoa hồng đơn hàng thành công!"));
    }

    @GetMapping("/admin/disputes")
    public String showAdminDisputes(Model model) {
        if (!hasPermission("nav_disputes")) {
            return "redirect:/403";
        }
        List<AdminDisputesData.DisputeTicket> tickets = new ArrayList<>();
        
        // Truy vấn danh sách ticket khiếu nại thực tế từ CSDL
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT dt.*, u.full_name, u.username, u.avatar, u.tier FROM dispute_tickets dt " +
            "JOIN users u ON dt.koc_id = u.id " +
            "ORDER BY dt.created_at DESC"
        );

        int pendingCount = 0;
        for (Map<String, Object> row : rows) {
            String ticketId = (String) row.get("id");
            String kocName = (String) row.get("full_name");
            String username = "@" + row.get("username");
            String avatar = (String) row.get("avatar");
            if (avatar == null || avatar.trim().isEmpty()) {
                avatar = "default_avatar.png";
            }
            
            // Ánh xạ phân hạng KOC sang định dạng tiếng Việt
            String rawTier = (String) row.get("tier");
            String tier = "Đồng";
            if ("gold".equalsIgnoreCase(rawTier) || "Vàng".equalsIgnoreCase(rawTier)) {
                tier = "Vàng";
            } else if ("silver".equalsIgnoreCase(rawTier) || "Bạc".equalsIgnoreCase(rawTier)) {
                tier = "Bạc";
            } else if ("diamond".equalsIgnoreCase(rawTier) || "Kim Cương".equalsIgnoreCase(rawTier)) {
                tier = "Kim Cương";
            }

            String subject = (String) row.get("subject");
            String date = (String) row.get("request_date");
            int commentCount = row.get("replies_count") != null ? ((Number) row.get("replies_count")).intValue() : 0;
            String status = (String) row.get("status");
            if ("pending".equalsIgnoreCase(status)) {
                pendingCount++;
            }
            String description = (String) row.get("description");
            String updateTime = (String) row.get("created_at");

            // Lấy tệp đính kèm tương ứng của ticket
            List<String> attachments = jdbcTemplate.queryForList(
                "SELECT file_path FROM dispute_attachments WHERE ticket_id = ?",
                String.class,
                ticketId
            );

            tickets.add(new AdminDisputesData.DisputeTicket(
                ticketId, kocName, username, avatar, tier,
                subject, date, commentCount, status, description,
                updateTime, attachments
            ));
        }

        AdminDisputesData disputes = new AdminDisputesData(
            pendingCount,
            "2h", // Thời gian phản hồi trung bình
            tickets
        );

        model.addAttribute("title", "Quản lý Yêu cầu Hỗ trợ");
        model.addAttribute("activePage", "disputes");
        model.addAttribute("disputes", disputes);
        return "admin/disputes";
    }

    /**
     * API tải danh sách câu trả lời/tin nhắn hội thoại của một ticket khiếu nại.
     */
    @GetMapping("/api/admin/disputes/{id}/replies")
    @ResponseBody
    public ResponseEntity<?> getTicketReplies(@PathVariable("id") String ticketId) {
        if (!hasPermission("nav_disputes")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        List<Map<String, Object>> replies = jdbcTemplate.queryForList(
            "SELECT * FROM dispute_replies WHERE ticket_id = ? ORDER BY id ASC",
            ticketId
        );
        
        return ResponseEntity.ok(replies);
    }

    /**
     * API gửi phản hồi (tin nhắn chat) của Admin tới KOC cho ticket.
     */
    @PostMapping("/api/admin/disputes/reply")
    @ResponseBody
    public ResponseEntity<?> replyToTicket(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_disputes")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String ticketId = payload.get("ticketId");
        String message = payload.get("message");
        
        if (ticketId == null || ticketId.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Dữ liệu không hợp lệ"));
        }

        // Chặn gửi tin nhắn nếu ticket đã được giải quyết hoặc đóng
        String currentStatus = null;
        try {
            currentStatus = jdbcTemplate.queryForObject("SELECT status FROM dispute_tickets WHERE id = ?", String.class, ticketId);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy yêu cầu hỗ trợ tương ứng"));
        }
        if ("resolved".equalsIgnoreCase(currentStatus) || "closed".equalsIgnoreCase(currentStatus)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Ticket đã đóng hoặc giải quyết, không thể phản hồi thêm!"));
        }
        
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedDate = now.format(formatter);
        
        // Thêm tin nhắn phản hồi của Admin vào bảng
        jdbcTemplate.update(
            "INSERT INTO dispute_replies (ticket_id, sender, sender_name, message, created_at) VALUES (?, 'admin', 'Admin System', ?, ?)",
            ticketId,
            message,
            formattedDate
        );
        
        // Cập nhật tăng số lượt phản hồi trong bảng ticket khiếu nại chính
        jdbcTemplate.update(
            "UPDATE dispute_tickets SET replies_count = replies_count + 1 WHERE id = ?",
            ticketId
        );
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Gửi phản hồi thành công",
            "time", "Hôm nay, " + now.format(DateTimeFormatter.ofPattern("HH:mm"))
        ));
    }

    /**
     * API đánh dấu ticket khiếu nại đã được GIẢI QUYẾT (resolved).
     */
    @PostMapping("/api/admin/disputes/resolve")
    @ResponseBody
    public ResponseEntity<?> resolveTicket(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_disputes")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String ticketId = payload.get("ticketId");
        if (ticketId == null || ticketId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Dữ liệu không hợp lệ"));
        }

        // Kiểm tra xem trạng thái hiện tại có đã đóng hoặc đã giải quyết chưa để chặn thao tác thừa
        String currentStatus = null;
        try {
            currentStatus = jdbcTemplate.queryForObject("SELECT status FROM dispute_tickets WHERE id = ?", String.class, ticketId);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy yêu cầu hỗ trợ tương ứng"));
        }
        if ("resolved".equalsIgnoreCase(currentStatus) || "closed".equalsIgnoreCase(currentStatus)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Ticket đã được giải quyết hoặc đóng, không thể thay đổi trạng thái nữa!"));
        }
        
        jdbcTemplate.update(
            "UPDATE dispute_tickets SET status = 'resolved' WHERE id = ?",
            ticketId
        );
        
        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã đánh dấu giải quyết thành công"));
    }

    /**
     * API TỪ CHỐI / ĐÓNG (closed) ticket khiếu nại.
     */
    @PostMapping("/api/admin/disputes/close")
    @ResponseBody
    public ResponseEntity<?> closeTicket(@RequestBody Map<String, String> payload) {
        if (!hasPermission("nav_disputes")) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Không có quyền truy cập"));
        }
        
        String ticketId = payload.get("ticketId");
        if (ticketId == null || ticketId.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Dữ liệu không hợp lệ"));
        }

        // Kiểm tra xem trạng thái hiện tại có đã đóng hoặc đã giải quyết chưa để chặn thao tác thừa
        String currentStatus = null;
        try {
            currentStatus = jdbcTemplate.queryForObject("SELECT status FROM dispute_tickets WHERE id = ?", String.class, ticketId);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy yêu cầu hỗ trợ tương ứng"));
        }
        if ("resolved".equalsIgnoreCase(currentStatus) || "closed".equalsIgnoreCase(currentStatus)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Ticket đã được giải quyết hoặc đóng, không thể thay đổi trạng thái nữa!"));
        }
        
        jdbcTemplate.update(
            "UPDATE dispute_tickets SET status = 'closed' WHERE id = ?",
            ticketId
        );
        
        return ResponseEntity.ok(Map.of("status", "success", "message", "Đã từ chối và đóng ticket thành công"));
    }

    @GetMapping("/admin/logs")
    public String showAdminLogs(Model model) {
        if (!hasPermission("nav_logs")) {
            return "redirect:/403";
        }
        List<AdminLogsData.AuditLog> logs = new ArrayList<>();
        
        String json1 = "{\n  \"log_id\": \"LOG-20260524-143022-7XK9L\",\n  \"timestamp\": \"2026-05-24T14:30:22+07:00\",\n  \"admin_id\": \"ADM-1001\",\n  \"admin_name\": \"Nguyễn Văn A\",\n  \"action\": \"UPDATE_COMMISSION_RATE\",\n  \"module\": \"CAMPAIGN\",\n  \"object_id\": \"CAM-2026-007\",\n  \"changes\": {\n    \"old_value\": \"10%\",\n    \"new_value\": \"12%\",\n    \"field\": \"commission_rate\",\n    \"tier\": \"gold\"\n  },\n  \"ip_address\": \"113.190.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-143022-7XK9L", "24/05/2026 - 14:30:22", "Nguyễn Văn A", "nguyenvana@koc.vn", "profile_avatar.png", "Cập nhật", "update", "Chiến dịch BST LSOUL", "CAM-2026-007", "Thay đổi Tỷ lệ hoa hồng từ [10%] thành [12%] Hạng: Hạng Vàng", "113.190.***.***", json1));
        
        String json2 = "{\n  \"log_id\": \"LOG-20260524-142815-9PL2A\",\n  \"timestamp\": \"2026-05-24T14:28:15+07:00\",\n  \"admin_id\": \"ADM-1002\",\n  \"admin_name\": \"Trần Thị Bịch\",\n  \"action\": \"APPROVE_PAYOUT\",\n  \"module\": \"WITHDRAWAL\",\n  \"object_id\": \"WD-123\",\n  \"changes\": {\n    \"payout_amount\": \"15,000,000 VNĐ\",\n    \"bank\": \"Vietcombank\",\n    \"card_number\": \"****1234\"\n  },\n  \"ip_address\": \"203.113.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-142815-9PL2A", "24/05/2026 - 14:28:15", "Trần Thị Bịch", "tranthibich@koc.vn", "profile_avatar.png", "Phê duyệt", "approve", "Lệnh rút tiền #WD-123", "WD-123", "Phê duyệt lệnh rút tiền số tiền [15,000,000 VNĐ] về tài khoản Vietcombank ****1234", "203.113.***.***", json2));
        
        String json3 = "{\n  \"log_id\": \"LOG-20260524-142508-3HG8P\",\n  \"timestamp\": \"2026-05-24T14:25:08+07:00\",\n  \"admin_id\": \"ADM-1003\",\n  \"admin_name\": \"Lê Hoàng Nam\",\n  \"action\": \"UPDATE_KOC_TIER\",\n  \"module\": \"KOC_PROFILE\",\n  \"object_id\": \"KOC-1023\",\n  \"changes\": {\n    \"old_tier\": \"silver\",\n    \"new_tier\": \"gold\",\n    \"username\": \"@ducanh.review\"\n  },\n  \"ip_address\": \"42.118.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-142508-3HG8P", "24/05/2026 - 14:25:08", "Lê Hoàng Nam", "lehoangnam@koc.vn", "profile_avatar.png", "Cập nhật", "update", "Người dùng: @ducanh.review", "KOC-1023", "Thay đổi Hạng từ [Hạng Bạc] thành [Hạng Vàng]", "42.118.***.***", json3));
        
        String json4 = "{\n  \"log_id\": \"LOG-20260524-142051-5KJ3D\",\n  \"timestamp\": \"2026-05-24T14:20:51+07:00\",\n  \"admin_id\": \"ADM-1004\",\n  \"admin_name\": \"Phạm Quốc Tùng\",\n  \"action\": \"DELETE_CAMPAIGN\",\n  \"module\": \"CAMPAIGN\",\n  \"object_id\": \"CAM-2025-015\",\n  \"changes\": {\n    \"campaign_name\": \"Summer Sale\",\n    \"action\": \"HARD_DELETE\"\n  },\n  \"ip_address\": \"123.25.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-142051-5KJ3D", "24/05/2026 - 14:20:51", "Phạm Quốc Tùng", "phamqtung@koc.vn", "profile_avatar.png", "Xóa", "delete", "Chiến dịch Summer Sale", "CAM-2025-015", "Xóa chiến dịch [Summer Sale] khỏi hệ thống", "123.25.***.***", json4));
        
        String json5 = "{\n  \"log_id\": \"LOG-20260524-141833-2WE8F\",\n  \"timestamp\": \"2026-05-24T14:18:33+07:00\",\n  \"admin_id\": \"ADM-1001\",\n  \"admin_name\": \"Nguyễn Văn A\",\n  \"action\": \"UPDATE_GLOBAL_COMMISSION\",\n  \"module\": \"SYSTEM_SETTINGS\",\n  \"changes\": {\n    \"old_rate\": \"15%\",\n    \"new_rate\": \"16%\",\n    \"tier\": \"diamond\"\n  },\n  \"ip_address\": \"113.190.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-141833-2WE8F", "24/05/2026 - 14:18:33", "Nguyễn Văn A", "nguyenvana@koc.vn", "profile_avatar.png", "Cập nhật", "update", "Cấu hình hệ thống", "COMMISSION_SETTINGS", "Cập nhật mức hoa hồng cơ bản cho Hạng Kim Cương từ [15%] thành [16%]", "113.190.***.***", json5));
        
        String json6 = "{\n  \"log_id\": \"LOG-20260524-141512-8UY9K\",\n  \"timestamp\": \"2026-05-24T14:15:12+07:00\",\n  \"admin_id\": \"ADM-1002\",\n  \"admin_name\": \"Trần Thị Bịch\",\n  \"action\": \"APPROVE_KOC_REGISTRATION\",\n  \"module\": \"KOC_MANAGEMENT\",\n  \"object_id\": \"KOC-1056\",\n  \"changes\": {\n    \"username\": \"@linhchi.daily\",\n    \"assigned_tier\": \"silver\"\n  },\n  \"ip_address\": \"203.113.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-141512-8UY9K", "24/05/2026 - 14:15:12", "Trần Thị Bịch", "tranthibich@koc.vn", "profile_avatar.png", "Phê duyệt", "approve", "KOC đăng ký mới: @linhchi.daily", "KOC-1056", "Phê duyệt tài khoản KOC mới đăng ký và gán Hạng Bạc", "203.113.***.***", json6));
        
        String json7 = "{\n  \"log_id\": \"LOG-20260524-141045-1DF3G\",\n  \"timestamp\": \"2026-05-24T14:10:45+07:00\",\n  \"admin_id\": \"ADM-1003\",\n  \"admin_name\": \"Lê Hoàng Nam\",\n  \"action\": \"DELETE_VIOLATING_POST\",\n  \"module\": \"CONTENT_MODERATION\",\n  \"object_id\": \"POST-7781\",\n  \"changes\": {\n    \"post_id\": \"POST-7781\",\n    \"reason\": \"SPAM_ADVERTISING\"\n  },\n  \"ip_address\": \"42.118.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-141045-1DF3G", "24/05/2026 - 14:10:45", "Lê Hoàng Nam", "lehoangnam@koc.vn", "profile_avatar.png", "Xóa", "delete", "Bài đăng vi phạm #POST-7781", "POST-7781", "Xóa bài đăng vi phạm chính sách (Spam/Quảng cáo sai lệch)", "42.118.***.***", json7));
        
        String json8 = "{\n  \"log_id\": \"LOG-20260524-140530-9IU8Y\",\n  \"timestamp\": \"2026-05-24T14:05:30+07:00\",\n  \"admin_id\": \"ADM-1004\",\n  \"admin_name\": \"Phạm Quốc Tùng\",\n  \"action\": \"SUSPEND_KOC_ACCOUNT\",\n  \"module\": \"KOC_MANAGEMENT\",\n  \"object_id\": \"KOC-1999\",\n  \"changes\": {\n    \"username\": \"@user_test_01\",\n    \"reason\": \"POLICY_VIOLATION\"\n  },\n  \"ip_address\": \"123.25.***.***\",\n  \"user_agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36\"\n}";
        logs.add(new AdminLogsData.AuditLog("LOG-20260524-140530-9IU8Y", "24/05/2026 - 14:05:30", "Phạm Quốc Tùng", "phamqtung@koc.vn", "profile_avatar.png", "Cập nhật", "update", "Người dùng: @user_test_01", "KOC-1999", "Vô hiệu hóa tài khoản do vi phạm chính sách", "123.25.***.***", json8));

        AdminLogsData logsData = new AdminLogsData(logs);

        model.addAttribute("title", "Nhật ký Hoạt động (Audit Trail)");
        model.addAttribute("activePage", "logs");
        model.addAttribute("logsData", logsData);
        return "admin/logs";
    }
}
