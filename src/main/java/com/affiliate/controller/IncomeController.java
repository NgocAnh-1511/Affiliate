package com.affiliate.controller;

import com.affiliate.model.Transaction;
import com.affiliate.model.User;
import com.affiliate.model.UserBalance;
import com.affiliate.repository.UserRepository;
import com.affiliate.repository.UserBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Controller
public class IncomeController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBalanceRepository userBalanceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Hiển thị trang Quản lý thu nhập (Income Page).
     * Cung cấp số dư khả dụng và danh sách giao dịch chi tiết thực tế từ CSDL.
     */
    @GetMapping("/income")
    public String showIncomePage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            return "redirect:/login";
        }
        User user = userOpt.get();
        model.addAttribute("profile", user);

        // Nạp số dư thực tế từ bảng user_balances trong CSDL
        Optional<UserBalance> balanceOpt = userBalanceRepository.findById(user.getId());
        UserBalance balance = balanceOpt.orElseGet(() -> {
            UserBalance b = new UserBalance();
            b.setKocId(user.getId());
            return userBalanceRepository.save(b);
        });

        // Định dạng tiền tệ VND đẹp đẽ
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        String formattedAvailable = df.format(balance.getAvailableBalance()) + " VNĐ";
        String formattedPending = df.format(balance.getPendingCommission()) + " VNĐ";

        model.addAttribute("availableBalance", formattedAvailable);
        model.addAttribute("pendingBalance", formattedPending);

        // Truy vấn danh sách giao dịch hoa hồng từ CSDL
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM transactions WHERE koc_id = ? ORDER BY transaction_date DESC",
            user.getId()
        );

        List<Transaction> transactions = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String id = (String) row.get("id");
            String campaignName = (String) row.get("campaign_name");
            String platform = (String) row.get("platform");
            java.math.BigDecimal orderAmount = (java.math.BigDecimal) row.get("order_amount");
            java.math.BigDecimal commissionAmount = (java.math.BigDecimal) row.get("commission_amount");
            String date = (String) row.get("transaction_date");
            String status = (String) row.get("status"); // "pending", "approved", "rejected"

            String viewStatus = "pending";
            String statusText = "Chờ đối soát";
            if ("approved".equalsIgnoreCase(status) || "success".equalsIgnoreCase(status)) {
                viewStatus = "success";
                statusText = "Thành công";
            } else if ("rejected".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) {
                viewStatus = "cancelled";
                statusText = "Hủy";
            }

            transactions.add(new Transaction(
                id,
                campaignName,
                platform,
                df.format(orderAmount) + " VNĐ",
                df.format(commissionAmount) + " VNĐ",
                date,
                viewStatus,
                statusText
            ));
        }

        model.addAttribute("transactions", transactions);
        return "income";
    }

    /**
     * API tải danh sách lịch sử rút tiền thực tế từ CSDL.
     */
    @GetMapping("/api/withdraw/history")
    @ResponseBody
    public ResponseEntity<?> getWithdrawalHistory() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }
        User user = userOpt.get();

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM payout_requests WHERE koc_id = ? ORDER BY request_date DESC",
            user.getId()
        );

        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String id = (String) row.get("id");
            java.math.BigDecimal amount = (java.math.BigDecimal) row.get("amount");
            String bankName = (String) row.get("bank_name");
            String bankLogoClass = (String) row.get("bank_logo_class");
            String accountNumber = (String) row.get("account_number");
            String date = (String) row.get("request_date");
            String status = (String) row.get("status");

            String statusText = "Chờ phê duyệt";
            if ("approved".equalsIgnoreCase(status)) {
                statusText = "Thành công";
            } else if ("rejected".equalsIgnoreCase(status)) {
                statusText = "Hủy";
            }

            list.add(Map.of(
                "id", id,
                "campaign", bankName + " Rút tiền",
                "source", bankLogoClass,
                "amount", df.format(amount) + " VNĐ",
                "fee", "Miễn phí",
                "date", date,
                "status", "approved".equalsIgnoreCase(status) ? "success" : ("rejected".equalsIgnoreCase(status) ? "cancelled" : "pending"),
                "statusText", statusText
            ));
        }

        return ResponseEntity.ok(list);
    }

    /**
     * API tạo yêu cầu rút tiền mới, kiểm tra số dư và trừ tiền khả dụng trong CSDL.
     */
    @PostMapping("/api/withdraw/create")
    @ResponseBody
    public ResponseEntity<?> createWithdrawRequest(@RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }
        User user = userOpt.get();

        String amountStr = payload.get("amount");
        if (amountStr == null || amountStr.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Số tiền không hợp lệ"));
        }

        java.math.BigDecimal amount;
        try {
            amount = new java.math.BigDecimal(amountStr);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Số tiền không hợp lệ"));
        }

        if (amount.compareTo(new java.math.BigDecimal("100000")) < 0) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Hạn mức rút tiền tối thiểu là 100,000 VNĐ một lần giao dịch."));
        }

        // Lấy ví tiền thực tế từ CSDL
        List<Map<String, Object>> balanceRows = jdbcTemplate.queryForList("SELECT * FROM user_balances WHERE koc_id = ?", user.getId());
        if (balanceRows.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Không tìm thấy thông tin ví tiền của KOC"));
        }
        Map<String, Object> balanceRow = balanceRows.get(0);
        java.math.BigDecimal available = (java.math.BigDecimal) balanceRow.get("available_balance");

        if (amount.compareTo(available) > 0) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Số dư khả dụng không đủ để thực hiện yêu cầu này!"));
        }

        // Lấy thông tin tài khoản ngân hàng thụ hưởng từ user profile
        String bankName = user.getBankName();
        String bankAccountNumber = user.getBankAccountNumber();
        String bankAccountName = user.getBankAccountName();

        if (bankName == null || bankName.trim().isEmpty() ||
            bankAccountNumber == null || bankAccountNumber.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Vui lòng liên kết tài khoản ngân hàng thụ hưởng trước khi thực hiện rút tiền!"));
        }

        // Tạo mã yêu cầu rút tiền ngẫu nhiên dạng #WD-8922
        int randomNum = (int) (1000 + Math.random() * 9000);
        String requestId = "#WD-" + randomNum;

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String requestDateStr = now.format(formatter);

        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        String formattedAmount = df.format(amount) + " VNĐ";

        // Trừ số dư khả dụng và cộng dồn số tiền đã rút
        jdbcTemplate.update(
            "UPDATE user_balances SET available_balance = available_balance - ?, total_withdrawn = total_withdrawn + ? WHERE koc_id = ?",
            amount, amount, user.getId()
        );

        // Lưu yêu cầu rút tiền vào bảng payout_requests
        jdbcTemplate.update(
            "INSERT INTO payout_requests (id, koc_id, amount_str, amount, bank_name, bank_logo_class, account_number, request_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
            requestId,
            user.getId(),
            formattedAmount,
            amount,
            bankName,
            bankName.toLowerCase().contains("vietcombank") ? "vcb" : "mbbank",
            bankAccountNumber,
            requestDateStr
        );

        // Ghi nhật ký hoạt động rút tiền
        try {
            String logId = "LOG-" + now.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(10000 + Math.random()*90000);
            String changesJson = String.format("{\n  \"withdrawal_id\": \"%s\",\n  \"amount\": \"%s\",\n  \"bank\": \"%s\"\n}", requestId, formattedAmount, bankName);
            jdbcTemplate.update(
                "INSERT INTO audit_logs (log_id, created_at, admin_name, email, avatar, action_type, badge_class, target_object, object_id, action_description, ip_address, changes_json) VALUES " +
                "(?, ?, ?, ?, ?, 'withdrawal', 'withdrawal', ?, ?, ?, '127.0.0.1', ?)",
                logId, now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm:ss")), user.getFullName(), user.getEmail(), user.getAvatar(), "Rút tiền #" + requestId, requestId, "KOC " + user.getFullName() + " tạo yêu cầu rút tiền " + formattedAmount + " về ngân hàng " + bankName, changesJson
            );
        } catch (Exception e) {
            System.err.println("Warning: Could not write withdrawal log: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Yêu cầu rút tiền thành công",
            "requestId", requestId,
            "amountFormatted", formattedAmount,
            "date", requestDateStr
        ));
    }
}
