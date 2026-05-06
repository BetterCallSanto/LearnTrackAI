package com.learntrack.repository;

import com.learntrack.model.DailyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * LogRepository — Spring Data JPA Repository for DailyLog entity.
 * 
 * PRD Reference: Section 7.3 — Daily log endpoints.
 */
@Repository
public interface LogRepository extends JpaRepository<DailyLog, Long> {

    /**
     * Find all daily logs for a specific journey, ordered by day number.
     */
    List<DailyLog> findByJourneyIdOrderByDayNumberAsc(Long journeyId);

    /**
     * Count the number of logs in a journey.
     * Used to auto-assign the next day number when creating a new log.
     */
    int countByJourneyId(Long journeyId);

    /**
     * Find all logs in a journey with a day number greater than the given value.
     * Used for renumbering after a log is deleted.
     */
    List<DailyLog> findByJourneyIdAndDayNumberGreaterThanOrderByDayNumberAsc(Long journeyId, int dayNumber);
}
