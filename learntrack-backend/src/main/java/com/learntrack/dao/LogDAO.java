package com.learntrack.dao;

import com.learntrack.model.DailyLog;

import java.util.List;
import java.util.Optional;

/**
 * LogDAO Interface — Defines all data access operations for DailyLog entity.
 */
public interface LogDAO {

    DailyLog save(DailyLog log);

    List<DailyLog> findByJourneyId(Long journeyId);

    Optional<DailyLog> findById(Long id);

    int countByJourneyId(Long journeyId);

    /**
     * Find all logs in a journey with dayNumber greater than the given value.
     * Used to renumber remaining logs after one is deleted.
     */
    List<DailyLog> findLogsAfterDayNumber(Long journeyId, int dayNumber);

    void delete(DailyLog log);
}
