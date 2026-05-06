package com.learntrack.repository;

import com.learntrack.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * AttachmentRepository — Spring Data JPA Repository for Attachment entity.
 * 
 * PRD Reference: Section 7.5 — Attachment endpoints.
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /**
     * Find all attachments for a specific daily log.
     */
    List<Attachment> findByDailyLogId(Long logId);
}
