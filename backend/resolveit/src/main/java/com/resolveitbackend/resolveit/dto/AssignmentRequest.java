package com.resolveitbackend.resolveit.dto;

import lombok.Data;

@Data
public class AssignmentRequest {
    private Long complaintId;
    private Long committeeMemberId;
}