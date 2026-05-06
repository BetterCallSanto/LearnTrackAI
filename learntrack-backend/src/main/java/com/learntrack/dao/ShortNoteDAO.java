package com.learntrack.dao;

import com.learntrack.model.ShortNote;

import java.util.List;
import java.util.Optional;

/**
 * ShortNoteDAO Interface — Defines all data access operations for ShortNote entity.
 */
public interface ShortNoteDAO {

    ShortNote save(ShortNote note);

    List<ShortNote> findByLogId(Long logId);

    Optional<ShortNote> findById(Long id);

    int countByLogId(Long logId);

    List<ShortNote> findByLogIds(List<Long> logIds);

    void delete(ShortNote note);

    void deleteAllByLogIds(List<Long> logIds);
}
