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
public class RankController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Hiển thị trang Hạng thành viên (Membership Tier / Rank).
     * Cung cấp thông tin hạng của người dùng thực tế nhằm hiển thị chính xác tiến trình thăng hạng.
     */
    @GetMapping("/rank")
    public String showRankPage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);
        } else {
            return "redirect:/login";
        }

        return "rank";
    }
}
