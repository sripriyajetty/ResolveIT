package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.dto.AssignmentResponse;
import com.resolveitbackend.resolveit.entity.Assignment;
import com.resolveitbackend.resolveit.entity.Complaint;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.repository.AssignmentRepository;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;
import com.resolveitbackend.resolveit.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    // Admin assigns a committee member to a complaint
    @Transactional
    public AssignmentResponse assignCommitteeMember(Assignment assignment, Long adminId) {

        Complaint complaint = complaintRepository.findById(assignment.getComplaintId())
                .orElseThrow(() -> new RuntimeException(
                        "Complaint not found with id: " + assignment.getComplaintId()));

        User committeeMember = userRepository.findById(assignment.getCommitteeMemberId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + assignment.getCommitteeMemberId()));

        boolean isCommittee = committeeMember.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_COMMITTEE"));

        if (!isCommittee) {
            throw new RuntimeException("User is not a committee member");
        }

        if (assignmentRepository.existsByComplaintIdAndCommitteeMemberId(
                assignment.getComplaintId(),
                assignment.getCommitteeMemberId())) {

            throw new RuntimeException(
                    "This complaint is already assigned to this committee member");
        }

        // update complaint status
        complaint.setStatus("ASSIGNED");
        complaintRepository.save(complaint);

        // save assignment
        Assignment savedAssignment = assignmentRepository.save(assignment);

        // audit log
        auditLogService.log(
                "ASSIGN",
                adminId,
                Map.of(
                        "complaintId", assignment.getComplaintId(),
                        "committeeMemberId", assignment.getCommitteeMemberId()
                )
        );

        return buildAssignmentResponse(savedAssignment, complaint, committeeMember);
    }

    public List<AssignmentResponse> getAssignmentsByCommitteeMember(Long committeeMemberId) {

        User committeeMember = userRepository.findById(committeeMemberId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + committeeMemberId));

        List<Assignment> assignments =
                assignmentRepository.findByCommitteeMemberId(committeeMemberId);

        return assignments.stream()
                .map(assignment -> {
                    Complaint complaint = complaintRepository
                            .findById(assignment.getComplaintId())
                            .orElse(null);

                    return buildAssignmentResponse(
                            assignment,
                            complaint,
                            committeeMember);
                })
                .collect(Collectors.toList());
    }

    private AssignmentResponse buildAssignmentResponse(
            Assignment assignment,
            Complaint complaint,
            User committeeMember) {

        AssignmentResponse response = new AssignmentResponse();

        response.setId(assignment.getId());
        response.setComplaintId(assignment.getComplaintId());
        response.setCommitteeMemberId(assignment.getCommitteeMemberId());
        response.setAssignedAt(assignment.getAssignedAt());

        if (committeeMember != null) {
            response.setCommitteeMemberName(committeeMember.getName());
        }

        if (complaint != null) {
            response.setComplaintTitle(
                    complaint.getTitle() != null
                            ? complaint.getTitle()
                            : "Complaint #" + complaint.getId());
        }

        return response;
    }

    public Assignment getAssignmentByComplaint(Long complaintId) {
        return assignmentRepository.findByComplaintId(complaintId).orElse(null);
    }

    public boolean isComplaintAssigned(Long complaintId) {
        return assignmentRepository.findByComplaintId(complaintId).isPresent();
    }
}