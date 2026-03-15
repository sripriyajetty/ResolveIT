package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.repository.AuditLogRepository;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;
import com.resolveitbackend.resolveit.repository.EscalationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private EscalationRepository escalationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // 1. Complaints by status
    public Map<String, Long> getComplaintsByStatus() {
        List<Object[]> results = complaintRepository.countByStatus(); // need to add this method
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    // 2. Escalation trends (daily counts for last 30 days)
    public Map<LocalDate, Long> getEscalationTrends(int days) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);

        List<Object[]> results = escalationRepository.countByDateBetween(startDate, endDate); // need to add
        return results.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> (Long) row[1]
                ));
    }

    // 3. User activity summary (count of actions per user)
    public List<Map<String, Object>> getUserActivity() {
        List<Object[]> results = auditLogRepository.countByPerformedBy(); // need to add
        return results.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", row[0]);
                    map.put("actionCount", row[1]);
                    // optionally fetch user name
                    return map;
                })
                .collect(Collectors.toList());
    }

    // 4. Action type summary (count of each action)
    public Map<String, Long> getActionTypeSummary() {
        List<Object[]> results = auditLogRepository.countByAction();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
}