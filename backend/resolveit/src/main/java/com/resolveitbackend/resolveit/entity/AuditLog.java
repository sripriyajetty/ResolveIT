package com.resolveitbackend.resolveit.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;          // e.g., "LOGIN", "CREATE_COMPLAINT", "UPDATE_STATUS", "ASSIGN", "ESCALATE"

    private Long performedBy;        // user ID who performed the action (nullable for system actions)

    @Column(length = 5000)
    private String details;          // JSON or descriptive text

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}