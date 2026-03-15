package com.resolveitbackend.resolveit.dto;

import lombok.Data;

@Data
public class EscalationRequest {
    private Long complaintId;
    private String reason;
    private Long escalatedTo;   // optional: user ID to escalate to
}