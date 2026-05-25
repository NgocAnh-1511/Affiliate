package com.affiliate.service;

import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String input) throws UsernameNotFoundException {
        // TRẢ LỜI CÂU HỎI: Hỗ trợ đăng nhập linh hoạt bằng: 1. Username, 2. Email, hoặc 3. Số điện thoại (SĐT)
        User user = userRepository.findByUsername(input)
                .orElseGet(() -> userRepository.findByEmail(input)
                .orElseGet(() -> userRepository.findByPhone(input)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản người dùng tương ứng với: " + input))));

        // Trả về đối tượng UserDetails kế thừa của Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getStatus().equals("active"), // enabled
                true, // accountNonExpired
                true, // credentialsNonExpired
                !user.getStatus().equals("suspended"), // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
