package com.affiliate.controller;

import com.affiliate.model.User;
import com.affiliate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Controller
public class ReportController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Hiển thị trang Hỗ trợ & Khiếu nại (Support & Disputes / Report Page).
     * Cung cấp thông tin hồ sơ của người dùng thực tế và danh sách ticket lấy từ CSDL.
     */
    @GetMapping("/report")
    public String showReportPage(Model model) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            model.addAttribute("profile", user);

            // Truy vấn CSDL danh sách các ticket khiếu nại của KOC này
            List<Map<String, Object>> tickets = jdbcTemplate.queryForList(
                "SELECT * FROM dispute_tickets WHERE koc_id = ? ORDER BY created_at DESC",
                user.getId()
            );

            // Nạp tệp đính kèm cho từng ticket
            for (Map<String, Object> ticket : tickets) {
                String ticketId = (String) ticket.get("id");
                List<String> attachments = jdbcTemplate.queryForList(
                    "SELECT file_path FROM dispute_attachments WHERE ticket_id = ?",
                    String.class,
                    ticketId
                );
                ticket.put("attachments", attachments);
            }

            model.addAttribute("tickets", tickets);
        } else {
            return "redirect:/login";
        }

        return "report";
    }

    /**
     * API tiếp nhận yêu cầu khiếu nại / hỗ trợ mới từ KOC.
     * Lưu trữ vào bảng dispute_tickets và dispute_attachments trong CSDL MySQL.
     */
    @PostMapping("/api/disputes/create")
    @ResponseBody
    public ResponseEntity<?> createDisputeTicket(@RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }

        User user = userOpt.get();
        String subjectText = payload.get("subjectText");
        String relatedCode = payload.get("relatedCode");
        String description = payload.get("description");
        String fileName = payload.get("fileName");

        if (subjectText == null || subjectText.trim().isEmpty() ||
            relatedCode == null || relatedCode.trim().isEmpty() ||
            description == null || description.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Vui lòng nhập đầy đủ thông tin"));
        }

        // Sinh mã Ticket ngẫu nhiên #TK-XXXX không trùng lặp
        String ticketId;
        boolean duplicate;
        Random random = new Random();
        do {
            ticketId = "#TK-" + String.format("%04d", 1000 + random.nextInt(9000));
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM dispute_tickets WHERE id = ?",
                Integer.class,
                ticketId
            );
            duplicate = (count != null && count > 0);
        } while (duplicate);

        // Lấy thời gian hiện tại
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedDate = now.format(formatter);

        // Chủ đề ghép: "Sai lệch hoa hồng - Mã: #ORD123"
        String displaySubject = subjectText + " - Mã: " + relatedCode;

        try {
            // Chèn ticket mới vào CSDL
            jdbcTemplate.update(
                "INSERT INTO dispute_tickets (id, koc_id, subject, request_date, replies_count, status, description, created_at) " +
                "VALUES (?, ?, ?, ?, 0, 'pending', ?, ?)",
                ticketId,
                user.getId(),
                displaySubject,
                formattedDate,
                description,
                formattedDate
            );

            // Chèn tệp đính kèm nếu có
            if (fileName != null && !fileName.trim().isEmpty()) {
                jdbcTemplate.update(
                    "INSERT INTO dispute_attachments (ticket_id, file_path) VALUES (?, ?)",
                    ticketId,
                    fileName
                );
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Gửi khiếu nại thành công!",
                "ticketId", ticketId,
                "subject", displaySubject,
                "date", formattedDate
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Lỗi hệ thống khi lưu khiếu nại: " + e.getMessage()
            ));
        }
    }

    /**
     * API tải danh sách phản hồi trao đổi của một ticket thuộc sở hữu của KOC đăng nhập.
     */
    @GetMapping("/api/disputes/{id}/replies")
    @ResponseBody
    public ResponseEntity<?> getKocTicketReplies(@PathVariable("id") String ticketId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }

        User user = userOpt.get();

        // Kiểm tra quyền sở hữu ticket (chỉ cho phép chủ nhân của ticket đọc lịch sử chat)
        Integer ownershipCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM dispute_tickets WHERE id = ? AND koc_id = ?",
            Integer.class,
            ticketId,
            user.getId()
        );

        if (ownershipCount == null || ownershipCount == 0) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Bạn không có quyền truy cập ticket này"));
        }

        List<Map<String, Object>> replies = jdbcTemplate.queryForList(
            "SELECT * FROM dispute_replies WHERE ticket_id = ? ORDER BY id ASC",
            ticketId
        );

        return ResponseEntity.ok(replies);
    }

    /**
     * API gửi câu trả lời/tin nhắn phản hồi từ KOC cho ticket khiếu nại của chính họ.
     */
    @PostMapping("/api/disputes/{id}/reply")
    @ResponseBody
    public ResponseEntity<?> replyFromKoc(@PathVariable("id") String ticketId, @RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Chưa đăng nhập"));
        }

        User user = userOpt.get();
        String message = payload.get("message");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Nội dung tin nhắn trống"));
        }

        // Kiểm tra quyền sở hữu ticket và trạng thái (không cho phép gửi tin nhắn vào ticket đã đóng)
        Map<String, Object> ticketInfo;
        try {
            ticketInfo = jdbcTemplate.queryForMap(
                "SELECT koc_id, status FROM dispute_tickets WHERE id = ?",
                ticketId
            );
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Không tìm thấy ticket"));
        }

        int ownerId = ((Number) ticketInfo.get("koc_id")).intValue();
        if (ownerId != user.getId()) {
            return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Bạn không có quyền phản hồi ticket này"));
        }

        String status = (String) ticketInfo.get("status");
        if ("closed".equalsIgnoreCase(status)) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "Không thể gửi tin nhắn vào khiếu nại đã đóng"));
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedDate = now.format(formatter);

        // Lưu câu trả lời của KOC
        jdbcTemplate.update(
            "INSERT INTO dispute_replies (ticket_id, sender, sender_name, message, created_at) VALUES (?, 'koc', ?, ?, ?)",
            ticketId,
            user.getFullName(),
            message,
            formattedDate
        );

        // Cập nhật tăng replies_count
        jdbcTemplate.update(
            "UPDATE dispute_tickets SET replies_count = replies_count + 1 WHERE id = ?",
            ticketId
        );

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Gửi phản hồi thành công",
            "time", formattedDate
        ));
    }
}
