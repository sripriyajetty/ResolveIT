package com.resolveitbackend.resolveit.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Data
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long complaintId;

    @Column(nullable = false)
    private Long committeeMemberId;

    @Column(nullable = false)
    private LocalDateTime assignedAt;

    // New fields
    @Column(length = 1000)
    private String notes;

    private String priority;       // "high", "medium", "low"

    private LocalDate deadline;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}