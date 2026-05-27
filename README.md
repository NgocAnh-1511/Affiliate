# 🚀 KOC/KOL Affiliate Network Platform

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=for-the-badge&logo=springboot)
![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)
![Thymeleaf](https://img.shields.io/badge/Thymeleaf-3.x-darkgreen?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES6+-yellow?style=for-the-badge&logo=javascript)

Hệ thống tiếp thị liên kết (Affiliate Marketing) chuyên nghiệp dành cho mạng lưới **KOC/KOL**, kết nối nhà bán hàng với các nhà sáng tạo nội dung. Dự án được phát triển trên kiến trúc nền tảng **Spring Boot** kết hợp hệ thống giao diện **Vanilla UI Premium** có độ phản hồi cao, bảo mật cao và tương thích hoàn hảo đa thiết bị (RWD).

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân Hệ Dành Cho KOC/KOL
*   **Bảng Điều Khiển Tổng Quan (Dashboard)**: Theo dõi trực quan hiệu quả tiếp thị qua các biểu đồ tương tác về lượt click, đơn hàng, tỷ lệ chuyển đổi và doanh số thực tế (tích hợp **Chart.js**).
*   **Công Cụ Tiếp Thị (Affiliate Tools)**: 
    *   Tự động rút gọn link liên kết (Short Link) kết nối trực tiếp với cổng theo dõi (Tracking API).
    *   Tự động tạo mã QR Code động chất lượng cao dạng **Glassmorphism** phục vụ in ấn hoặc chia sẻ.
*   **Quản Lý Thu Nhập & Đối Soát**: 
    *   Hiển thị minh bạch số dư khả dụng, hoa hồng chờ đối soát, tiền thưởng giới thiệu và lịch sử rút tiền.
    *   Tích hợp liên kết ngân hàng thông minh (Vietcombank, MBBank) và gửi yêu cầu rút tiền tự động.
*   **Lộ Trình Thăng Hạng KOC**: Hệ thống cấp bậc tự động thăng hạng (**Bạc 🥈, Vàng 🏆, Kim Cương 💎, VIP 👑**) dựa trên doanh số thực tế để tăng tỷ lệ hoa hồng đặc quyền.
*   **Mời Bạn Bè (Referral Program)**: Nhận hoa hồng trọn đời từ doanh số của cấp dưới thông qua mã giới thiệu và link giới thiệu độc quyền.

### 2. Phân Hệ Quản Trị Hệ Thống (Admin Portal)
*   **Tổng Quan Quản Trị (Overview)**: Giám sát toàn bộ KPI hệ thống, dòng tiền, số lượng KOC đăng ký mới và biểu đồ doanh số thời gian thực.
*   **Giám Sát Fraud & Tracking (An Toàn Hệ Thống)**:
    *   Theo dõi và cảnh báo gian lận (Fraud Detection): Tự động phát hiện các IP spam click, user-agent đáng ngờ hoặc click ảo liên tục.
    *   Quản lý danh sách các mục tiêu nghi vấn (Suspect Targets) để bảo vệ quyền lợi nhà bán hàng.
*   **Đối Soát & Phê Duyệt Tài Chính**: Quy trình phê duyệt yêu cầu rút tiền thủ công 1 bước chặt chẽ, an toàn, tự động khóa số dư khả dụng khi có yêu cầu đang xử lý.
*   **Quản Lý Chiến Dịch**: Thiết lập chiến dịch sản phẩm mới, cấu hình tỷ lệ hoa hồng phân tầng linh hoạt theo từng hạng KOC.
*   **Nhật Ký Hệ Thống (System Audit Logs)**: 100% lưu trữ và ghi nhận mọi hoạt động nhạy cảm (duyệt tiền, đổi trạng thái, thăng hạng, đổi quyền) dưới dạng nhật ký cơ sở dữ liệu (`audit_logs` table) để phục vụ kiểm toán bảo mật.

---

## 🛠️ Stack Công Nghệ & Kiến Trúc

Hệ thống được thiết kế tối giản thư viện rác, ưu tiên tối đa hiệu năng tải trang và khả năng kiểm soát mã nguồn:

### 1. Backend Stack
*   **Java Core**: JDK 17.
*   **Spring Boot Framework**:
    *   *Spring Boot Web*: Xây dựng RESTful API và MVC Controller.
    *   *Spring Security*: Quản lý bảo mật, phân quyền tài khoản chặt chẽ (**ROLE_KOC** và **ROLE_ADMIN**).
    *   *Spring Data JPA & JdbcTemplate*: Truy vấn dữ liệu hiệu năng cao.
*   **Cơ Sở Dữ Liệu**: MySQL 8.0 phục vụ quan hệ dữ liệu chuẩn hóa.

### 2. Frontend Stack (Premium Vanilla)
*   **Template Engine**: **Thymeleaf** (Phục vụ dịch dữ liệu an toàn phía Server).
*   **Styling**: **Vanilla CSS thuần** sử dụng CSS Variables (Custom Properties), CSS Flexbox và CSS Grid. Tuyệt đối không dùng thư viện CSS nặng nề, mang lại giao diện Glassmorphism độc bản.
*   **Client Logic**: **Vanilla JS (ES6+)** thuần kết hợp cơ chế lắng nghe sự kiện chạm **`touchstart`** tối ưu phản hồi 0ms trên thiết bị di động.
*   **Biểu Đồ**: **Chart.js** (CDN).
*   **Icons & Fonts**: **Inline SVGs** (tải siêu tốc, đổi màu động bằng CSS) & **Plus Jakarta Sans** Google Fonts.

---

## 📱 Thiết Kế Đáp Ứng Đa Thiết Bị (Responsive & Hamburger Menu)
Hệ thống được tối ưu hóa RWD xuất sắc cho cả Máy tính lớn, iPad và Điện thoại di động:
*   **Mobile Hamburger Drawer Menu**: Trên màn hình điện thoại, toàn bộ menu sidebar cồng kềnh tự động thu gọn lại thành một thanh header cao cấp chỉ **`70px`** với nút bấm **☰**.
*   **Hiệu Ứng Biến Hình Hamburger ➜ ✕**: Khi chạm vào, nút menu xoay 90 độ và chuyển mượt mà thành dấu **✕**, đồng thời mở ra ngăn kéo menu phủ kín màn hình cực kỳ nhạy (0ms độ trễ chạm).
*   **Nội Dung Co Giãn Linh Hoạt**: Các grid thống kê 4 cột tự động chuyển thành 1-2 cột đứng, bảng biểu tự động hỗ trợ cuộn ngang tránh tràn màn hình.

---

## 💾 Cấu Hình Cơ Sở Dữ Liệu

Hệ thống sử dụng cơ sở dữ liệu MySQL. Mọi dữ liệu thống kê, biểu đồ, logs và thông số gian lận đều được truy vấn động 100% từ Database.

*   **Tên Database**: `affiliate_db`
*   **Cổng kết nối**: `3306`
*   **Đường dẫn script khởi tạo**: [database.sql](file:///d:/NguyenNgocAnh/Affiliate/database.sql) *(Chứa toàn bộ lược đồ schema và bộ dữ liệu mẫu chuẩn chỉ gồm tài khoản KOL, Admin, Click, Transactions, Logs mẫu)*.

Cấu hình mẫu trong tệp `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/affiliate_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=15112005!Nah
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
```

---

## 🏃‍♂️ Hướng Dẫn Khởi Chạy Ứng Dụng

### Bước 1: Chuẩn bị cơ sở dữ liệu
1.  Mở hệ quản trị cơ sở dữ liệu MySQL của bạn.
2.  Tạo một database mới có tên là `affiliate_db`:
    ```sql
    CREATE DATABASE affiliate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
3.  Import toàn bộ dữ liệu từ tệp `database.sql` vào database vừa tạo:
    ```bash
    mysql -u root -p affiliate_db < database.sql
    ```

### Bước 2: Chạy dự án Spring Boot
Sử dụng công cụ Maven để khởi chạy dự án trực tiếp từ thư mục gốc:
```bash
mvn spring-boot:run
```
Ứng dụng sẽ được khởi động trên cổng mặc định: **`http://localhost:8080`**.

### Bước 3: Đăng nhập trải nghiệm hệ thống
Hệ thống đi kèm sẵn bộ tài khoản mẫu được phân quyền chi tiết trong file sql:
*   **Tài khoản Quản trị viên (Admin)**:
    *   *Username*: `admin`
    *   *Password*: `123456`
*   **Tài khoản KOL/KOC mẫu (Hạng Vàng)**:
    *   *Username*: `koc_gold`
    *   *Password*: `123456`

---

## 📱 Hướng Dẫn Truy Cập Giao Diện Bằng Điện Thoại Di Động
Để kiểm thử trực tiếp giao diện RWD Premium & Hamburger Menu trên smartphone cá nhân:
1.  Kết nối máy tính và điện thoại của bạn vào **cùng một mạng Wi-Fi**.
2.  Mở Command Prompt/PowerShell trên máy tính, gõ lệnh `ipconfig` để tìm địa chỉ IPv4 nội bộ (Ví dụ: `192.168.1.4`).
3.  Mở trình duyệt trên điện thoại và truy cập theo địa chỉ:
    ```text
    http://[Địa_chỉ_IP_máy_tính]:8080
    ```
    *Ví dụ: `http://192.168.1.4:8080`*
4.  Trải nghiệm cảm giác menu mở đóng tức thời không độ trễ chạm vuốt!

---

## 📂 Tổ Chức Thư Mục Mã Nguồn Frontend
```text
src/main/resources/
│
├── templates/                 # Các tệp giao diện Thymeleaf (.html)
│   ├── admin/                 # Giao diện dành cho ban quản trị (Admin Portal)
│   │   ├── nav.html           # Shared Admin Sidebar (Hamburger Menu & JS Toggle)
│   │   ├── overview.html      # Thống kê tổng quan admin
│   │   ├── finance.html       # Tài chính & phê duyệt tiền KOC
│   │   └── ...                # logs, disputes, campaigns, users...
│   │
│   ├── nav.html               # Shared KOC Sidebar (Hamburger Menu & JS Toggle)
│   ├── dashboard.html         # Trang chủ KOC Dashboard
│   ├── tools.html             # Tạo link ngắn, mã QR Code
│   └── ...                    # income, rank, referral, profile, report...
│
└── static/                    # Các tài nguyên tĩnh gửi về Client
    ├── css/                   # Vanilla Stylesheet (dashboard.css, tools.css...)
    ├── js/                    # Vanilla Script tương tác (dashboard.js, tools.js...)
    └── images/                # Banner, avatar mặc định, tài nguyên đồ họa
```

---
*Chúc bạn có những trải nghiệm tiếp thị và lập trình tuyệt vời cùng hệ thống **KOC/KOL Affiliate Network**!*