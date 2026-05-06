package com.learntrack.dao;

import com.learntrack.model.ShortNote;
import com.learntrack.repository.ShortNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ShortNoteDAOImpl — Implementation of ShortNoteDAO interface.
 * 
 * All database operations for ShortNote go through this class.
 */
@Repository
public class ShortNoteDAOImpl implements ShortNoteDAO {

    @Autowired
    private ShortNoteRepository shortNoteRepository;

    @Override
    public ShortNote save(ShortNote note) {
        return shortNoteRepository.save(note);
    }

    @Override
    public List<ShortNote> findByLogId(Long logId) {
        return shortNoteRepository.findByDailyLogIdOrderByDisplayOrderAsc(logId);
    }

    @Override
    public Optional<ShortNote> findById(Long id) {
        return shortNoteRepository.findById(id);
    }

    @Override
    public int countByLogId(Long logId) {
        return shortNoteRepository.countByDailyLogId(logId);
    }

    @Override
    public List<ShortNote> findByLogIds(List<Long> logIds) {
        return shortNoteRepository.findByDailyLogIdInOrderByDailyLogIdAscDisplayOrderAsc(logIds);
    }

    @Override
    public void delete(ShortNote note) {
        shortNoteRepository.delete(note);
    }

    @Override
    public void deleteAllByLogIds(List<Long> logIds) {
        List<ShortNote> notes = shortNoteRepository.findByDailyLogIdInOrderByDailyLogIdAscDisplayOrderAsc(logIds);
        shortNoteRepository.deleteAll(notes);
    }
}
