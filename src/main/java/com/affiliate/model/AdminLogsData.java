package com.affiliate.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminLogsData {
    private List<AuditLog> auditLogs;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuditLog {
        private String id; // e.g. "LOG-20260524-143022-7XK9L"
        private String timestamp;
        private String adminName;
        private String adminEmail;
        private String adminAvatar;
        private String action; // "Cập nhật", "Phê duyệt", "Xóa"
        private String actionClass; // "update", "approve", "delete"
        private String targetObject;
        private String targetObjectId;
        private String changeDetail;
        private String ipAddress;
        private String jsonDetail; // Pre-formatted JSON string
    }
}
