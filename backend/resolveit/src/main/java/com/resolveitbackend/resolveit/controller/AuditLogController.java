package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.entity.AuditLog;
import com.resolveitbackend.resolveit.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * GET /api/admin/audit-logs
     * Supports: page, size, action, performedBy, startDate, endDate
     * Returns paginated audit logs sorted by timestamp descending
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "10")   int size,
            @RequestParam(required = false)      String action,
            @RequestParam(required = false)      Long performedBy,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        // Fetch all logs sorted newest first, then filter in-memory
        // (swap to a Specification / @Query if data grows large)
        List<AuditLog> all = auditLogRepository.findAll(
                Sort.by(Sort.Direction.DESC, "timestamp")
        );

        // Apply filters
        List<AuditLog> filtered = all.stream()
                .filter(l -> action      == null || l.getAction().equalsIgnoreCase(action))
                .filter(l -> performedBy == null || performedBy.equals(l.getPerformedBy()))
                .filter(l -> startDate   == null || !l.getTimestamp().isBefore(startDate))
                .filter(l -> endDate     == null || !l.getTimestamp().isAfter(endDate))
                .collect(Collectors.toList());

        // Manual pagination
        int total     = filtered.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex   = Math.min(fromIndex + size, total);
        List<Map<String, Object>> pageContent = filtered.subList(fromIndex, toIndex)
                .stream()
                .map(this::toLogMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content",       pageContent);
        response.put("totalElements", total);
        response.put("totalPages",    (int) Math.ceil((double) total / size));
        response.put("currentPage",   page);
        response.put("pageSize",      size);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/audit-logs/{id}
     * Single log detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getLogById(@PathVariable Long id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));
        return ResponseEntity.ok(toLogMap(log));
    }

    // --- Helper ---
    private Map<String, Object> toLogMap(AuditLog l) {
        Map<String, Object> map = new HashMap<>();
        map.put("id",          l.getId());
        map.put("action",      l.getAction());
        map.put("performedBy", l.getPerformedBy());
        map.put("details",     l.getDetails());
        map.put("timestamp",   l.getTimestamp() != null ? l.getTimestamp().toString() : null);
        return map;
    }
}