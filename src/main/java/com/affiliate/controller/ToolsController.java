package com.affiliate.controller;

import com.affiliate.model.Campaign;
import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Controller
public class ToolsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Tự động khởi tạo bảng short_links và campaign_participations nếu chưa tồn tại
     */
    @PostConstruct
    public void initDatabaseTables() {
        try {
            // 1. Tạo bảng short_links
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS short_links (" +
                "  short_code VARCHAR(100) PRIMARY KEY," +
                "  original_url TEXT NOT NULL," +
                "  koc_username VARCHAR(100) NOT NULL," +
                "  campaign_id VARCHAR(50) DEFAULT NULL," +
                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB;"
            );
            System.out.println("Table short_links verified/created successfully.");

            // 2. Tạo bảng campaign_participations
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS campaign_participations (" +
                "  koc_username VARCHAR(100)," +
                "  campaign_id VARCHAR(50)," +
                "  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "  PRIMARY KEY (koc_username, campaign_id)" +
                ") ENGINE=InnoDB;"
            );
            System.out.println("Table campaign_participations verified/created successfully.");
        } catch (Exception e) {
            System.err.println("Error initializing database tables: " + e.getMessage());
        }
    }

    /**
     * Hiển thị trang Công cụ Affiliate & Chiến dịch (Tools Page).
     * Truy vấn động dữ liệu các chiến dịch thực tế từ CSDL.
     */
    @GetMapping("/tools")
    public String showToolsPage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);
        } else {
            return "redirect:/login";
        }

        // Truy vấn danh sách ID chiến dịch đã đăng ký tham gia của KOC này
        List<String> joinedCampaignIds = new ArrayList<>();
        try {
            joinedCampaignIds = jdbcTemplate.queryForList(
                "SELECT campaign_id FROM campaign_participations WHERE koc_username = ?",
                String.class, username
            );
        } catch (Exception e) {
            System.err.println("Warning: Query joined campaigns failed: " + e.getMessage());
        }

        // Truy vấn động danh sách chiến dịch thực tế từ CSDL
        List<Map<String, Object>> dbCampaigns = new ArrayList<>();
        try {
            dbCampaigns = jdbcTemplate.queryForList(
                "SELECT * FROM campaigns ORDER BY created_at DESC"
            );
        } catch (Exception e) {
            System.err.println("Warning: Query campaigns failed: " + e.getMessage());
        }
        
        List<Campaign> campaigns = new ArrayList<>();
        int index = 1;
        
        for (Map<String, Object> cRow : dbCampaigns) {
            String cId = (String) cRow.get("id");
            String cName = (String) cRow.get("name");
            String cDuration = (String) cRow.get("duration");
            String cStatus = (String) cRow.get("status");
            
            // Chỉ hiển thị các chiến dịch đang hoạt động (active)
            if (!"active".equalsIgnoreCase(cStatus)) {
                continue;
            }
            
            // 1. Nhận diện nền tảng (trafficSource) từ tên chiến dịch
            String trafficSource = "shopee";
            String nameLower = cName.toLowerCase();
            if (nameLower.contains("tiktok")) {
                trafficSource = "tiktok";
            } else if (nameLower.contains("lazada")) {
                trafficSource = "lazada";
            } else if (nameLower.contains("tiki")) {
                trafficSource = "tiki";
            } else {
                // Phân bổ đều cho giao diện đa dạng
                if (index % 3 == 0) trafficSource = "tiktok";
                else if (index % 3 == 1) trafficSource = "shopee";
                else trafficSource = "lazada";
            }
            
            // 2. Truy vấn tỉ lệ hoa hồng cao nhất cấu hình trong CSDL cho chiến dịch này
            int maxRate = 12; // Mặc định fallback
            try {
                Integer rate = jdbcTemplate.queryForObject(
                    "SELECT MAX(rate_percent) FROM commission_tiers WHERE campaign_id = ?",
                    Integer.class, cId
                );
                if (rate != null) {
                    maxRate = rate;
                }
            } catch (Exception e) {
                // Fallback nếu chưa cấu hình tiers
            }
            String commission = "Hoa hồng " + maxRate + "%";
            
            // 3. Chuỗi thời gian diễn ra
            String timeText = "Thời gian: " + cDuration;
            
            // 4. Số KOC tham gia mô phỏng đẹp mắt theo mã băm tên để đồng bộ
            int mockJoined = 500 + (cName.hashCode() % 2000);
            if (mockJoined < 0) mockJoined = -mockJoined;
            String joinedCount = "Đã tham gia: " + String.format("%,d", mockJoined) + " KOC/KOL";
            
            // 5. Trạng thái nổi bật & Tag
            boolean featured = (index == 1);
            String tag = featured ? "NỔI BẬT" : "";
            
            // 6. Phân lớp màu banner & Ảnh đại diện phù hợp
            String bannerClass = "lsoul";
            if (nameLower.contains("shopee") || "shopee".equals(trafficSource)) {
                bannerClass = "shopee-sale";
            } else if (nameLower.contains("electronics") || "lazada".equals(trafficSource)) {
                bannerClass = "electronics";
            } else if (nameLower.contains("beauty") || nameLower.contains("làm đẹp")) {
                bannerClass = "beauty";
            } else if (nameLower.contains("summer") || nameLower.contains("thời trang")) {
                bannerClass = "summer";
            } else if (nameLower.contains("furniture") || "tiki".equals(trafficSource)) {
                bannerClass = "furniture";
            }
            
            String imageUrl = "/images/campaign" + (index % 6 + 1) + ".png";
            boolean isJoined = joinedCampaignIds.contains(cId);
            String productLink = (String) cRow.get("product_link");
            if (productLink == null) {
                productLink = "";
            }
            
            campaigns.add(new Campaign(index, cId, cName, imageUrl, trafficSource, commission, timeText, joinedCount, featured, tag, bannerClass, isJoined, productLink));
            index++;
        }
        
        // Fallback dự phòng: Nếu CSDL trống trơn, nạp bộ dữ liệu thiết kế mẫu để KOC vẫn trải nghiệm được
        if (campaigns.isEmpty()) {
            campaigns = Arrays.asList(
                new Campaign(1, "CAM-2026-007", "Chiến dịch BST LSOUL", "/images/campaign1.png", "tiktok", "Hoa hồng 15%", "Thời gian: 10/05/2024 - 31/05/2024", "Đã tham gia: 1,245 KOC/KOL", true, "NỔI BẬT", "lsoul", true, "https://shopee.vn/ao-thun-nu-cotton-lsoul"), // joined
                new Campaign(2, "CAM-2026-009", "Siêu Sale Shopee 5.5", "/images/campaign2.png", "shopee", "Hoa hồng 12%", "Thời gian: 01/05/2024 - 05/05/2024", "Đã tham gia: 2,560 KOC/KOL", false, "", "shopee-sale", false, "https://shopee.vn/sieu-sale-shopee-5.5"),
                new Campaign(3, "CAM-2026-008", "Điện Tử - Công Nghệ", "/images/campaign3.png", "lazada", "Hoa hồng 10%", "Thời gian: 05/05/2024 - 20/05/2024", "Đã tham gia: 980 KOC/KOL", false, "", "electronics", false, "https://lazada.vn/dien-tu-cong-nghe-sale-50"),
                new Campaign(4, "CAM-2026-007", "Làm Đẹp - Chăm Sóc Da", "/images/campaign4.png", "tiktok", "Hoa hồng 12%", "Thời gian: 01/05/2024 - 31/05/2024", "Đã tham gia: 1,876 KOC/KOL", false, "", "beauty", false, "https://shopee.vn/combo-lam-dep-cham-soc-da"),
                new Campaign(5, "CAM-2026-009", "Thời Trang Hè 2024", "/images/campaign5.png", "shopee", "Hoa hồng 11%", "Thời gian: 15/05/2024 - 15/06/2024", "Đã tham gia: 1,432 KOC/KOL", false, "NEW ARRIVAL", "summer", false, "https://shopee.vn/thoi-trang-he-2024"),
                new Campaign(6, "CAM-2026-010", "Nội Thất & Trang Trí", "/images/campaign6.png", "tiki", "Hoa hồng 9%", "Thời gian: 10/05/2024 - 25/05/2024", "Đã tham gia: 654 KOC/KOL", false, "", "furniture", false, "https://tiki.vn/noi-that-trang-tri-phong-cach-song")
            );
        }

        model.addAttribute("campaigns", campaigns);
        return "tools";
    }

    /**
     * REST API cho phép KOC đăng ký tham gia chiến dịch
     */
    @PostMapping("/api/campaigns/join")
    @ResponseBody
    public JoinResponse joinCampaign(@RequestBody JoinRequest request) {
        String campaignId = request.getCampaignId();
        if (campaignId == null || campaignId.trim().isEmpty()) {
            return new JoinResponse("error", "ID chiến dịch không được để trống");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            // Kiểm tra xem KOC đã tham gia chiến dịch này chưa
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM campaign_participations WHERE koc_username = ? AND campaign_id = ?",
                Integer.class, username, campaignId
            );

            if (count != null && count > 0) {
                return new JoinResponse("success", "KOC đã tham gia chiến dịch này từ trước");
            }

            // Ghi nhận KOC tham gia chiến dịch
            jdbcTemplate.update(
                "INSERT INTO campaign_participations (koc_username, campaign_id) VALUES (?, ?)",
                username, campaignId
            );

            return new JoinResponse("success", "Đăng ký tham gia chiến dịch thành công");
        } catch (Exception e) {
            System.err.println("Error joining campaign: " + e.getMessage());
            return new JoinResponse("error", "Lỗi hệ thống: " + e.getMessage());
        }
    }

    /**
     * REST API lưu trữ link tiếp thị của KOC vào CSDL
     */
    @PostMapping("/api/affiliate/shorten")
    @ResponseBody
    public ShortenResponse shortenLink(@RequestBody ShortenRequest request) {
        String originalUrl = request.getOriginalUrl();
        String shortCode = request.getShortCode();
        String campaignId = request.getCampaignId();

        if (originalUrl == null || originalUrl.trim().isEmpty()) {
            return new ShortenResponse("error", "Link gốc không được để trống", null);
        }
        if (shortCode == null || shortCode.trim().isEmpty()) {
            return new ShortenResponse("error", "Short code không được để trống", null);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            // Kiểm tra xem short_code đã tồn tại chưa
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM short_links WHERE short_code = ?",
                Integer.class, shortCode
            );

            if (count != null && count > 0) {
                return new ShortenResponse("success", "Link tiếp thị đã tồn tại từ trước", "localhost:8080/go/" + shortCode);
            }

            // Ghi nhận link rút gọn mới vào bảng short_links
            jdbcTemplate.update(
                "INSERT INTO short_links (short_code, original_url, koc_username, campaign_id) VALUES (?, ?, ?, ?)",
                shortCode, originalUrl, username, (campaignId != null && !campaignId.trim().isEmpty()) ? campaignId : null
            );

            return new ShortenResponse("success", "Tạo link tiếp thị thành công", "localhost:8080/go/" + shortCode);
        } catch (Exception e) {
            System.err.println("Error saving short link: " + e.getMessage());
            return new ShortenResponse("error", "Lỗi hệ thống: " + e.getMessage(), null);
        }
    }

    /**
     * REST API lấy danh sách các link rút gọn đã tạo của KOC đối với chiến dịch cụ thể
     */
    @GetMapping("/api/affiliate/my-links")
    @ResponseBody
    public List<Map<String, Object>> getMyCampaignLinks(@org.springframework.web.bind.annotation.RequestParam String campaignId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return jdbcTemplate.queryForList(
                "SELECT short_code, original_url, created_at FROM short_links WHERE koc_username = ? AND campaign_id = ? ORDER BY created_at DESC",
                username, campaignId
            );
        } catch (Exception e) {
            System.err.println("Error fetching KOC links: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Redirection Engine - Điều hướng và lưu vết click của khách hàng
     */
    @GetMapping("/go/{code}")
    public String redirectShortLink(@PathVariable String code, HttpServletRequest request, HttpServletResponse response) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT original_url, koc_username, campaign_id FROM short_links WHERE short_code = ?",
                code
            );

            if (list.isEmpty()) {
                // Không tìm thấy, redirect về trang tools với thông báo lỗi
                return "redirect:/tools?error=not_found";
            }

            Map<String, Object> row = list.get(0);
            String originalUrl = (String) row.get("original_url");
            String kocUsername = (String) row.get("koc_username");
            String campaignId = (String) row.get("campaign_id");

            // Tìm koc_id từ bảng users qua koc_username
            Integer kocId = null;
            try {
                kocId = jdbcTemplate.queryForObject(
                    "SELECT id FROM users WHERE username = ?",
                    Integer.class, kocUsername
                );
            } catch (Exception e) {
                System.err.println("Error finding koc_id for: " + kocUsername);
            }

            if (kocId != null) {
                // Sinh mã click_id độc nhất
                String clickId = "CLK-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
                
                // Thu thập IP Address (Hỗ trợ X-Forwarded-For)
                String ipAddress = request.getHeader("X-Forwarded-For");
                if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                    ipAddress = request.getRemoteAddr();
                }
                
                // Thu thập User-Agent
                String userAgent = request.getHeader("User-Agent");
                if (userAgent != null && userAgent.length() > 255) {
                    userAgent = userAgent.substring(0, 255);
                }

                // Bảo đảm campaignId hợp lệ (phải có do click_tracking.campaign_id là NOT NULL)
                if (campaignId == null || campaignId.trim().isEmpty()) {
                    try {
                        campaignId = jdbcTemplate.queryForObject(
                            "SELECT id FROM campaigns WHERE status = 'active' LIMIT 1",
                            String.class
                        );
                    } catch (Exception e) {
                        campaignId = "CAM-2026-007";
                    }
                }
                if (campaignId == null) {
                    campaignId = "CAM-2026-007";
                }

                java.sql.Timestamp clickedAt = new java.sql.Timestamp(System.currentTimeMillis());
                java.sql.Timestamp cookieExpiresAt = new java.sql.Timestamp(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000);

                // Ghi log click vào click_tracking trong CSDL
                try {
                    jdbcTemplate.update(
                        "INSERT INTO click_tracking (click_id, koc_id, campaign_id, ip_address, user_agent, clicked_at, cookie_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        clickId, kocId, campaignId, ipAddress, userAgent, clickedAt, cookieExpiresAt
                    );
                    System.out.println("Recorded click log: " + clickId + " for KOC: " + kocUsername);
                } catch (Exception e) {
                    System.err.println("Failed to insert click tracking: " + e.getMessage());
                }

                // Thiết lập 30-day cookie cho KOC (affiliate_koc)
                Cookie kocCookie = new Cookie("affiliate_koc", kocUsername);
                kocCookie.setMaxAge(30 * 24 * 60 * 60);
                kocCookie.setPath("/");
                response.addCookie(kocCookie);

                // Thiết lập 30-day cookie cho Click ID (affiliate_click_id) phục vụ đối soát đơn hàng
                Cookie clickCookie = new Cookie("affiliate_click_id", clickId);
                clickCookie.setMaxAge(30 * 24 * 60 * 60);
                clickCookie.setPath("/");
                response.addCookie(clickCookie);
            }

            // Chuyển hướng 302 về URL sản phẩm gốc
            return "redirect:" + originalUrl;
        } catch (Exception e) {
            System.err.println("Redirection error: " + e.getMessage());
            return "redirect:/tools?error=system";
        }
    }

    // REST DTOs
    public static class ShortenRequest {
        private String originalUrl;
        private String shortCode;
        private String campaignId;

        public String getOriginalUrl() { return originalUrl; }
        public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
        public String getShortCode() { return shortCode; }
        public void setShortCode(String shortCode) { this.shortCode = shortCode; }
        public String getCampaignId() { return campaignId; }
        public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    }

    public static class ShortenResponse {
        private String status;
        private String message;
        private String shortUrl;

        public ShortenResponse(String status, String message, String shortUrl) {
            this.status = status;
            this.message = message;
            this.shortUrl = shortUrl;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getShortUrl() { return shortUrl; }
        public void setShortUrl(String shortUrl) { this.shortUrl = shortUrl; }
    }

    public static class JoinRequest {
        private String campaignId;
        public String getCampaignId() { return campaignId; }
        public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    }

    public static class JoinResponse {
        private String status;
        private String message;

        public JoinResponse(String status, String message) {
            this.status = status;
            this.message = message;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
