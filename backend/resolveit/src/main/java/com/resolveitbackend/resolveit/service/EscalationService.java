package com.resolveitbackend.resolveit.service;

import com.resolveitbackend.resolveit.dto.EscalationResponse;
import com.resolveitbackend.resolveit.entity.Complaint;
import com.resolveitbackend.resolveit.entity.Escalation;
import com.resolveitbackend.resolveit.entity.User;
import com.resolveitbackend.resolveit.repository.ComplaintRepository;
import com.resolveitbackend.resolveit.repository.EscalationRepository;
import com.resolveitbackend.resolveit.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EscalationService {

        @Autowired
        private EscalationRepository escalationRepository;

        @Autowired
        private ComplaintRepository complaintRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private AssignmentService assignmentService;

        @Autowired
        private AuditLogService auditLogService;

        @Transactional
        public EscalationResponse escalateComplaint(Escalation escalation, Long committeeMemberId) {

                Complaint complaint = complaintRepository.findById(escalation.getComplaintId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Complaint not found with id: " + escalation.getComplaintId()));

                User committeeMember = userRepository.findById(committeeMemberId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Committee member not found with id: " + committeeMemberId));

                boolean isCommittee = committeeMember.getRoles().stream()
                                .anyMatch(role -> role.getName().equals("ROLE_COMMITTEE"));

                if (!isCommittee) {
                        throw new RuntimeException("User is not a committee member");
                }

                complaint.setStatus("ESCALATED");
                complaintRepository.save(complaint);

                escalation.setEscalatedBy(committeeMemberId);
                Escalation saved = escalationRepository.save(escalation);

                // audit log
                auditLogService.log(
                                "ESCALATE",
                                committeeMemberId,
                                Map.of(
                                                "complaintId", escalation.getComplaintId(),
                                                "reason", escalation.getReason(),
                                                "escalatedTo", escalation.getEscalatedTo()));

                return buildEscalationResponse(saved, complaint, committeeMember);
        }

        public List<EscalationResponse> getAllEscalations() {

                List<Escalation> escalations = escalationRepository.findAll();

                return escalations.stream()
                                .map(this::buildEscalationResponse)
                                .collect(Collectors.toList());
        }

        private EscalationResponse buildEscalationResponse(Escalation escalation) {

                Complaint complaint = complaintRepository
                                .findById(escalation.getComplaintId())
                                .orElse(null);

                User escalatedByUser = userRepository
                                .findById(escalation.getEscalatedBy())
                                .orElse(null);

                // escalatedTo is now a String label — no user lookup needed
                return buildEscalationResponse(escalation, complaint, escalatedByUser);
        }

        private EscalationResponse buildEscalationResponse(
                        Escalation escalation,
                        Complaint complaint,
                        User escalatedByUser) {

                EscalationResponse response = new EscalationResponse();

                response.setId(escalation.getId());
                response.setComplaintId(escalation.getComplaintId());
                response.setReason(escalation.getReason());
                response.setEscalatedBy(escalation.getEscalatedBy());
                response.setEscalatedTo(escalation.getEscalatedTo()); // now a String
                response.setEscalatedAt(escalation.getEscalatedAt());

                if (complaint != null) {
                        response.setComplaintTitle(
                                        complaint.getTitle() != null
                                                        ? complaint.getTitle()
                                                        : "Complaint #" + complaint.getId());
                }

                if (escalatedByUser != null) {
                        response.setEscalatedByName(escalatedByUser.getName());
                }

                // escalatedToName can be same as escalatedTo label
                response.setEscalatedToName(escalation.getEscalatedTo());

                return response;
        }

}