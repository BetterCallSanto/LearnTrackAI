package com.learntrack.repository;

import com.learntrack.model.ShortNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ShortNoteRepository — Spring Data JPA Repository for ShortNote entity.
 * 
 * PRD Reference: Section 7.4 — Short note endpoints.
 */
@Repository
public interface ShortNoteRepository extends JpaRepository<ShortNote, Long> {

    /**
     * Find all short notes for a specific daily log, ordered by display order.
     */
    List<ShortNote> findByDailyLogIdOrderByDisplayOrderAsc(Long logId);

    /**
     * Count the number of short notes in a daily log.
     * Used to set the display_order of new notes.
     */
    int countByDailyLogId(Long logId);

    /**
     * Find all short notes for a list of log IDs.
     * Used by the revision endpoint to fetch all notes for a journey.
     */
    List<ShortNote> findByDailyLogIdInOrderByDailyLogIdAscDisplayOrderAsc(List<Long> logIds);
}
