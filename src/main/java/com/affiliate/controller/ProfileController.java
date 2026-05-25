package com.affiliate.controller;

import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Controller
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Hiển thị trang thông tin hồ sơ cá nhân (Profile Page).
     * Truy vấn thông tin tài khoản KOL/KOC đang đăng nhập thực tế từ CSDL.
     */
    @GetMapping("/profile")
    public String showProfile(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);
            
            // Xử lý hiển thị thông tin handle/followers TikTok nếu có link
            String tiktokHandle = "@chua_lien_ket";
            String tiktokFollowers = "Chưa liên kết";
            if (user.getTiktokLink() != null && !user.getTiktokLink().isEmpty()) {
                tiktokHandle = "@" + user.getUsername();
                tiktokFollowers = "Đã liên kết";
            }
            model.addAttribute("tiktokHandle", tiktokHandle);
            model.addAttribute("tiktokFollowers", tiktokFollowers);
        } else {
            return "redirect:/login";
        }
        
        return "profile";
    }

    /**
     * Xử lý cập nhật thông tin cá nhân, liên kết mạng xã hội, thông tin thanh toán,
     * và tải lên Avatar/Cover thực tế lưu vào CSDL.
     */
    @PostMapping("/profile/update")
    public String updateProfile(
            @RequestParam("fullName") String fullName,
            @RequestParam("address") String address,
            @RequestParam(value = "tiktokLink", required = false) String tiktokLink,
            @RequestParam(value = "shopeeLink", required = false) String shopeeLink,
            @RequestParam(value = "facebookLink", required = false) String facebookLink,
            @RequestParam(value = "instagramLink", required = false) String instagramLink,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "bankAccountName", required = false) String bankAccountName,
            @RequestParam(value = "bankAccountNumber", required = false) String bankAccountNumber,
            @RequestParam(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestParam(value = "coverFile", required = false) MultipartFile coverFile,
            Model model) {
            
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            try {
                // 1. Cập nhật thông tin cá nhân
                user.setFullName(fullName);
                user.setAddress(address == null || address.trim().isEmpty() ? null : address.trim());
                
                // 2. Cập nhật liên kết MXH
                user.setTiktokLink(tiktokLink == null || tiktokLink.trim().isEmpty() ? null : tiktokLink.trim());
                user.setShopeeLink(shopeeLink == null || shopeeLink.trim().isEmpty() ? null : shopeeLink.trim());
                user.setFacebookLink(facebookLink == null || facebookLink.trim().isEmpty() ? null : facebookLink.trim());
                user.setInstagramLink(instagramLink == null || instagramLink.trim().isEmpty() ? null : instagramLink.trim());
                
                // 3. Cập nhật thông tin thanh toán
                user.setBankName(bankName == null || bankName.trim().isEmpty() ? null : bankName.trim());
                user.setBankAccountName(bankAccountName == null || bankAccountName.trim().isEmpty() ? null : bankAccountName.trim());
                user.setBankAccountNumber(bankAccountNumber == null || bankAccountNumber.trim().isEmpty() ? null : bankAccountNumber.trim());
                
                // 4. Xử lý tải ảnh đại diện (Avatar) thực tế
                if (avatarFile != null && !avatarFile.isEmpty()) {
                    String fileName = "avatar_" + user.getId() + "_" + System.currentTimeMillis() + ".png";
                    String uploadDir = "d:/NguyenNgocAnh/Affiliate/src/main/resources/static/images/";
                    File dest = new File(uploadDir + fileName);
                    
                    // Tạo thư mục nếu chưa tồn tại
                    if (!dest.getParentFile().exists()) {
                        dest.getParentFile().mkdirs();
                    }
                    avatarFile.transferTo(dest);
                    
                    // Copy sang thư mục build target để hiển thị ngay không cần khởi động lại server
                    String targetDir = "d:/NguyenNgocAnh/Affiliate/target/classes/static/images/";
                    File targetDest = new File(targetDir + fileName);
                    if (new File(targetDir).exists()) {
                        Files.copy(dest.toPath(), targetDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    }
                    user.setAvatar(fileName);
                }
                
                // 5. Xử lý tải ảnh bìa (Cover) thực tế
                if (coverFile != null && !coverFile.isEmpty()) {
                    String fileName = "cover_" + user.getId() + "_" + System.currentTimeMillis() + ".png";
                    String uploadDir = "d:/NguyenNgocAnh/Affiliate/src/main/resources/static/images/";
                    File dest = new File(uploadDir + fileName);
                    
                    if (!dest.getParentFile().exists()) {
                        dest.getParentFile().mkdirs();
                    }
                    coverFile.transferTo(dest);
                    
                    String targetDir = "d:/NguyenNgocAnh/Affiliate/target/classes/static/images/";
                    File targetDest = new File(targetDir + fileName);
                    if (new File(targetDir).exists()) {
                        Files.copy(dest.toPath(), targetDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    }
                    user.setCoverImage(fileName);
                }
                
                // Lưu vào CSDL
                userRepository.save(user);
                model.addAttribute("successMessage", "Đã cập nhật thông tin hồ sơ của bạn thành công!");
                
            } catch (Exception e) {
                model.addAttribute("errorMessage", "Gặp sự cố khi lưu ảnh/thông tin hồ sơ: " + e.getMessage());
            }
            
            // Reload lại thông tin
            model.addAttribute("profile", user);
            
            String tiktokHandle = "@chua_lien_ket";
            String tiktokFollowers = "Chưa liên kết";
            if (user.getTiktokLink() != null && !user.getTiktokLink().isEmpty()) {
                tiktokHandle = "@" + user.getUsername();
                tiktokFollowers = "Đã liên kết";
            }
            model.addAttribute("tiktokHandle", tiktokHandle);
            model.addAttribute("tiktokFollowers", tiktokFollowers);
            
        } else {
            return "redirect:/login";
        }
        
        return "profile";
    }
}
