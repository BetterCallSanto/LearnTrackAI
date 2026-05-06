package com.learntrack.controller;

import com.learntrack.exception.BadRequestException;
import com.learntrack.model.Attachment;
import com.learntrack.model.DailyLog;
import com.learntrack.model.User;
import com.learntrack.service.AttachmentService;
import com.learntrack.service.JourneyService;
import com.learntrack.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AttachmentController — CRUD operations for Attachments.
 * 
 * Endpoints:
 *   GET    /api/logs/{logId}/attachments      — Get all attachments for a log
 *   POST   /api/logs/{logId}/attachments      — Add an attachment
 *   DELETE /api/attachments/{attachmentId}    — Delete an attachment
 * 
 * PRD Reference: Section 7.5
 */
@RestController
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private LogService logService;

    @Autowired
    private JourneyService journeyService;

    /**
     * Get all attachments for a daily log.
     */
    @GetMapping("/api/logs/{logId}/attachments")
    public ResponseEntity<List<Map<String, Object>>> getAttachmentsByLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {

        // Verify ownership
        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        List<Attachment> attachments = attachmentService.getAttachmentsByLog(logId);

        List<Map<String, Object>> response = attachments.stream()
                .map(this::buildAttachmentResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Add a new attachment to a daily log.
     * Supports both multipart file uploads and JSON bodies for links.
     */
    @PostMapping(value = "/api/logs/{logId}/attachments", consumes = {"multipart/form-data", "application/json"})
    public ResponseEntity<Map<String, Object>> addAttachment(
            @PathVariable Long logId,
            @RequestParam(value = "attachmentType", required = false) String typeParam,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "linkUrl", required = false) String linkUrl,
            @AuthenticationPrincipal User user) {

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        if (typeParam == null) {
            throw new BadRequestException("attachmentType is required (FILE, IMAGE, LINK, YOUTUBE)");
        }

        Attachment.AttachmentType type;
        try {
            type = Attachment.AttachmentType.valueOf(typeParam.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid attachmentType. Must be FILE, IMAGE, LINK, or YOUTUBE.");
        }

        Attachment attachment;

        if (type == Attachment.AttachmentType.FILE || type == Attachment.AttachmentType.IMAGE) {
            if (file == null || file.isEmpty()) {
                throw new BadRequestException("File is required for FILE and IMAGE attachment types.");
            }
            try {
                attachment = attachmentService.addFileAttachment(log, type, file);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        } else {
            if (linkUrl == null || linkUrl.trim().isEmpty()) {
                throw new BadRequestException("linkUrl is required for LINK and YOUTUBE attachment types.");
            }
            attachment = attachmentService.addLinkAttachment(log, type, linkUrl);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(buildAttachmentResponse(attachment));
    }

    /**
     * Delete an attachment.
     */
    @DeleteMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> buildAttachmentResponse(Attachment att) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", att.getId());
        map.put("attachmentType", att.getAttachmentType().name());
        map.put("fileName", att.getFileName());
        map.put("fileUrl", att.getFileUrl());
        map.put("linkUrl", att.getLinkUrl());
        map.put("createdAt", att.getCreatedAt() != null ? att.getCreatedAt().toString() : null);
        return map;
    }
}
