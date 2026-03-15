package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.entity.AuditLog;
import com.resolveitbackend.resolveit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper; // for JSON conversion

    /**
     * Log an action with details as a Map (converted to JSON)
     */
    public void log(String action, Long performedBy, Map<String, Object> detailsMap) {
        try {
            String details = objectMapper.writeValueAsString(detailsMap);
            AuditLog log = new AuditLog();
            log.setAction(action);
            log.setPerformedBy(performedBy);
            log.setDetails(details);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Logging failure should not break the main flow; just print error
            System.err.println("Failed to save audit log: " + e.getMessage());
        }
    }

    /**
     * Log an action with simple string details
     */
    public void log(String action, Long performedBy, String details) {
        Map<String, Object> map = new HashMap<>();
        map.put("message", details);
        log(action, performedBy, map);
    }

    /**
     * Log an action without details
     */
    public void log(String action, Long performedBy) {
        log(action, performedBy, (String) null);
    }

    // Methods for reports will be added later
}