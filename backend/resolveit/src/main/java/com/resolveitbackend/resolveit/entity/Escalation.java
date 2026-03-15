package com.resolveitbackend.resolveit.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "escalations")
@Data
public class Escalation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long complaintId;

    @Column(length = 2000)
    private String reason;               // reason for escalation

    @Column(nullable = false)
    private Long escalatedBy;             // ID of committee member who escalated

    private Long escalatedTo;             // optional: ID of person/committee it's escalated to

    @Column(nullable = false)
    private LocalDateTime escalatedAt;

    @PrePersist
    protected void onCreate() {
        escalatedAt = LocalDateTime.now();
    }
}