package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.entity.Complaint;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Complaint submitComplaint(Complaint complaint) {

        if (complaint.getTitle() == null || complaint.getTitle().isBlank()) {
            throw new RuntimeException("Complaint title is required");
        }

        if (complaint.getDescription() == null || complaint.getDescription().isBlank()) {
            throw new RuntimeException("Complaint description is required");
        }

        if (complaint.getStatus() == null) {
            complaint.setStatus("PENDING");
        }

        Complaint savedComplaint = complaintRepository.save(complaint);

        auditLogService.log(
                "CREATE_COMPLAINT",
                complaint.getUserId(),
                Map.of(
                        "complaintId", savedComplaint.getId(),
                        "title", savedComplaint.getTitle()
                )
        );

        return savedComplaint;
    }

    public List<Complaint> getComplaintsByUserId(Long userId) {
        return complaintRepository.findByUserId(userId);
    }

    public Complaint updateStatus(Long complaintId, String status, Long updatedByUserId) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!List.of("PENDING", "IN_PROGRESS", "RESOLVED").contains(status)) {
            throw new RuntimeException("Invalid complaint status");
        }

        String oldStatus = complaint.getStatus();
        complaint.setStatus(status);

        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(
                "UPDATE_STATUS",
                updatedByUserId,
                Map.of(
                        "complaintId", complaintId,
                        "oldStatus", oldStatus,
                        "newStatus", status
                )
        );

        return saved;
    }

    public Optional<Complaint> getComplaintById(Long id) {
    return complaintRepository.findById(id);
}
}