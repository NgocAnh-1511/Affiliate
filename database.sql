-- ==========================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU AFFILIATE KOC/KOL NETWORK (affiliate_db)
-- Bản nâng cấp cấu trúc DDL & DML hoàn chỉnh hỗ trợ tracking hoa hồng, 
-- phân biệt nguồn đơn hàng và mô hình mạng lưới giới thiệu (Sub-affiliate)
-- Tương thích 100% MySQL / MariaDB
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS affiliate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE affiliate_db;

-- Tắt kiểm tra khóa ngoại để tái lập cấu trúc bảng
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS dispute_attachments;
DROP TABLE IF EXISTS dispute_tickets;
DROP TABLE IF EXISTS payout_requests;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS click_tracking;
DROP TABLE IF EXISTS user_balances;
DROP TABLE IF EXISTS commission_tiers;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS staff_permissions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;


-- ==========================================================================
-- DDL SCHEMA: THIẾT LẬP CẤU TRÚC BẢNG NÂNG CAO
-- ==========================================================================

-- BẢNG 1: THÔNG TIN NGƯỜI DÙNG & MẠNG LƯỚI GIỚI THIỆU (Self-Referencing)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL UNIQUE COMMENT 'Số điện thoại phục vụ đăng nhập',
    avatar VARCHAR(255) DEFAULT 'default_avatar.png',
    cover_image VARCHAR(255) DEFAULT 'default_cover.png',
    address VARCHAR(255) DEFAULT NULL,
    tiktok_link VARCHAR(255) DEFAULT NULL,
    shopee_link VARCHAR(255) DEFAULT NULL,
    facebook_link VARCHAR(255) DEFAULT NULL,
    instagram_link VARCHAR(255) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    bank_account_name VARCHAR(150) DEFAULT NULL,
    bank_account_number VARCHAR(100) DEFAULT NULL,
    role VARCHAR(50) NOT NULL COMMENT 'ADMIN, STAFF, KOL/KOC',
    tier VARCHAR(50) DEFAULT 'basic' COMMENT 'diamond, gold, silver, basic',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, suspended, pending',
    
    -- TRẢ LỜI CÂU HỎI 3: Làm sao biết KOC mới nhập mã giới thiệu của KOC nào?
    -- Cột referred_by_id là khóa ngoại tự liên kết ngược về users.id để biểu diễn quan hệ Nhánh dưới (Sub-affiliate)
    referred_by_id INT DEFAULT NULL, 
    referral_code VARCHAR(50) UNIQUE DEFAULT NULL COMMENT 'Mã giới thiệu riêng của mỗi KOC, ví dụ REF-KOC2026',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- BẢNG 2: VÍ TIỀN & HOA HỒNG TÍCH LŨY CỦA KOC (Wallets & Balances)
