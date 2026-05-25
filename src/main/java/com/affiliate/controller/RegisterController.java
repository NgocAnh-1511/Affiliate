package com.affiliate.controller;

import com.affiliate.model.RegisterRequest;
import com.affiliate.model.User;
import com.affiliate.model.UserBalance;
import com.affiliate.repository.UserRepository;
import com.affiliate.repository.UserBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import java.math.BigDecimal;

@Controller
public class RegisterController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBalanceRepository userBalanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Hiển thị trang đăng ký tài khoản.
     * Cung cấp đối tượng RegisterRequest rỗng để liên kết form binding với Thymeleaf.
     */
    @GetMapping("/register")
    public String showRegisterForm(Model model) {
        model.addAttribute("registerRequest", new RegisterRequest());
        return "register";
    }

    /**
     * Xử lý dữ liệu biểu mẫu gửi lên khi đăng ký tài khoản KOC mới.
     * Thực hiện kiểm tra 6 bộ ràng buộc validate khắt khe từ phía Server:
     * 1. Email hợp lệ, min=5, max=100, local-part (trước @) tối đa 80 ký tự.
     * 2. Mật khẩu trùng khớp, min=8, max=16, bắt buộc 1 thường, 1 Hoa, 1 ký tự đặc biệt.
     * 3. Số điện thoại bắt buộc 10 số, bắt đầu bằng số 0.
     * 4. Họ và tên viết hoa chữ cái đầu của mỗi từ, tối thiểu 4 ký tự.
     * 5. Đường dẫn mạng xã hội chính phải là URL hợp lệ.
     * 6. Phải tích chọn Đồng ý Điều khoản & Chính sách.
     */
    @PostMapping("/register")
    public String processRegistration(@ModelAttribute("registerRequest") RegisterRequest registerRequest, Model model) {
        
        // --- 1. KIỂM TRA MẬT KHẨU TRÙNG KHỚP & TICK CHỌN ĐIỀU KHOẢN CHÍNH SÁCH ---
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            model.addAttribute("errorMessage", "Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại!");
            return "register";
        }

        if (!registerRequest.isAgreeToTerms()) {
            model.addAttribute("errorMessage", "Bạn phải tích chọn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật mới được đăng ký!");
            return "register";
        }

        // --- 2. RÀNG BUỘC EMAIL: HỢP LỆ, ĐỘ DÀI MIN=5 MAX=100, TRƯỚC @ TỐI ĐA 80 KÝ TỰ ---
        String email = registerRequest.getEmail();
        if (email == null || email.length() < 5 || email.length() > 100) {
            model.addAttribute("errorMessage", "Độ dài địa chỉ Email phải nằm trong khoảng từ 5 đến 100 ký tự!");
            return "register";
        }

        if (!email.matches("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$")) {
            model.addAttribute("errorMessage", "Địa chỉ Email nhập vào không đúng định dạng!");
            return "register";
        }

        String[] emailParts = email.split("@");
        if (emailParts.length > 0 && emailParts[0].length() > 80) {
            model.addAttribute("errorMessage", "Phần tên người dùng đứng trước ký tự @ của email chỉ được phép tối đa 80 ký tự!");
            return "register";
        }

        if (userRepository.existsByEmail(email)) {
            model.addAttribute("errorMessage", "Email này đã được sử dụng trong hệ thống. Vui lòng chọn Email khác!");
            return "register";
        }

        // --- 3. RÀNG BUỘC MẬT KHẨU: ĐỘ DÀI 8-16, 1 THƯỜNG, 1 HOA, 1 ĐẶC BIỆT ---
        String password = registerRequest.getPassword();
        if (password == null || password.length() < 8 || password.length() > 16) {
            model.addAttribute("errorMessage", "Mật khẩu bắt buộc phải có độ dài từ 8 đến 16 ký tự!");
            return "register";
        }

        // Kiểm tra chữ thường, chữ Hoa, ký tự đặc biệt
        String passPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).*$";
        if (!password.matches(passPattern)) {
            model.addAttribute("errorMessage", "Mật khẩu không đủ mạnh! Phải chứa ít nhất: 1 chữ thường, 1 chữ HOA, và 1 ký tự đặc biệt!");
            return "register";
        }

        // --- 4. RÀNG BUỘC SỐ ĐIỆN THOẠI: ĐÚNG 10 SỐ, BẮT ĐẦU BẰNG SỐ 0 ---
        String phone = registerRequest.getPhone();
        if (phone == null || !phone.matches("^0\\d{9}$")) {
            model.addAttribute("errorMessage", "Số điện thoại phải chứa chính xác 10 chữ số và bắt đầu bằng chữ số 0!");
            return "register";
        }

        // --- 5. RÀNG BUỘC HỌ VÀ TÊN: VIẾT HOA CHỮ ĐẦU MỖI TỪ, ĐỘ DÀI >= 4 KÝ TỰ ---
        String fullName = registerRequest.getFullName();
        if (fullName == null || fullName.trim().length() < 4) {
            model.addAttribute("errorMessage", "Họ và tên của bạn phải có độ dài tối thiểu là 4 ký tự!");
            return "register";
        }

        String[] words = fullName.trim().split("\\s+");
        for (String word : words) {
            if (word.isEmpty()) continue;
            char firstChar = word.charAt(0);
            if (!Character.isUpperCase(firstChar)) {
                model.addAttribute("errorMessage", "Họ và tên không hợp lệ! Bắt buộc phải viết hoa chữ cái đầu tiên của mỗi từ (Ví dụ: Hà Ý, Nguyễn Văn A)!");
                return "register";
            }
        }

        // --- 6. RÀNG BUỘC ĐƯỜNG DẪN MXH CHÍNH: URL HỢP LỆ ---
        String socialLink = registerRequest.getSocialChannelLink();
        String urlPattern = "^(https?|ftp|file)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]$";
        if (socialLink == null || !socialLink.matches(urlPattern)) {
            model.addAttribute("errorMessage", "Đường dẫn kênh mạng xã hội chính phải là một liên kết URL hợp lệ (bắt đầu bằng http:// hoặc https://)!");
            return "register";
        }

        // --- 7. LƯU THÔNG TIN ĐĂNG KÝ VÀO CƠ SỞ DỮ LIỆU & MÃ HÓA BẬT BẬT BCRYPT ---
        try {
            // Sinh mã Username duy nhất dựa trên tiền tố Email
            String username = emailParts[0];
            if (userRepository.existsByUsername(username)) {
                username = username + "_" + (int)(Math.random() * 1000);
            }

            // Sinh mã giới thiệu ngẫu nhiên dạng REF-KOCxxxx cho người dùng mới
            String referralCode = "REF-KOC" + (1000 + (int)(Math.random() * 9000));

            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            // Mã hóa mật khẩu bằng BCrypt an toàn tuyệt đối đáp ứng yêu cầu
            newUser.setPassword(passwordEncoder.encode(password));
            newUser.setFullName(fullName);
            newUser.setPhone(phone);
            newUser.setRole("KOL/KOC");
            newUser.setTier("basic");
            newUser.setStatus("pending");
            newUser.setReferralCode(referralCode);

            // Lưu người dùng
            User savedUser = userRepository.save(newUser);

            // Khởi tạo ví tiền số dư rỗng cho KOC mới tương ứng koc_id
            UserBalance newBalance = new UserBalance();
            newBalance.setKocId(savedUser.getId());
            newBalance.setAvailableBalance(BigDecimal.ZERO);
            newBalance.setPendingCommission(BigDecimal.ZERO);
            newBalance.setReferralCommission(BigDecimal.ZERO);
            newBalance.setTotalWithdrawn(BigDecimal.ZERO);
            
            userBalanceRepository.save(newBalance);

            // Trả về thông báo thành công
            model.addAttribute("successMessage", "Chúc mừng đối tác KOC [" + fullName + "] đã đăng ký thành công! Vui lòng quay lại trang Đăng nhập.");
            // Reset đối tượng biểu mẫu rỗng
            model.addAttribute("registerRequest", new RegisterRequest());
            
        } catch (Exception e) {
            model.addAttribute("errorMessage", "Hệ thống gặp sự cố không thể xử lý đăng ký lúc này. Chi tiết: " + e.getMessage());
        }

        return "register";
    }
}
