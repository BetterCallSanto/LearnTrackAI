package com.learntrack.controller;

import com.learntrack.dto.LogRequest;
import com.learntrack.model.Attachment;
import com.learntrack.model.DailyLog;
import com.learntrack.model.LearningJourney;
import com.learntrack.model.ShortNote;
import com.learntrack.model.User;
import com.learntrack.service.AttachmentService;
import com.learntrack.service.JourneyService;
import com.learntrack.service.LogService;
import com.learntrack.service.ShortNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * LogController — CRUD operations for Daily Logs.
 * 
 * Endpoints:
 *   GET    /api/journeys/{journeyId}/logs  — Get all logs for a journey
 *   POST   /api/journeys/{journeyId}/logs  — Create a new log
 *   GET    /api/logs/{logId}               — Get a single log with notes + attachments
 *   PUT    /api/logs/{logId}               — Update a log's description
 *   DELETE /api/logs/{logId}               — Delete a log + cascade
 * 
 * PRD Reference: Section 7.3
 */
@RestController
public class LogController {

    @Autowired
    private LogService logService;

    @Autowired
    private JourneyService journeyService;

    @Autowired
    private ShortNoteService shortNoteService;

    @Autowired
    private AttachmentService attachmentService;

    /**
     * Get all daily logs for a journey.
     */
    @GetMapping("/api/journeys/{journeyId}/logs")
    public ResponseEntity<List<Map<String, Object>>> getLogsByJourney(
            @PathVariable Long journeyId,
            @AuthenticationPrincipal User user) {

        // Verify the journey belongs to the user
        journeyService.getJourneyByIdAndUser(journeyId, user.getId());

        List<DailyLog> logs = logService.getLogsByJourney(journeyId);

        List<Map<String, Object>> response = logs.stream()
                .map(this::buildLogSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new daily log for a journey.
     */
    @PostMapping("/api/journeys/{journeyId}/logs")
    public ResponseEntity<Map<String, Object>> createLog(
            @PathVariable Long journeyId,
            @RequestBody LogRequest request,
            @AuthenticationPrincipal User user) {

        LearningJourney journey = journeyService.getJourneyByIdAndUser(journeyId, user.getId());
        DailyLog log = logService.createLog(request, journey);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildLogDetail(log));
    }

    /**
     * Get a single log with all its short notes and attachments.
     */
    @GetMapping("/api/logs/{logId}")
    public ResponseEntity<Map<String, Object>> getLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {

        DailyLog log = logService.getLogById(logId);

        // Verify the journey belongs to the user
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        return ResponseEntity.ok(buildLogDetail(log));
    }

    /**
     * Update a log's description.
     */
    @PutMapping("/api/logs/{logId}")
    public ResponseEntity<Map<String, Object>> updateLog(
            @PathVariable Long logId,
            @RequestBody LogRequest request,
            @AuthenticationPrincipal User user) {

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        DailyLog updatedLog = logService.updateLog(logId, request);
        return ResponseEntity.ok(buildLogDetail(updatedLog));
    }

    /**
     * Delete a log and all its notes and attachments.
     */
    @DeleteMapping("/api/logs/{logId}")
    public ResponseEntity<Void> deleteLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        logService.deleteLog(logId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Build a summary response for a log (used in list views).
     */
    private Map<String, Object> buildLogSummary(DailyLog log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", log.getId());
        map.put("journeyId", log.getJourney().getId());
        map.put("dayNumber", log.getDayNumber());
        map.put("logDate", log.getLogDate().toString());
        map.put("title", log.getTitle());
        map.put("description", log.getDescription());
        map.put("shortNoteCount", shortNoteService.getNotesByLog(log.getId()).size());
        map.put("attachmentCount", attachmentService.getAttachmentsByLog(log.getId()).size());
        map.put("createdAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
        return map;
    }

    /**
     * Build a detailed response for a log (includes notes and attachments).
     */
    private Map<String, Object> buildLogDetail(DailyLog log) {
        Map<String, Object> map = buildLogSummary(log);

        // Add short notes
        List<ShortNote> notes = shortNoteService.getNotesByLog(log.getId());
        List<Map<String, Object>> notesList = notes.stream()
                .map(note -> {
                    Map<String, Object> noteMap = new LinkedHashMap<>();
                    noteMap.put("id", note.getId());
                    noteMap.put("content", note.getContent());
                    noteMap.put("isRevised", note.getIsRevised());
                    noteMap.put("displayOrder", note.getDisplayOrder());
                    return noteMap;
                })
                .collect(Collectors.toList());
        map.put("shortNotes", notesList);

        // Add attachments
        List<Attachment> attachments = attachmentService.getAttachmentsByLog(log.getId());
        List<Map<String, Object>> attachmentsList = attachments.stream()
                .map(att -> {
                    Map<String, Object> attMap = new LinkedHashMap<>();
                    attMap.put("id", att.getId());
                    attMap.put("attachmentType", att.getAttachmentType().name());
                    attMap.put("fileName", att.getFileName());
                    attMap.put("fileUrl", att.getFileUrl());
                    attMap.put("linkUrl", att.getLinkUrl());
                    return attMap;
                })
                .collect(Collectors.toList());
        map.put("attachments", attachmentsList);

        return map;
    }
}
