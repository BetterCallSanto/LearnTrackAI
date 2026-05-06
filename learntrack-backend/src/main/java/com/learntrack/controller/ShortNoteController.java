package com.learntrack.controller;

import com.learntrack.exception.BadRequestException;
import com.learntrack.model.DailyLog;
import com.learntrack.model.ShortNote;
import com.learntrack.model.User;
import com.learntrack.service.JourneyService;
import com.learntrack.service.LogService;
import com.learntrack.service.ShortNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ShortNoteController — CRUD operations for Short Notes.
 * 
 * Endpoints:
 *   GET    /api/logs/{logId}/notes      — Get all notes for a log
 *   POST   /api/logs/{logId}/notes      — Add a new note
 *   PUT    /api/notes/{noteId}          — Update note content
 *   PATCH  /api/notes/{noteId}/revise   — Toggle isRevised status
 *   DELETE /api/notes/{noteId}          — Delete a note
 * 
 * PRD Reference: Section 7.4
 */
@RestController
public class ShortNoteController {

    @Autowired
    private ShortNoteService shortNoteService;

    @Autowired
    private LogService logService;

    @Autowired
    private JourneyService journeyService;

    /**
     * Get all short notes for a daily log.
     */
    @GetMapping("/api/logs/{logId}/notes")
    public ResponseEntity<List<Map<String, Object>>> getNotesByLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {

        // Verify ownership
        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        List<ShortNote> notes = shortNoteService.getNotesByLog(logId);

        List<Map<String, Object>> response = notes.stream()
                .map(this::buildNoteResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Add a new short note to a daily log.
     * Called when the user types a note and presses Enter.
     */
    @PostMapping("/api/logs/{logId}/notes")
    public ResponseEntity<Map<String, Object>> addNote(
            @PathVariable Long logId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Note content cannot be empty");
        }

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        ShortNote note = shortNoteService.addNote(content.trim(), log);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildNoteResponse(note));
    }

    /**
     * Update a note's content (inline editing).
     */
    @PutMapping("/api/notes/{noteId}")
    public ResponseEntity<Map<String, Object>> updateNote(
            @PathVariable Long noteId,
            @RequestBody Map<String, String> body) {

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Note content cannot be empty");
        }

        ShortNote note = shortNoteService.updateNote(noteId, content.trim());
        return ResponseEntity.ok(buildNoteResponse(note));
    }

    /**
     * Toggle the isRevised status of a note.
     * Called when the user checks/unchecks a note in the revision checklist.
     */
    @PatchMapping("/api/notes/{noteId}/revise")
    public ResponseEntity<Map<String, Object>> toggleRevised(@PathVariable Long noteId) {
        ShortNote note = shortNoteService.toggleRevised(noteId);
        return ResponseEntity.ok(buildNoteResponse(note));
    }

    /**
     * Delete a short note.
     */
    @DeleteMapping("/api/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long noteId) {
        shortNoteService.deleteNote(noteId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Build a standardized response for a short note.
     */
    private Map<String, Object> buildNoteResponse(ShortNote note) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", note.getId());
        map.put("content", note.getContent());
        map.put("isRevised", note.getIsRevised());
        map.put("displayOrder", note.getDisplayOrder());
        map.put("createdAt", note.getCreatedAt() != null ? note.getCreatedAt().toString() : null);
        return map;
    }
}
