package com.resolveitbackend.resolveit.repository;

import com.resolveitbackend.resolveit.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCommitteeMemberId(Long committeeMemberId);
    Optional<Assignment> findByComplaintId(Long complaintId);
    boolean existsByComplaintIdAndCommitteeMemberId(Long complaintId, Long committeeMemberId);
}