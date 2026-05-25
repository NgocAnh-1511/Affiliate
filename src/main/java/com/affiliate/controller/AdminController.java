package com.affiliate.controller;

import com.affiliate.model.AdminStats;
import com.affiliate.model.AdminUsersData;
import com.affiliate.model.AdminCampaignData;
import com.affiliate.model.AdminTrackingData;
import com.affiliate.model.AdminFinanceData;
import com.affiliate.model.AdminDisputesData;
import com.affiliate.model.AdminLogsData;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Controller
public class AdminController {

    /**
     * Hiển thị trang Tổng quan Admin (Admin Overview / Dashboard).
     */
    @GetMapping("/admin/overview")
    public String showAdminOverview(Model model) {
        // Khởi tạo danh sách yêu cầu đối soát chờ xử lý
        List<AdminStats.ReconciliationItem> pendingReconciliations = new ArrayList<>();
        pendingReconciliations.add(new AdminStats.ReconciliationItem("#RC-1092", "Phương Thảo", "12,500,000đ", "LSOUL TikTok Shop", "24/05/2026", "pending"));
        pendingReconciliations.add(new AdminStats.ReconciliationItem("#RC-1091", "Anh Tuấn", "8,200,000đ", "Shopee Tech Campaign", "24/05/2026", "pending"));
        pendingReconciliations.add(new AdminStats.ReconciliationItem("#RC-1090", "Thanh Hằng", "15,400,000đ", "Dior Beauty Launch", "23/05/2026", "pending"));
        pendingReconciliations.add(new AdminStats.ReconciliationItem("#RC-1089", "Minh Trí", "6,150,000đ", "BST LSOUL Mùa Hè", "23/05/2026", "approved"));
        pendingReconciliations.add(new AdminStats.ReconciliationItem("#RC-1088", "Hương Giang", "24,000,000đ", "TikTok Fashion Week", "22/05/2026", "approved"));

        // Khởi tạo danh sách KOC tiêu biểu
        List<AdminStats.TopKocItem> topKocs = new ArrayList<>();
        topKocs.add(new AdminStats.TopKocItem(1, "Mai Phương", "profile_avatar.png", "diamond", "1,850,000,000đ", "277,500,000đ"));
        topKocs.add(new AdminStats.TopKocItem(2, "Lê Minh", "profile_avatar.png", "gold", "1,240,000,000đ", "186,000,000đ"));
        topKocs.add(new AdminStats.TopKocItem(3, "Hà Linh", "profile_avatar.png", "gold", "980,000,000đ", "147,000,000đ"));
        topKocs.add(new AdminStats.TopKocItem(4, "Quỳnh Anh", "profile_avatar.png", "silver", "750,000,000đ", "112,500,000đ"));
        topKocs.add(new AdminStats.TopKocItem(5, "Bảo Nam", "profile_avatar.png", "silver", "620,000,000đ", "93,000,000đ"));

        // Tổng hợp số liệu thống kê chung
        AdminStats adminStats = new AdminStats(
            "12,450,000,000đ",
            "↑ 15.2%",
            "1,245,000,000đ",
            "↑ 12.4%",
            1250,
            "↑ 8.7%",
            45,
            "↑ 3.2%",
            pendingReconciliations,
            topKocs
        );

        model.addAttribute("stats", adminStats);
        return "admin/overview";
    }

    // --- CÁC ROUTE MOCKUP CHO CÁC TRANG CÒN LẠI CỦA ADMIN ĐỂ TRÁNH 404 ---

