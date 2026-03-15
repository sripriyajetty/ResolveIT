package com.resolveitbackend.resolveit.controller;

import com.resolveitbackend.resolveit.dto.FeedbackRequest;
import com.resolveitbackend.resolveit.entity.Feedback;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.service.FeedbackService;
import com.resolveitbackend.resolveit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> submitFeedback(
            @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            String email = userDetails.getUsername();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Feedback saved = feedbackService.submitFeedback(request, user.getId());
            return ResponseEntity.ok(saved);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}