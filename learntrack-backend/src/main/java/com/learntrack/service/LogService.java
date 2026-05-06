package com.learntrack.service;

import com.learntrack.dao.LogDAO;
import com.learntrack.dto.LogRequest;
import com.learntrack.exception.ResourceNotFoundException;
import com.learntrack.model.DailyLog;
import com.learntrack.model.LearningJourney;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * LogService — Business logic for Daily Log operations.
 *
 * Features:
 * - Auto-assigns day number on creation (count + 1)
 * - Smart renumbering after deletion: if Day 2 of 5 is deleted,
 *   Days 3,4,5 automatically become Days 2,3,4.
 * - Supports 'title' field per log for topic identification.
 *
 * PRD Reference: Section 7.3, Section 8.5
 */
@Service
public class LogService {

    @Autowired
    private LogDAO logDAO;

    /**
     * Get all daily logs for a specific journey, ordered by day number.
     */
    public List<DailyLog> getLogsByJourney(Long journeyId) {
        return logDAO.findByJourneyId(journeyId);
    }

    /**
     * Get a single daily log by its ID.
     * Throws 404 if the log doesn't exist.
     */
    public DailyLog getLogById(Long logId) {
        return logDAO.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Daily log not found with ID: " + logId));
    }

    /**
     * Create a new daily log entry for the given journey.
     *
     * Day number is auto-calculated: count of existing logs + 1.
     * Log date is set to today's date.
     *
     * PRD Reference: Section 8.5.1
     */
    public DailyLog createLog(LogRequest request, LearningJourney journey) {
        // Auto-assign day number (count of existing logs + 1)
        int nextDayNumber = logDAO.countByJourneyId(journey.getId()) + 1;

        DailyLog log = DailyLog.builder()
                .journey(journey)
                .dayNumber(nextDayNumber)
                .logDate(LocalDate.now())
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        return logDAO.save(log);
    }

    /**
     * Update a daily log's title and description.
     */
    public DailyLog updateLog(Long logId, LogRequest request) {
        DailyLog log = getLogById(logId);
        log.setTitle(request.getTitle());
        log.setDescription(request.getDescription());
        return logDAO.save(log);
    }

    /**
     * Delete a daily log and all its associated short notes and attachments.
     *
     * Smart renumbering scenarios handled:
     * - Delete Day 1 of 3  → Days 2,3 become 1,2
     * - Delete Day 2 of 4  → Days 3,4 become 2,3 (Day 1 unchanged)
     * - Delete last day    → Just remove it, no renumbering needed
     * - Delete only log    → Empty journey, no renumbering needed
     *
     * Cascade delete is handled by JPA (notes + attachments + files).
     */
    @Transactional
    public void deleteLog(Long logId) {
        DailyLog log = getLogById(logId);
        Long journeyId = log.getJourney().getId();
        int deletedDayNumber = log.getDayNumber();

        // Step 1: Delete the log (JPA cascades to notes and attachments)
        logDAO.delete(log);

        // Step 2: Find all logs that came AFTER the deleted one
        List<DailyLog> subsequentLogs = logDAO.findLogsAfterDayNumber(journeyId, deletedDayNumber);

        // Step 3: Decrement each subsequent log's day number by 1
        // This maintains a clean, sequential day numbering (no gaps)
        for (DailyLog subsequentLog : subsequentLogs) {
            subsequentLog.setDayNumber(subsequentLog.getDayNumber() - 1);
            logDAO.save(subsequentLog);
        }
    }

    /**
     * Count the number of logs in a journey.
     */
    public int countLogsByJourney(Long journeyId) {
        return logDAO.countByJourneyId(journeyId);
    }
}
