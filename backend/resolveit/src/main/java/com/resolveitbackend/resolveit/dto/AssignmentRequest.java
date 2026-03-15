package com.resolveitbackend.resolveit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AssignmentRequest {

    @JsonProperty("complaintId")
    private Long complaintId;

    @JsonProperty("committeeMemberId")
    private Long committeeMemberId;

    @JsonProperty("notes")
    private String notes;

    @JsonProperty("priority")
    private String priority;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonProperty("deadline")
    private LocalDate deadline;
}