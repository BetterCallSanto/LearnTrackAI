package com.learntrack.service;

import com.learntrack.dao.ShortNoteDAO;
import com.learntrack.exception.ResourceNotFoundException;
import com.learntrack.model.DailyLog;
import com.learntrack.model.ShortNote;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ShortNoteService — Business logic for Short Note operations.
 * 
 * Handles CRUD operations for short notes and the revision toggle
 * (marking notes as revised/un-revised for the revision checklist).
 * 
 * PRD Reference: Section 7.4, Section 8.5.3, Section 8.6
 */
@Service
public class ShortNoteService {

    @Autowired
    private ShortNoteDAO shortNoteDAO;

    /**
     * Get all short notes for a specific daily log, ordered by display order.
     */
    public List<ShortNote> getNotesByLog(Long logId) {
        return shortNoteDAO.findByLogId(logId);
    }

    /**
     * Add a new short note to a daily log.
     * 
     * Display order is auto-set to (count of existing notes + 1).
     * This is called when the user types a note and presses Enter.
     * 
     * PRD Reference: Section 8.5.3, Step 3
     */
    public ShortNote addNote(String content, DailyLog dailyLog) {
        int nextOrder = shortNoteDAO.countByLogId(dailyLog.getId()) + 1;

        ShortNote note = ShortNote.builder()
                .dailyLog(dailyLog)
                .content(content)
                .isRevised(false)
                .displayOrder(nextOrder)
                .build();

        return shortNoteDAO.save(note);
    }

    /**
     * Update a short note's content (inline editing).
     */
    public ShortNote updateNote(Long noteId, String content) {
        ShortNote note = shortNoteDAO.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Short note not found with ID: " + noteId));

        note.setContent(content);
        return shortNoteDAO.save(note);
    }

    /**
     * Toggle the isRevised status of a short note.
     * 
     * If the note is currently un-revised, mark it as revised.
     * If the note is currently revised, mark it as un-revised.
     * Called when the user checks/unchecks a note in the revision checklist.
     * 
     * PRD Reference: Section 8.6.3, Steps 2-3
     */
    public ShortNote toggleRevised(Long noteId) {
        ShortNote note = shortNoteDAO.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Short note not found with ID: " + noteId));

        // Toggle the boolean
        note.setIsRevised(!note.getIsRevised());
        return shortNoteDAO.save(note);
    }

    /**
     * Delete a short note.
     */
    public void deleteNote(Long noteId) {
        ShortNote note = shortNoteDAO.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Short note not found with ID: " + noteId));
        shortNoteDAO.delete(note);
    }

    /**
     * Get all short notes for a list of log IDs.
     * Used by the revision endpoint to fetch notes grouped by day.
     */
    public List<ShortNote> getNotesByLogIds(List<Long> logIds) {
        return shortNoteDAO.findByLogIds(logIds);
    }

    /**
     * Reset all notes for given log IDs (set isRevised = false).
     * Used by the "Reset All" button on the revision page.
     */
    public void resetAllNotes(List<Long> logIds) {
        List<ShortNote> notes = shortNoteDAO.findByLogIds(logIds);
        for (ShortNote note : notes) {
            note.setIsRevised(false);
            shortNoteDAO.save(note);
        }
    }
}
