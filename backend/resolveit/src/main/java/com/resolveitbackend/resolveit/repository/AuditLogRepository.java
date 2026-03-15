package com.resolveitbackend.resolveit.repository;

import com.resolveitbackend.resolveit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByPerformedBy(Long userId);

    List<AuditLog> findByAction(String action);

    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
    List<Object[]> countByAction();

    @Query("SELECT FUNCTION('DATE', a.timestamp), COUNT(a) FROM AuditLog a WHERE a.action = :action GROUP BY FUNCTION('DATE', a.timestamp)")
    List<Object[]> countByActionAndDate(@Param("action") String action);

    @Query("SELECT a.performedBy, COUNT(a) FROM AuditLog a GROUP BY a.performedBy")
    List<Object[]> countByPerformedBy();
}