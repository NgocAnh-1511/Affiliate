package com.affiliate.controller;

import com.affiliate.model.LoginRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    /**
     * Hiển thị trang đăng nhập.
     * Kiểm tra và nạp động thông báo lỗi nếu Spring Security chuyển hướng về với tham số ?error=true
     * hoặc thông báo đăng xuất thành công với ?logout=true
     */
    @GetMapping({"/", "/login"})
    public String showLoginForm(
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model) {
        
        model.addAttribute("loginRequest", new LoginRequest());
        
        if (error != null) {
            model.addAttribute("errorMessage", "Tài khoản hoặc mật khẩu không chính xác, hoặc tài khoản của bạn đang ở trạng thái Chờ duyệt.");
        }
        
        if (logout != null) {
            model.addAttribute("successMessage", "Bạn đã đăng xuất khỏi hệ thống thành công!");
        }
        
        return "login";
    }

    /**
     * Hiển thị trang báo lỗi 403 khi KOL/KOC truy cập trái phép phân hệ Admin.
     */
    @GetMapping("/403")
    public String accessDenied() {
        return "403";
    }
}
