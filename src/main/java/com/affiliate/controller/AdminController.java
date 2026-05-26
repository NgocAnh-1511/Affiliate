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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.format.DateTimeFormatter;
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
     * Hiển thị trang Tổng quan Admin (Admin Overview / Dashboard).
     */
    @GetMapping("/admin/overview")
    public String showAdminOverview(Model model) {
        if (!hasPermission("nav_overview")) {
            return "redirect:/403";
        }
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
        if (!hasPermission("nav_disputes")) {
            return "redirect:/403";
        }
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