    @GetMapping("/admin/users")
    public String showAdminUsers(Model model) {
        // Khởi tạo 5 yêu cầu gia nhập chờ duyệt
        List<AdminUsersData.JoinRequest> pendingRequests = new ArrayList<>();
        pendingRequests.add(new AdminUsersData.JoinRequest("#JR-101", "Trần Thu Hà", "@thuhahashion", "profile_avatar.png", "tiktok", "125,000", "19/05/2024 14:32"));
        pendingRequests.add(new AdminUsersData.JoinRequest("#JR-102", "Lê Minh Quân", "@quanreview", "profile_avatar.png", "shopee", "87,500", "19/05/2024 11:15"));
        pendingRequests.add(new AdminUsersData.JoinRequest("#JR-103", "Phạm Ngọc Anh", "@anhngoc.daily", "profile_avatar.png", "tiktok", "210,000", "18/05/2024 20:45"));
        pendingRequests.add(new AdminUsersData.JoinRequest("#JR-104", "Hoàng Đức Duy", "@duy.unboxing", "profile_avatar.png", "tiktok", "65,200", "18/05/2024 16:20"));
        pendingRequests.add(new AdminUsersData.JoinRequest("#JR-105", "Vũ Thảo Vy", "@vythao.beauty", "profile_avatar.png", "shopee", "93,000", "17/05/2024 09:35"));

        // Khởi tạo danh sách KOC hoạt động
        List<AdminUsersData.ActiveKoc> activeKocs = new ArrayList<>();
        activeKocs.add(new AdminUsersData.ActiveKoc("#KC-201", "Mai Phương", "@maiphuong.official", "profile_avatar.png", "tiktok", "320,000", "diamond", "active"));
        activeKocs.add(new AdminUsersData.ActiveKoc("#KC-202", "Đức Anh", "@ducanh.review", "profile_avatar.png", "shopee", "150,000", "gold", "active"));
        activeKocs.add(new AdminUsersData.ActiveKoc("#KC-203", "Thảo Vy", "@vythao.beauty", "profile_avatar.png", "tiktok", "95,000", "silver", "active"));
        activeKocs.add(new AdminUsersData.ActiveKoc("#KC-204", "Quang Huy", "@huy.fitlife", "profile_avatar.png", "tiktok", "78,000", "basic", "suspended"));
        activeKocs.add(new AdminUsersData.ActiveKoc("#KC-205", "Linh Chi", "@linhchi.daily", "profile_avatar.png", "shopee", "60,000", "silver", "active"));

        // Khởi tạo danh sách nhân sự nội bộ (Staff Roles)
        List<AdminUsersData.StaffMember> staffMembers = new ArrayList<>();
        staffMembers.add(new AdminUsersData.StaffMember("#ST-01", "Nguyễn Văn A", "nguyenvana@koc.vn", "profile_avatar.png", "accounting", Arrays.asList("view_balance", "approve_withdrawal", "manage_koc")));
        staffMembers.add(new AdminUsersData.StaffMember("#ST-02", "Trần Thị Bịch", "tranthibich@koc.vn", "profile_avatar.png", "cskh", Arrays.asList("view_balance", "manage_koc")));
        staffMembers.add(new AdminUsersData.StaffMember("#ST-03", "Lê Hoàng Nam", "lehoangnam@koc.vn", "profile_avatar.png", "campaign_manager", Arrays.asList("view_balance", "manage_koc", "edit_campaign")));

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

    @GetMapping("/admin/campaigns")
    public String showAdminCampaigns(Model model) {
        // Khởi tạo các hạng hoa hồng mặc định
        List<AdminCampaignData.CommissionTier> tiers = new ArrayList<>();
        tiers.add(new AdminCampaignData.CommissionTier("tier_1", "Hạng Kim Cương", "diamond", "Doanh thu ≥ 100,000,000 VNĐ", 15, true));
        tiers.add(new AdminCampaignData.CommissionTier("tier_2", "Hạng Vàng", "gold", "Doanh thu ≥ 20,000,000 VNĐ", 12, true));
        tiers.add(new AdminCampaignData.CommissionTier("tier_3", "Hạng Bạc", "silver", "Doanh thu ≥ 5,000,000 VNĐ", 10, true));
        tiers.add(new AdminCampaignData.CommissionTier("tier_4", "KOC Mới/Cơ bản", "basic", "Doanh thu < 5,000,000 VNĐ", 8, true));

        AdminCampaignData campaign = new AdminCampaignData(
            "Chiến dịch Thu Đông LSOUL 2026",
            "01/10/2026 - 31/12/2026",
            "500,000,000",
            "active",
            tiers
        );

        model.addAttribute("title", "Khởi tạo Chiến dịch Mới");
        model.addAttribute("activePage", "campaigns");
        model.addAttribute("campaign", campaign);
        return "admin/campaigns";
    }

    @GetMapping("/admin/tracking")
    public String showAdminTracking(Model model) {
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
        List<AdminFinanceData.PayoutRequest> requests = new ArrayList<>();
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8921", "Mai Phương", "@maiphuong.official", "profile_avatar.png", "5,000,000 VNĐ", "Vietcombank", "vietcombank", "**** **** **** 1234", "20/05/2024 14:32", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8920", "Đức Anh", "@ducanh.review", "profile_avatar.png", "3,200,000 VNĐ", "MB Bank", "mbbank", "**** **** **** 5678", "20/05/2024 11:15", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8919", "Thảo Vy", "@vythao.beauty", "profile_avatar.png", "7,800,000 VNĐ", "Techcombank", "techcombank", "**** **** **** 2468", "20/05/2024 09:45", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8918", "Quang Huy", "@huy.fitlife", "profile_avatar.png", "2,500,000 VNĐ", "VietinBank", "vietinbank", "**** **** **** 1357", "19/05/2024 20:30", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8917", "Linh Chi", "@linhchi.daily", "profile_avatar.png", "4,600,000 VNĐ", "ACB", "acb", "**** **** **** 8899", "19/05/2024 16:20", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8916", "Hoàng Nam", "@nam.style", "profile_avatar.png", "6,300,000 VNĐ", "MB Bank", "mbbank", "**** **** **** 1122", "19/05/2024 10:05", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8915", "Phương Nhi", "@nhi.phuong", "profile_avatar.png", "1,900,000 VNĐ", "BIDV", "bidv", "**** **** **** 7788", "18/05/2024 21:50", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8914", "Trần Minh", "@minh.review", "profile_avatar.png", "5,500,000 VNĐ", "Vietcombank", "vietcombank", "**** **** **** 3344", "18/05/2024 15:10", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8913", "Bảo Ngọc", "@baongoc.makeup", "profile_avatar.png", "3,750,000 VNĐ", "Techcombank", "techcombank", "**** **** **** 5566", "18/05/2024 08:40", "pending"));
        requests.add(new AdminFinanceData.PayoutRequest("#WD-8912", "Minh Khang", "@khang.tech", "profile_avatar.png", "8,900,000 VNĐ", "MSB", "msb", "**** **** **** 9988", "17/05/2024 23:05", "pending"));

        AdminFinanceData finance = new AdminFinanceData(
            24,
            "125,500,000 VNĐ",
            "850,000,000 VNĐ",
            requests
        );

        model.addAttribute("title", "Đối soát & Thanh toán");
        model.addAttribute("activePage", "finance");
        model.addAttribute("finance", finance);
        return "admin/finance";
    }

    @GetMapping("/admin/disputes")
    public String showAdminDisputes(Model model) {
        List<AdminDisputesData.DisputeTicket> tickets = new ArrayList<>();
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1042", "Mai Phương", "@maiphuong.official", "profile_avatar.png", "Vàng",
            "Sai lệch hoa hồng LSOUL", "20/05/2024 14:32", 2, "pending",
            "Chào Admin, Đơn hàng ngày 15/10 của tôi (mã đơn #ORD-2024051500456) báo thành công trên TikTok Shop, nhưng hệ thống Affiliate của KOC vẫn chưa ghi nhận hoa hồng. Vui lòng kiểm tra và hỗ trợ giúp mình. Cảm ơn Admin!",
            "20/05/2024 14:35",
            Arrays.asList("don-hang-tiktok.jpg", "bao-cao-hoa-hong.png")
        ));
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1041", "Đức Anh", "@ducanh.review", "profile_avatar.png", "Vàng",
            "Mất đơn hàng TikTok", "20/05/2024 13:15", 1, "pending",
            "Hệ thống không ghi nhận đơn hàng tôi tạo trong phiên live trưa nay. Đơn hàng trị giá 2.5 triệu đồng mã giao dịch #ORD-TK-7729.",
            "20/05/2024 13:20",
            new ArrayList<>()
        ));
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1040", "Phạm Ngọc Anh", "@anhngoc.daily", "profile_avatar.png", "Bạc",
            "Chưa nhận được mẫu sản phẩm", "19/05/2024 20:45", 3, "pending",
            "Chiến dịch yêu cầu review đầm thu đông nhưng đã 5 ngày tôi chưa nhận được sản phẩm mẫu từ nhãn hàng LSOUL.",
            "19/05/2024 21:00",
            new ArrayList<>()
        ));
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1039", "Vũ Thảo Vy", "@vythao.beauty", "profile_avatar.png", "Bạc",
            "Link affiliate bị lỗi", "19/05/2024 16:20", 1, "pending",
            "Đường link tiếp thị liên kết dẫn sang Shopee của chiến dịch Tech Campaign báo lỗi 404, khách hàng không mua được.",
            "19/05/2024 16:22",
            new ArrayList<>()
        ));
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1038", "Hoàng Đức Duy", "@duy.unboxing", "profile_avatar.png", "Đồng",
            "Không rút được tiền hoa hồng", "18/05/2024 10:35", 2, "pending",
            "Tôi bấm nút rút tiền trên trang thu nhập hệ thống báo lỗi API Ngân hàng bị gián đoạn. Số tiền yêu cầu 1.5 triệu.",
            "18/05/2024 11:00",
            new ArrayList<>()
        ));
        
        tickets.add(new AdminDisputesData.DisputeTicket(
            "#TK-1037", "Lê Minh Quân", "@quanreview", "profile_avatar.png", "Vàng",
            "Yêu cầu hỗ trợ chiến dịch mới", "18/05/2024 09:10", 1, "pending",
            "Tôi muốn tham gia chiến dịch ra mắt sản phẩm của Dior nhưng chưa thấy hiển thị nút đăng ký tạo link rút gọn.",
            "18/05/2024 09:15",
            new ArrayList<>()
        ));

        AdminDisputesData disputes = new AdminDisputesData(
            12,
            "2h",
            tickets
        );

        model.addAttribute("title", "Quản lý Yêu cầu Hỗ trợ");
        model.addAttribute("activePage", "disputes");
        model.addAttribute("disputes", disputes);
        return "admin/disputes";
    }

    @GetMapping("/admin/logs")
    public String showAdminLogs(Model model) {
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
