package com.affiliate.config;

import com.affiliate.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Vô hiệu hóa CSRF phục vụ môi trường phát triển local
            .csrf(csrf -> csrf.disable())
            
            // Cấu hình phân quyền truy cập nghiêm ngặt
            .authorizeHttpRequests(auth -> auth
                // Cho phép tất cả mọi người vào trang đăng nhập, đăng ký, trang báo lỗi 403, và tài nguyên tĩnh
                .requestMatchers("/login", "/register", "/403", "/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()
                
                // TRẢ LỜI CÂU HỎI: KOL/KOC không được vào trang admin, chỉ có admin hoặc staff mới được vào
                // Nếu vai trò không khớp, Spring Security tự động ném ra AccessDeniedException và trả lỗi 403
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "STAFF")
                
                // Mọi liên kết còn lại phải xác thực đăng nhập thành công mới được vào
                .anyRequest().authenticated()
            )
            
            // Cấu hình biểu mẫu Đăng nhập và Xử lý Chuyển hướng theo vai trò (Role-based Routing)
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                
                .successHandler((request, response, authentication) -> {
                    var authorities = authentication.getAuthorities();
                    String redirectUrl = "/login";
                    
                    for (var authority : authorities) {
                        String role = authority.getAuthority();
                        
                        if (role.equals("ROLE_KOL/KOC")) {
                            redirectUrl = "/dashboard";
                            break;
                        } else if (role.equals("ROLE_ADMIN") || role.equals("ROLE_STAFF")) {
                            redirectUrl = "/admin/overview";
                            break;
                        }
                    }
                    response.sendRedirect(redirectUrl);
                })
                .failureUrl("/login?error=true")
                .permitAll()
            )
            
            // Cấu hình Đăng xuất
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            
            // TRẢ LỜI CÂU HỎI: Khi gặp lỗi truy cập bất hợp pháp (Access Denied / 403)
            // Spring Security sẽ tự động chuyển hướng về trang /403 tùy chỉnh chuyên nghiệp
            .exceptionHandling(exception -> exception
                .accessDeniedPage("/403")
            );

        http.authenticationProvider(authenticationProvider());
        return http.build();
    }
}
