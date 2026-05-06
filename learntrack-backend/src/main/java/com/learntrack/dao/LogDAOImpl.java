package com.learntrack.dao;

import com.learntrack.model.DailyLog;
import com.learntrack.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * LogDAOImpl — Implementation of LogDAO interface.
 * 
 * All database operations for DailyLog go through this class.
 */
@Repository
public class LogDAOImpl implements LogDAO {

    @Autowired
    private LogRepository logRepository;

    @Override
    public DailyLog save(DailyLog log) {
        return logRepository.save(log);
    }

    @Override
    public List<DailyLog> findByJourneyId(Long journeyId) {
        return logRepository.findByJourneyIdOrderByDayNumberAsc(journeyId);
    }

    @Override
    public Optional<DailyLog> findById(Long id) {
        return logRepository.findById(id);
    }

    @Override
    public int countByJourneyId(Long journeyId) {
        return logRepository.countByJourneyId(journeyId);
    }

    @Override
    public List<DailyLog> findLogsAfterDayNumber(Long journeyId, int dayNumber) {
        return logRepository.findByJourneyIdAndDayNumberGreaterThanOrderByDayNumberAsc(journeyId, dayNumber);
    }

    @Override
    public void delete(DailyLog log) {
        logRepository.delete(log);
    }
}
