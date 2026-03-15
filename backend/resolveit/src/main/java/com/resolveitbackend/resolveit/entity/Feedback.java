package com.resolveitbackend.resolveit.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    @JsonProperty("complaint_id")
    private Long complaintId;

    @Column(name = "user_id", nullable = false)
    @JsonProperty("user_id")
    private Long userId;

    @Column(name = "feedback_text", nullable = false, length = 2000)
    @JsonProperty("feedback_text")
    private String feedbackText;

    @Column(name = "feedback_type")
    @JsonProperty("feedback_type")
    private String feedbackType;

    private Integer rating;

    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}