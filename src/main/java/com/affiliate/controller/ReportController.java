package com.affiliate.controller;

import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Optional;

@Controller
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Hiển thị trang Hỗ trợ & Khiếu nại (Support & Disputes / Report Page).
     * Cung cấp thông tin hồ sơ của người dùng thực tế để hiển thị chính xác ở Header.
     */
    @GetMapping("/report")
    public String showReportPage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);
        } else {
            return "redirect:/login";
        }

        return "report";
    }
}
