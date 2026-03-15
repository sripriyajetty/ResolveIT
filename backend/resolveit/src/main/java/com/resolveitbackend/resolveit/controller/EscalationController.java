package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.dto.EscalationRequest;
import com.resolveitbackend.resolveit.dto.EscalationResponse;
import com.resolveitbackend.resolveit.entity.Escalation;
import com.resolveitbackend.resolveit.service.EscalationService;
import com.resolveitbackend.resolveit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/escalations")
public class EscalationController {

    @Autowired
    private EscalationService escalationService;

    @Autowired
    private UserService userService;

    /**
     * POST /api/escalations
     * Committee member escalates a complaint.
     */
    @PostMapping
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<?> escalateComplaint(@RequestBody EscalationRequest request) {
        try {
            // Get current committee member ID
            Long committeeMemberId = getCurrentUserId();

            // Create escalation entity
            Escalation escalation = new Escalation();
            escalation.setComplaintId(request.getComplaintId());
            escalation.setReason(request.getReason());
            escalation.setEscalatedTo(request.getEscalatedTo());

            // Process escalation
            EscalationResponse response = escalationService.escalateComplaint(escalation, committeeMemberId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * GET /api/escalations
     * Admin views all escalations.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EscalationResponse>> getAllEscalations() {
        List<EscalationResponse> escalations = escalationService.getAllEscalations();
        return ResponseEntity.ok(escalations);
    }

    /**
     * Helper method to retrieve the ID of the currently authenticated user.
     */
    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}