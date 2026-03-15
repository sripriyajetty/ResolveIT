package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.entity.Role;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.repository.RoleRepository;
import com.resolveitbackend.resolveit.repository.UserRepository;
import com.resolveitbackend.resolveit.service.AuditLogService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.resolveitbackend.resolveit.entity.Assignment;
import com.resolveitbackend.resolveit.entity.Escalation;
import com.resolveitbackend.resolveit.repository.AssignmentRepository;
import com.resolveitbackend.resolveit.repository.EscalationRepository;
import com.resolveitbackend.resolveit.repository.FeedbackRepository;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;
import com.resolveitbackend.resolveit.repository.AuditLogRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private com.resolveitbackend.resolveit.repository.FeedbackRepository feedbackRepository;
    @Autowired
    private AssignmentRepository assignmentRepository;
    @Autowired
    private EscalationRepository escalationRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;
    @Autowired
    private com.resolveitbackend.resolveit.repository.ComplaintRepository complaintRepository;

    // GET /api/admin/feedback — all feedback (admin only)
    @GetMapping("/feedback")
    public ResponseEntity<List<com.resolveitbackend.resolveit.entity.Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAll());
    }

    // GET /api/admin/users — all users
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> result = userRepository.findAll().stream()
                .map(this::toUserMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET /api/admin/users/committee — only ROLE_COMMITTEE users
    @GetMapping("/users/committee")
    public ResponseEntity<List<Map<String, Object>>> getCommitteeMembers() {
        List<Map<String, Object>> result = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream()
                        .anyMatch(r -> r.getName().equals("ROLE_COMMITTEE")))
                .map(this::toUserMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET /api/admin/users/victims — only ROLE_VICTIM users
    @GetMapping("/users/victims")
    public ResponseEntity<List<Map<String, Object>>> getVictims() {
        List<Map<String, Object>> result = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream()
                        .anyMatch(r -> r.getName().equals("ROLE_VICTIM")))
                .map(this::toUserMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // PUT /api/admin/users/{id}/block
    @PutMapping("/users/{id}/block")
    public ResponseEntity<Map<String, Object>> blockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_BLOCKED", id, "User blocked: " + user.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User blocked successfully");
        return ResponseEntity.ok(response);
    }

    // PUT /api/admin/users/{id}/unblock
    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<Map<String, Object>> unblockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(true);
        userRepository.save(user);
        auditLogService.log("USER_UNBLOCKED", id, "User unblocked: " + user.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User unblocked successfully");
        return ResponseEntity.ok(response);
    }

    // DELETE /api/admin/users/{id}
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails currentUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent admin from deleting themselves
        if (user.getEmail().equals(currentUser.getUsername())) {
            Map<String, Object> err = new HashMap<>();
            err.put("message", "You cannot delete your own account");
            return ResponseEntity.badRequest().body(err);
        }

        userRepository.deleteById(id);
        auditLogService.log("USER_DELETED", id, "User deleted: " + user.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    // POST /api/admin/users/committee — create a new committee member
    @PostMapping("/users/committee")
    public ResponseEntity<Map<String, Object>> addCommitteeMember(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");

        if (name == null || email == null || password == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("message", "name, email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        if (userRepository.findByEmail(email).isPresent()) {
            Map<String, Object> err = new HashMap<>();
            err.put("message", "Email already exists");
            return ResponseEntity.badRequest().body(err);
        }

        Role committeeRole = roleRepository.findByName("ROLE_COMMITTEE")
                .orElseThrow(() -> new RuntimeException("ROLE_COMMITTEE not found in DB"));

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setActive(true);
        user.setRoles(java.util.Set.of(committeeRole));

        User saved = userRepository.save(user);
        auditLogService.log("COMMITTEE_MEMBER_ADDED", saved.getId(),
                "Committee member created: " + email);

        return ResponseEntity.ok(toUserMap(saved));
    }

    // --- Helper: convert User entity to Map ---
    private Map<String, Object> toUserMap(User u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("active", u.isActive());
        map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        map.put("roles", u.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList()));
        return map;
    }

    // GET /api/admin/complaints/{id}/history
    // Returns full case history: assignment, escalations, audit logs
    @GetMapping("/complaints/{id}/history")
    public ResponseEntity<Map<String, Object>> getComplaintHistory(@PathVariable Long id) {

        Map<String, Object> history = new HashMap<>();

        // 1. Complaint details
        complaintRepository.findById(id).ifPresent(c -> {
            Map<String, Object> complaintMap = new HashMap<>();
            complaintMap.put("id", c.getId());
            complaintMap.put("title", c.getTitle());
            complaintMap.put("type", c.getType());
            complaintMap.put("status", c.getStatus());
            complaintMap.put("userId", c.getUserId());
            complaintMap.put("description", c.getDescription());
            complaintMap.put("incidentDate", c.getIncidentDate() != null ? c.getIncidentDate().toString() : null);
            complaintMap.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            complaintMap.put("updatedAt", c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
            history.put("complaint", complaintMap);
        });

        // 2. Assignment info
        List<Assignment> assignments = assignmentRepository.findAllByComplaintId(id);
        if (!assignments.isEmpty()) {
            Assignment a = assignments.get(assignments.size() - 1); // most recent
            Map<String, Object> assignMap = new HashMap<>();
            assignMap.put("id", a.getId());
            assignMap.put("committeeMemberId", a.getCommitteeMemberId());
            assignMap.put("assignedAt", a.getAssignedAt() != null ? a.getAssignedAt().toString() : null);
            assignMap.put("notes", a.getNotes());
            assignMap.put("priority", a.getPriority());
            assignMap.put("deadline", a.getDeadline() != null ? a.getDeadline().toString() : null);
            userRepository.findById(a.getCommitteeMemberId())
                    .ifPresent(u -> assignMap.put("committeeMemberName", u.getName()));
            history.put("assignment", assignMap);
        }

        // 3. Escalation history
        List<Map<String, Object>> escalationList = new ArrayList<>();
        escalationRepository.findByComplaintId(id).forEach(e -> {
            Map<String, Object> escMap = new HashMap<>();
            escMap.put("id", e.getId());
            escMap.put("reason", e.getReason());
            escMap.put("escalatedBy", e.getEscalatedBy());
            escMap.put("escalatedTo", e.getEscalatedTo());
            escMap.put("escalatedAt", e.getEscalatedAt() != null ? e.getEscalatedAt().toString() : null);

            // Enrich with escalated-by name
            if (e.getEscalatedBy() != null) {
                userRepository.findById(e.getEscalatedBy()).ifPresent(u -> escMap.put("escalatedByName", u.getName()));
            }
            escalationList.add(escMap);
        });
        history.put("escalations", escalationList);

        // 4. Audit log entries related to this complaint
        List<Map<String, Object>> auditList = new ArrayList<>();
        auditLogRepository.findAll().stream()
                .filter(log -> log.getDetails() != null && log.getDetails().contains("\"complaintId\":" + id))
                .forEach(log -> {
                    Map<String, Object> logMap = new HashMap<>();
                    logMap.put("action", log.getAction());
                    logMap.put("performedBy", log.getPerformedBy());
                    logMap.put("details", log.getDetails());
                    logMap.put("timestamp", log.getTimestamp() != null ? log.getTimestamp().toString() : null);

                    // Enrich with performer name
                    if (log.getPerformedBy() != null) {
                        userRepository.findById(log.getPerformedBy())
                                .ifPresent(u -> logMap.put("performedByName", u.getName()));
                    }
                    auditList.add(logMap);
                });
        history.put("auditLogs", auditList);

        // 5. Feedback
        List<Map<String, Object>> feedbackList = new ArrayList<>();
        feedbackRepository.findByComplaintId(id).forEach(f -> {
            Map<String, Object> fbMap = new HashMap<>();
            fbMap.put("id", f.getId());
            fbMap.put("feedbackText", f.getFeedbackText());
            fbMap.put("feedbackType", f.getFeedbackType());
            fbMap.put("rating", f.getRating());
            fbMap.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : null);
            feedbackList.add(fbMap);
        });
        history.put("feedback", feedbackList);

        return ResponseEntity.ok(history);
    }
}