-- TRẢ LỜI CÂU HỎI 1: Hoa hồng của mỗi KOL/KOC sẽ được lưu ở bảng nào?
-- Hoa hồng tích lũy và số dư khả dụng dùng để rút tiền sẽ được lưu trữ và tổng hợp tại bảng user_balances này.
CREATE TABLE user_balances (
    koc_id INT PRIMARY KEY,
    available_balance DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Số dư khả dụng có thể rút',
    pending_commission DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Hoa hồng tạm tính đang chờ duyệt đối soát',
    referral_commission DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Tổng hoa hồng nhận thêm từ doanh thu của Sub-affiliates',
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Tổng số tiền đã rút thành công',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (koc_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 3: PHÂN QUYỀN HẠN NHÂN VIÊN NỘI BỘ
CREATE TABLE staff_permissions (
    staff_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (staff_id, permission),
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 4: CHIẾN DỊCH AFFILIATE (CAMPAIGNS)
CREATE TABLE campaigns (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    budget DECIMAL(25, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- BẢNG 5: TỶ LỆ HOA HỒNG THEO HẠNG THÀNH VIÊN
CREATE TABLE commission_tiers (
    id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL,
    tier_key VARCHAR(50) NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    requirement VARCHAR(255) NOT NULL,
    rate_percent INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 6: THEO DÕI LƯỢT CLICK LINK TIẾP THỊ (CLICK TRACKING SYSTEM)
-- TRẢ LỜI CÂU HỎI 2: Đơn hàng mua qua link của KOC làm sao phân biệt của ai?
-- Khi người mua click vào link rút gọn của KOC, hệ thống tạo một mã Click UUID lưu vào cookie trình duyệt người mua.
-- Bảng này ghi vết Click UUID đó thuộc về KOC nào và chiến dịch nào.
CREATE TABLE click_tracking (
    click_id VARCHAR(100) PRIMARY KEY COMMENT 'UUID sinh ra khi click vào link tiếp thị liên kết',
    koc_id INT NOT NULL,
    campaign_id VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cookie_expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (koc_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 7: CHI TIẾT ĐƠN HÀNG PHÁT SINH HOA HỒNG (TRANSACTIONS / ORDERS)
-- TRẢ LỜI CÂU HỎI 2 (Tiếp tục): Phân biệt đơn hàng mua qua link của ai?
-- Khi đơn hàng được mua thành công, webhook từ cửa hàng thương mại điện tử gửi mã Click UUID về hệ thống.
-- Cột click_tracking_id khóa ngoại sẽ ánh xạ chính xác đơn hàng đó được mua qua lượt click link tiếp thị của KOC nào.
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Mã đơn hàng, ví dụ ORD-9021',
    koc_id INT NOT NULL COMMENT 'KOC được hưởng hoa hồng trực tiếp',
    click_tracking_id VARCHAR(100) DEFAULT NULL COMMENT 'Khóa ngoại liên kết bảng click_tracking để xác minh nguồn click',
    campaign_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL COMMENT 'tiktok, shopee, lazada, tiki',
    order_amount DECIMAL(15, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    
    -- HOA HỒNG SUB-AFFILIATE (Chi trả cho Người giới thiệu KOC này - Nhánh trên)
    referrer_payout_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Số tiền trích trả thêm cho người giới thiệu của KOC này (F1)',
    
    transaction_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, approved, rejected',
    FOREIGN KEY (koc_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (click_tracking_id) REFERENCES click_tracking(click_id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- BẢNG 8: YÊU CẦU RÚT TIỀN VÀ ĐỐI SOÁT
CREATE TABLE payout_requests (
    id VARCHAR(50) PRIMARY KEY,
    koc_id INT NOT NULL,
    amount_str VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_logo_class VARCHAR(50) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    request_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (koc_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 9: TICKET KHIẾU NẠI & HỖ TRỢ
CREATE TABLE dispute_tickets (
    id VARCHAR(50) PRIMARY KEY,
    koc_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    request_date VARCHAR(50) NOT NULL,
    replies_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT NOT NULL,
    created_at VARCHAR(50) NOT NULL,
    FOREIGN KEY (koc_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 10: TỆP TIN ĐÍNH KÈM TICKET
CREATE TABLE dispute_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES dispute_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- BẢNG 11: NHẬT KÝ HỆ THỐNG
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    admin_id INT,
    timestamp VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    action_class VARCHAR(50) NOT NULL,
    target_object VARCHAR(255) NOT NULL,
    target_object_id VARCHAR(50) NOT NULL,
    change_detail VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    json_detail TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- ==========================================================================
-- DML DATA: NẠP DỮ LIỆU MẪU ĐỒNG BỘ 100%
-- ==========================================================================

-- --- A. NẠP BẢNG USERS ---
-- Mai Phương (id: 1) đã được mời bởi Admin (id: 1001), có mã giới thiệu là REF-KOC2026.
-- KOC con: Nguyễn Minh Đức (id: 6), Trần Quốc Bảo (id: 7), vv... đều có referred_by_id = 1 (do Mai Phương mời)
INSERT INTO users (id, username, email, password, full_name, phone, avatar, cover_image, address, tiktok_link, shopee_link, facebook_link, instagram_link, bank_name, bank_account_name, bank_account_number, role, tier, status, referred_by_id, referral_code) VALUES
-- Admin & Staff (1001 -> 1004)
(1001, 'nguyenvana', 'nguyenvana@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Nguyễn Văn A', '0901234567', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ADMIN', 'diamond', 'active', NULL, 'REF-ADMIN1001'),
(1002, 'tranthibich', 'tranthibich@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Trần Thị Bịch', '0901234568', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF', 'gold', 'active', NULL, NULL),
(1003, 'lehoangnam', 'lehoangnam@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Lê Hoàng Nam', '0901234569', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF', 'gold', 'active', NULL, NULL),
(1004, 'phamqtung', 'phamqtung@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Phạm Quốc Tùng', '0901234570', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF', 'silver', 'active', NULL, NULL),
-- KOC Gốc (Mai Phương - Đầy đủ thông tin hoạt động thực tế như bản vẽ thiết kế)
(1, 'maiphuong.official', 'maiphuong@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Mai Phương', '0987654321', 'profile_avatar.png', 'profile_cover.png', 'Gò Vấp, TP. Hồ Chí Minh', 'https://tiktok.com/@koc_khampha', 'https://shopee.vn/maiphuong.store', NULL, NULL, 'Vietcombank', 'Mai Phương', '**** **** 1234', 'KOL/KOC', 'diamond', 'active', 1001, 'REF-KOC2026'),
-- KOC con (Được mời bởi Mai Phương - id: 1) - Mặc định để trống thông tin cá nhân bổ sung, chờ đăng nhập vào tự điền
(6, 'duc.review', 'duc.review@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Nguyễn Minh Đức', '0912345678', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC006'),
(7, 'bao.store', 'bao.store@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Trần Quốc Bảo', '0912345679', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC007'),
(8, 'huong.unbox', 'huong.unbox@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Phạm Thu Hương', '0912345680', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC008'),
(9, 'nam.tech', 'nam.tech@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Lê Hoàng Nam KOC', '0912345681', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC009'),
(10, 'vy.beauty', 'vy.beauty@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Vũ Thảo Vy', '0912345682', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC010'),
(11, 'khoa.gaming', 'khoa.gaming@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Đỗ Anh Khoa', '0912345683', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', 1, 'REF-KOC011'),
-- Các KOC độc lập khác
(2, 'ducanh.review', 'ducanh@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Đức Anh', '0912345684', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'gold', 'active', NULL, NULL),
(3, 'vythao.beauty', 'vythao@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Thảo Vy', '0912345685', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', NULL, NULL),
(4, 'huy.fitlife', 'quanghuy@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Quang Huy', '0912345686', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'basic', 'suspended', NULL, NULL),
(5, 'linhchi.daily', 'linhchi@koc.vn', '$2a$10$8.2qPhOlNC9W2Fm.l1BKy.23yM2G53.O7.TjG9i3l7oR/m583yvG2', 'Linh Chi', '0912345687', 'default_avatar.png', 'default_cover.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KOL/KOC', 'silver', 'active', NULL, NULL);


-- --- B. NẠP VÍ TIỀN & SỐ DƯ HOA HỒNG USER_BALANCES ---
-- Khởi tạo ví tiền khớp hoàn toàn với số dư của Mai Phương (15,500,000đ và 3,200,000đ từ Sub-affiliate)
INSERT INTO user_balances (koc_id, available_balance, pending_commission, referral_commission, total_withdrawn) VALUES
(1, 15500000.00, 1165000.00, 3200000.00, 25000000.00), -- Mai Phương
(2, 8500000.00, 600000.00, 0.00, 12000000.00),
(3, 4200000.00, 320000.00, 0.00, 5000000.00),
(6, 1200000.00, 180000.00, 0.00, 0.00),
(7, 950000.00, 120000.00, 0.00, 0.00);


-- --- C. NẠP PHÂN QUYỀN HẠN NHÂN VIÊN ---
INSERT INTO staff_permissions (staff_id, permission) VALUES
(1001, 'nav_overview'), (1001, 'nav_users'), (1001, 'nav_campaigns'), (1001, 'nav_tracking'), (1001, 'nav_finance'), (1001, 'nav_disputes'), (1001, 'nav_logs'),
(1002, 'nav_overview'), (1002, 'nav_disputes'),
(1003, 'nav_overview'), (1003, 'nav_campaigns'), (1003, 'nav_tracking');


-- --- D. NẠP CHIẾN DỊCH CAMPAIGNS ---
INSERT INTO campaigns (id, name, duration, budget, status) VALUES
('CAM-2026-007', 'Chiến dịch Thu Đông LSOUL 2026', '01/10/2026 - 31/12/2026', 500000000.00, 'active'),
('CAM-2026-008', 'Dior Beauty Launch', '01/11/2026 - 30/11/2026', 350000000.00, 'active'),
('CAM-2026-009', 'Shopee Tech Campaign', '15/09/2026 - 15/10/2026', 600000000.00, 'active'),
('CAM-2026-010', 'BST LSOUL Mùa Hè', '01/05/2026 - 31/07/2026', 200000000.00, 'completed'),
('CAM-2026-011', 'TikTok Fashion Week', '10/05/2026 - 20/05/2026', 150000000.00, 'completed');


-- --- E. NẠP TỶ LỆ HOA HỒNG CHI TIẾT THEO CẤP HẠNG ---
INSERT INTO commission_tiers (id, campaign_id, tier_key, tier_name, requirement, rate_percent, is_active) VALUES
('T1-CAM007', 'CAM-2026-007', 'diamond', 'Hạng Kim Cương', 'Doanh thu ≥ 100,000,000 VNĐ', 15, 1),
('T2-CAM007', 'CAM-2026-007', 'gold', 'Hạng Vàng', 'Doanh thu ≥ 20,000,000 VNĐ', 12, 1),
('T3-CAM007', 'CAM-2026-007', 'silver', 'Hạng Bạc', 'Doanh thu ≥ 5,000,000 VNĐ', 10, 1),
('T4-CAM007', 'CAM-2026-007', 'basic', 'KOC Mới/Cơ bản', 'Doanh thu < 5,000,000 VNĐ', 8, 1);


-- --- F. NẠP THEO DÕI LƯỢT CLICK LINK TIẾP THỊ (CLICK TRACKING) ---
INSERT INTO click_tracking (click_id, koc_id, campaign_id, ip_address, user_agent, cookie_expires_at) VALUES
('CLK-UUID-9901A', 1, 'CAM-2026-007', '192.168.1.50', 'Mozilla/5.0 Chrome/124.0', '2026-06-24 14:12:00'),
('CLK-UUID-9902B', 1, 'CAM-2026-009', '192.168.1.52', 'Mozilla/5.0 Chrome/124.0', '2026-06-24 11:05:00'),
('CLK-UUID-9903C', 6, 'CAM-2026-007', '113.190.10.15', 'Mozilla/5.0 Chrome/124.0', '2026-06-24 10:00:00'),
('CLK-UUID-9904D', 7, 'CAM-2026-007', '203.113.44.88', 'Mozilla/5.0 Chrome/124.0', '2026-06-24 09:00:00');


-- --- G. NẠP CHI TIẾT ĐƠN HÀNG PHÁT SINH HOA HỒNG (TRANSACTIONS) ---
-- Nguyễn Minh Đức (id: 6 - do Mai Phương mời) phát sinh đơn hàng #ORD-9021.
-- Đơn hàng này mang lại cho Đức 560,000 VNĐ hoa hồng trực tiếp.
-- Đồng thời trích trả cho Mai Phương (referred_by_id = 1) là 56,000 VNĐ hoa hồng Sub-affiliate (F1 - trích 10%)
INSERT INTO transactions (id, koc_id, click_tracking_id, campaign_name, platform, order_amount, commission_rate, commission_amount, referrer_payout_amount, transaction_date, status) VALUES
('#ORD-9021', 6, 'CLK-UUID-9903C', 'BST LSOUL Mùa Hè', 'tiktok', 4600000.00, 12.00, 560000.00, 56000.00, '24/05/2026 14:12', 'approved'),
('#ORD-9020', 7, 'CLK-UUID-9904D', 'Shopee Tech Campaign', 'shopee', 3600000.00, 12.00, 440000.00, 44000.00, '24/05/2026 11:05', 'approved'),
('#ORD-9019', 1, 'CLK-UUID-9901A', 'Lazada Beauty Festival', 'lazada', 1200000.00, 10.00, 120000.00, 0.00, '23/05/2026 21:45', 'approved'),
('#ORD-9018', 1, 'CLK-UUID-9902B', 'Tiki Book Fair', 'tiki', 450000.00, 8.00, 36000.00, 0.00, '23/05/2026 16:30', 'approved');


-- --- H. NẠP YÊU CẦU RÚT TIỀN / ĐỐI SOÁT ---
INSERT INTO payout_requests (id, koc_id, amount_str, amount, bank_name, bank_logo_class, account_number, request_date, status) VALUES
('#WD-8921', 1, '5,000,000 VNĐ', 5000000.00, 'Vietcombank', 'vietcombank', '**** **** **** 1234', '20/05/2024 14:32', 'pending'),
('#WD-8920', 2, '3,200,000 VNĐ', 3200000.00, 'MB Bank', 'mbbank', '**** **** **** 5678', '20/05/2024 11:15', 'pending'),
('#WD-8919', 3, '7,800,000 VNĐ', 7800000.00, 'Techcombank', 'techcombank', '**** **** **** 2468', '20/05/2024 09:45', 'pending');


-- --- I. NẠP YÊU CẦU HỖ TRỢ / KHIẾU NẠI ---
INSERT INTO dispute_tickets (id, koc_id, subject, request_date, replies_count, status, description, created_at) VALUES
('#TK-1042', 1, 'Sai lệch hoa hồng LSOUL', '20/05/2024 14:32', 2, 'pending', 'Chào Admin, Đơn hàng ngày 15/10 của tôi (mã đơn #ORD-2024051500456) báo thành công trên TikTok Shop, nhưng hệ thống Affiliate của KOC vẫn chưa ghi nhận hoa hồng. Vui lòng kiểm tra và hỗ trợ giúp mình. Cảm ơn Admin!', '20/05/2024 14:35'),
('#TK-1041', 2, 'Mất đơn hàng TikTok', '20/05/2024 13:15', 1, 'pending', 'Hệ thống không ghi nhận đơn hàng tôi tạo trong phiên live trưa nay. Đơn hàng trị giá 2.5 triệu đồng mã giao dịch #ORD-TK-7729.', '20/05/2024 13:20');


-- --- J. NẠP TỆP TIN ĐÍNH KÈM TICKET ---
INSERT INTO dispute_attachments (ticket_id, file_path) VALUES
('#TK-1042', 'don-hang-tiktok.jpg'),
('#TK-1042', 'bao-cao-hoa-hong.png');


-- --- K. NẠP NHẬT KÝ HỆ THỐNG ---
INSERT INTO audit_logs (id, admin_id, timestamp, action, action_class, target_object, target_object_id, change_detail, ip_address, json_detail) VALUES
('LOG-20260524-143022-7XK9L', 1001, '24/05/2026 - 14:30:22', 'Cập nhật', 'update', 'Chiến dịch BST LSOUL', 'CAM-2026-007', 'Thay đổi Tỷ lệ hoa hồng từ [10%] thành [12%] Hạng: Hạng Vàng', '113.190.***.***', '{\n  "log_id": "LOG-20260524-143022-7XK9L",\n  "timestamp": "2026-05-24T14:30:22+07:00",\n  "admin_id": "ADM-1001",\n  "admin_name": "Nguyễn Văn A",\n  "action": "UPDATE_COMMISSION_RATE",\n  "module": "CAMPAIGN",\n  "object_id": "CAM-2026-007",\n  "changes": {\n    "old_value": "10%",\n    "new_value": "12%",\n    "field": "commission_rate",\n    "tier": "gold"\n  },\n  "ip_address": "113.190.***.***"\n}'),
('LOG-20260524-142815-9PL2A', 1002, '24/05/2026 - 14:28:15', 'Phê duyệt', 'approve', 'Lệnh rút tiền #WD-123', 'WD-123', 'Phê duyệt lệnh rút tiền số tiền [15,000,000 VNĐ] về tài khoản Vietcombank ****1234', '203.113.***.***', '{\n  "action": "APPROVE_PAYOUT",\n  "payout_id": "WD-123",\n  "amount": "15,000,000 VNĐ",\n  "bank": "Vietcombank"\n}'),
('LOG-20260524-142508-3HG8P', 1003, '24/05/2026 - 14:25:08', 'Cập nhật', 'update', 'Người dùng: @ducanh.review', '2', 'Thay đổi Hạng từ [Hạng Bạc] thành [Hạng Vàng]', '42.118.***.***', '{\n  "action": "UPDATE_KOC_TIER",\n  "user_id": "2",\n  "username": "@ducanh.review",\n  "old_tier": "silver",\n  "new_tier": "gold"\n}'),
('LOG-20260524-142051-5KJ3D', 1004, '24/05/2026 - 14:20:51', 'Xóa', 'delete', 'Chiến dịch Summer Sale', 'CAM-2025-015', 'Xóa chiến dịch [Summer Sale] khỏi hệ thống', '123.25.***.***', '{\n  "action": "DELETE_CAMPAIGN",\n  "campaign_name": "Summer Sale",\n  "campaign_id": "CAM-2025-015"\n}'),
('LOG-20260524-141833-2WE8F', 1001, '24/05/2026 - 14:18:33', 'Cập nhật', 'update', 'Cấu hình hệ thống', 'COMMISSION_SETTINGS', 'Cập nhật mức hoa hồng cơ bản cho Hạng Kim Cương từ [15%] thành [16%]', '113.190.***.***', '{\n  "action": "UPDATE_GLOBAL_COMMISSION",\n  "old_rate": "15%",\n  "new_rate": "16%",\n  "tier": "diamond"\n}'),
('LOG-20260524-141512-8UY9K', 1002, '24/05/2026 - 14:15:12', 'Phê duyệt', 'approve', 'KOC đăng ký mới: @linhchi.daily', '5', 'Phê duyệt tài khoản KOC mới đăng ký và gán Hạng Bạc', '203.113.***.***', '{\n  "action": "APPROVE_KOC_REGISTRATION",\n  "username": "@linhchi.daily",\n  "assigned_tier": "silver"\n}'),
('LOG-20260524-141045-1DF3G', 1003, '24/05/2026 - 14:10:45', 'Xóa', 'delete', 'Bài đăng vi phạm #POST-7781', 'POST-7781', 'Xóa bài đăng vi phạm chính sách (Spam/Quảng cáo sai lệch)', '42.118.***.***', '{\n  "action": "DELETE_VIOLATING_POST",\n  "post_id": "POST-7781",\n  "reason": "SPAM_ADVERTISING"\n}'),
('LOG-20260524-140530-9IU8Y', 1004, '24/05/2026 - 14:05:30', 'Cập nhật', 'delete', 'Người dùng: @huy.fitlife', '4', 'Vô hiệu hóa tài khoản do vi phạm chính sách', '123.25.***.***', '{\n  "action": "SUSPEND_KOC_ACCOUNT",\n  "user_id": "4",\n  "username": "@huy.fitlife",\n  "reason": "POLICY_VIOLATION"\n}');

COMMIT;
