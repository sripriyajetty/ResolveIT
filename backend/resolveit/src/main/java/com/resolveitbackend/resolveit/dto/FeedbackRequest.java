package com.resolveitbackend.resolveit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FeedbackRequest {

    @JsonProperty("complaint_id")
    private Long complaintId;

    private String message;          // frontend sends "message"

    @JsonProperty("feedback_type")
    private String feedbackType;

    private Integer rating;

    // Getters & Setters
    public Long getComplaintId()       { return complaintId; }
    public void setComplaintId(Long v) { this.complaintId = v; }

    public String getMessage()         { return message; }
    public void setMessage(String v)   { this.message = v; }

    public String getFeedbackType()    { return feedbackType; }
    public void setFeedbackType(String v) { this.feedbackType = v; }

    public Integer getRating()         { return rating; }
    public void setRating(Integer v)   { this.rating = v; }
}