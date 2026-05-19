package com.learntrack.controller;

import com.learntrack.dto.JourneyRequest;
import com.learntrack.model.DailyLog;
import com.learntrack.model.LearningJourney;
import com.learntrack.model.ShortNote;
import com.learntrack.model.User;
import com.learntrack.service.JourneyService;
import com.learntrack.service.LogService;
import com.learntrack.service.ShortNoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JourneyController — CRUD operations for Learning Journeys.
 * 
 * All endpoints require a valid JWT token (protected).
 * Data is always filtered by the authenticated user's ID.
 * 
 * Endpoints:
 *   GET    /api/journeys         — Get all journeys for the logged-in user
 *   POST   /api/journeys         — Create a new journey
 *   GET    /api/journeys/{id}    — Get a single journey
 *   PUT    /api/journeys/{id}    — Update a journey
 *   DELETE /api/journeys/{id}    — Delete a journey + cascade
 *   GET    /api/journeys/{id}/revision — Get all notes grouped by day for revision
 * 
 * PRD Reference: Section 7.2, Section 7.6
 */
@RestController
@RequestMapping("/api/journeys")
public class JourneyController {

    @Autowired
    private JourneyService journeyService;

    @Autowired
    private LogService logService;

    @Autowired
    private ShortNoteService shortNoteService;

    /**
     * Get all learning journeys for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllJourneys(
            @AuthenticationPrincipal User user) {

        List<LearningJourney> journeys = journeyService.getAllJourneysByUser(user.getId());

        List<Map<String, Object>> response = journeys.stream()
                .map(j -> buildJourneyResponse(j))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new learning journey.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createJourney(
            @Valid @RequestBody JourneyRequest request,
            @AuthenticationPrincipal User user) {

        LearningJourney journey = journeyService.createJourney(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildJourneyResponse(journey));
    }

    /**
     * Get a single journey by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getJourney(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        LearningJourney journey = journeyService.getJourneyByIdAndUser(id, user.getId());
        return ResponseEntity.ok(buildJourneyResponse(journey));
    }

    /**
     * Update a journey's name and/or description.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateJourney(
            @PathVariable Long id,
            @Valid @RequestBody JourneyRequest request,
            @AuthenticationPrincipal User user) {

        LearningJourney journey = journeyService.updateJourney(id, request, user.getId());
        return ResponseEntity.ok(buildJourneyResponse(journey));
    }

    /**
     * Delete a journey and all its logs, notes, and attachments.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJourney(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        journeyService.deleteJourney(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all short notes grouped by day for revision.
     * 
     * Returns a structure with dayGroups, each containing the day number,
     * log date, and all short notes for that day.
     * 
     * PRD Reference: Section 7.6, Section 8.6.2
     */
    @GetMapping("/{journeyId}/revision")
    public ResponseEntity<Map<String, Object>> getRevisionData(
            @PathVariable Long journeyId,
            @AuthenticationPrincipal User user) {

        // Verify the journey belongs to the user
        journeyService.getJourneyByIdAndUser(journeyId, user.getId());

        // Get all logs for this journey
        List<DailyLog> logs = logService.getLogsByJourney(journeyId);

        // Build the revision response grouped by day
        List<Map<String, Object>> dayGroups = new ArrayList<>();

        for (DailyLog log : logs) {
            List<ShortNote> notes = shortNoteService.getNotesByLog(log.getId());

            if (!notes.isEmpty()) {
                Map<String, Object> dayGroup = new LinkedHashMap<>();
                dayGroup.put("logId", log.getId());
                dayGroup.put("dayNumber", log.getDayNumber());
                dayGroup.put("title", log.getTitle());
                dayGroup.put("logDate", log.getLogDate().toString());

                List<Map<String, Object>> notesList = notes.stream()
                        .map(note -> {
                            Map<String, Object> noteMap = new LinkedHashMap<>();
                            noteMap.put("id", note.getId());
                            noteMap.put("content", note.getContent());
                            noteMap.put("isRevised", note.getIsRevised());
                            return noteMap;
                        })
                        .collect(Collectors.toList());

                dayGroup.put("notes", notesList);
                dayGroups.add(dayGroup);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("dayGroups", dayGroups);
        return ResponseEntity.ok(response);
    }

    /**
     * Reset all revision progress for a journey (set all isRevised to false).
     * Used by the "Reset All" button on the revision page.
     */
    @PostMapping("/{journeyId}/revision/reset")
    public ResponseEntity<Map<String, String>> resetRevision(
            @PathVariable Long journeyId,
            @AuthenticationPrincipal User user) {

        // Verify the journey belongs to the user
        journeyService.getJourneyByIdAndUser(journeyId, user.getId());

        // Get all log IDs for this journey
        List<DailyLog> logs = logService.getLogsByJourney(journeyId);
        List<Long> logIds = logs.stream().map(DailyLog::getId).collect(Collectors.toList());

        // Reset all notes
        shortNoteService.resetAllNotes(logIds);

        return ResponseEntity.ok(Map.of("message", "All revision progress has been reset"));
    }

    /**
     * Build a standardized JSON response for a journey.
     */
    private Map<String, Object> buildJourneyResponse(LearningJourney journey) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", journey.getId());
        map.put("name", journey.getName());
        map.put("description", journey.getDescription());
        map.put("daysLogged", logService.countLogsByJourney(journey.getId()));
        map.put("createdAt", journey.getCreatedAt() != null
                ? journey.getCreatedAt().toString() : null);
        map.put("updatedAt", journey.getUpdatedAt() != null
                ? journey.getUpdatedAt().toString() : null);
        return map;
    }
}
