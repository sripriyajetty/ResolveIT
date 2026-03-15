package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.dto.FeedbackRequest;
import com.resolveitbackend.resolveit.entity.Complaint;
import com.resolveitbackend.resolveit.entity.Feedback;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;
import com.resolveitbackend.resolveit.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    public Feedback submitFeedback(FeedbackRequest request, Long userId) {

        // 1. Complaint must exist and belong to this user
        Complaint complaint = complaintRepository.findById(request.getComplaintId())
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!complaint.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        // 2. Complaint must be RESOLVED
        if (!"RESOLVED".equals(complaint.getStatus())) {
            throw new RuntimeException("Feedback can only be submitted for resolved complaints");
        }

        // 3. Prevent duplicate feedback
        if (feedbackRepository.existsByComplaintIdAndUserId(request.getComplaintId(), userId)) {
            throw new RuntimeException("You have already submitted feedback for this complaint");
        }

        // 4. Map message → feedbackText
        Feedback feedback = new Feedback();
        feedback.setComplaintId(request.getComplaintId());
        feedback.setUserId(userId);
        feedback.setFeedbackText(request.getMessage());   // map message → feedback_text
        feedback.setFeedbackType(request.getFeedbackType());
        feedback.setRating(request.getRating());

        return feedbackRepository.save(feedback);
    }
}