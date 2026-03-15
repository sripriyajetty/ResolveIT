package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.entity.Complaint;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.service.ComplaintService;
import com.resolveitbackend.resolveit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> submitComplaint(
            @RequestBody Complaint complaint,
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();

        // get actual user from DB
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        complaint.setUserId(user.getId());

        if (complaint.getDescription() == null) {
            return ResponseEntity.badRequest().body("description is required");
        }

        Complaint saved = complaintService.submitComplaint(complaint);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Complaint>> getComplaintsByUser(@PathVariable Long userId) {
        List<Complaint> complaints = complaintService.getComplaintsByUserId(userId);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Complaint> complaints = complaintService.getComplaintsByUserId(user.getId());

        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint complaint = complaintService.getComplaintById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Security check — users can only view their own complaints
        if (!complaint.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        return ResponseEntity.ok(complaint);
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("hasAnyRole('COMMITTEE', 'ADMIN')")
    public ResponseEntity<?> getComplaintDetail(@PathVariable Long id) {
        return complaintService.getComplaintById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/complaints — admin can fetch all complaints
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        List<Complaint> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(complaints);
    }

    @PutMapping("/{complaintId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long complaintId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            String email = userDetails.getUsername();

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Complaint updated = complaintService.updateStatus(complaintId, status, user.getId());
            return ResponseEntity.ok(updated);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}