package com.affiliate.repository;

import com.affiliate.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhone(String phone); // Hỗ trợ tìm kiếm theo số điện thoại phục vụ đăng nhập
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhone(String phone);
    
    List<User> findByReferredById(Integer referredById);
    
    Optional<User> findByReferralCode(String referralCode);
}
