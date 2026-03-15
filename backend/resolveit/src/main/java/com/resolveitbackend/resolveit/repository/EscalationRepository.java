package com.resolveitbackend.resolveit.repository;

import com.resolveitbackend.resolveit.entity.Escalation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EscalationRepository extends JpaRepository<Escalation, Long> {
    List<Escalation> findByComplaintId(Long complaintId);

    List<Escalation> findByEscalatedBy(Long escalatedBy);

    @Query("SELECT FUNCTION('DATE', e.escalatedAt), COUNT(e) FROM Escalation e WHERE e.escalatedAt BETWEEN :start AND :end GROUP BY FUNCTION('DATE', e.escalatedAt)")
    List<Object[]> countByDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}