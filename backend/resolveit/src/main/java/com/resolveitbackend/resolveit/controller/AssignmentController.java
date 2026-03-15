package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.dto.AssignmentRequest;
import com.resolveitbackend.resolveit.dto.AssignmentResponse;
import com.resolveitbackend.resolveit.entity.Assignment;
import com.resolveitbackend.resolveit.service.AssignmentService;
import com.resolveitbackend.resolveit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private UserService userService;

    /**
     * POST /api/assignments
     * Admin assigns a committee member to a complaint.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignCommitteeMember(@RequestBody AssignmentRequest request) {
        try {
            // Get current admin ID
            Long adminId = getCurrentUserId();

            // Create assignment entity
            Assignment assignment = new Assignment();
            assignment.setComplaintId(request.getComplaintId());
            assignment.setCommitteeMemberId(request.getCommitteeMemberId());

            // Process assignment
            AssignmentResponse response = assignmentService.assignCommitteeMember(assignment, adminId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * GET /api/assignments/committee/{userId}
     * View assignments for a specific committee member.
     * Committee members can only view their own assignments; admins can view any.
     */
    @GetMapping("/committee/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMITTEE')")
    public ResponseEntity<?> getAssignmentsByCommitteeMember(@PathVariable Long userId) {
        try {
            // Get current logged-in user
            UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            String email = userDetails.getUsername();
            Long currentUserId = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Current user not found"))
                    .getId();

            // Check if current user is an admin
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            // If not admin, ensure they are viewing only their own assignments
            if (!isAdmin && !currentUserId.equals(userId)) {
                return ResponseEntity.status(403)
                        .body("You can only view your own assignments");
            }

            // Fetch assignments
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsByCommitteeMember(userId);
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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