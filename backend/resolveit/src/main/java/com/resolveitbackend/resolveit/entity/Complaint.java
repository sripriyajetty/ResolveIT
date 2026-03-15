package com.resolveitbackend.resolveit.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    @JsonProperty("user_id")
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String type;                // ← ADD THIS (was missing)

    @Column(nullable = false, length = 2000)
    private String description;

    private String status;

    @Column(name = "incident_date")
    @JsonProperty("incident_date")      // ← frontend sends "incident_date"
    private LocalDate incidentDate;

    @CreationTimestamp
    @JsonProperty("created_at")         // ← frontend reads "created_at"
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @JsonProperty("updated_at")         // ← frontend reads "updated_at"
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "pending";   // ← default status
    }
}