package com.resolveitbackend.resolveit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EscalationResponse {
    private Long id;
    private Long complaintId;
    private String complaintTitle;      // optional, for frontend
    private String reason;
    private Long escalatedBy;
    private String escalatedByName;     // optional
    private Long escalatedTo;
    private String escalatedToName;     // optional
    private LocalDateTime escalatedAt;
}