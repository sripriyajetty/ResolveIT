package com.resolveitbackend.resolveit.repository;

import com.resolveitbackend.resolveit.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserId(Long userId);
    boolean existsByComplaintIdAndUserId(Long complaintId, Long userId);
}