package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/complaints-by-status")
    public ResponseEntity<Map<String, Long>> getComplaintsByStatus() {
        return ResponseEntity.ok(reportService.getComplaintsByStatus());
    }

    @GetMapping("/escalation-trends")
    public ResponseEntity<Map<LocalDate, Long>> getEscalationTrends(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(reportService.getEscalationTrends(days));
    }

    @GetMapping("/user-activity")
    public ResponseEntity<List<Map<String, Object>>> getUserActivity() {
        return ResponseEntity.ok(reportService.getUserActivity());
    }

    @GetMapping("/action-summary")
    public ResponseEntity<Map<String, Long>> getActionSummary() {
        return ResponseEntity.ok(reportService.getActionTypeSummary());
    }
}