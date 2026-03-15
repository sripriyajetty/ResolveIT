package com.resolveitbackend.resolveit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentResponse {
    private Long id;
    private Long complaintId;
    private Long committeeMemberId;
    private String committeeMemberName; // optional, for better UX
    private String complaintTitle;      // optional, for better UX
    private LocalDateTime assignedAt;
}