package com.learntrack.dao;

import com.learntrack.model.Attachment;

import java.util.List;
import java.util.Optional;

/**
 * AttachmentDAO Interface — Defines all data access operations for Attachment entity.
 */
public interface AttachmentDAO {

    Attachment save(Attachment attachment);

    List<Attachment> findByLogId(Long logId);

    Optional<Attachment> findById(Long id);

    void delete(Attachment attachment);
}
