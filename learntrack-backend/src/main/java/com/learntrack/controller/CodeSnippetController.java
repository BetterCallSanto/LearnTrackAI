package com.learntrack.controller;

import com.learntrack.exception.BadRequestException;
import com.learntrack.model.CodeSnippet;
import com.learntrack.model.DailyLog;
import com.learntrack.model.User;
import com.learntrack.service.CodeSnippetService;
import com.learntrack.service.JourneyService;
import com.learntrack.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class CodeSnippetController {

    @Autowired
    private CodeSnippetService codeSnippetService;

    @Autowired
    private LogService logService;

    @Autowired
    private JourneyService journeyService;

    @GetMapping("/api/logs/{logId}/snippets")
    public ResponseEntity<List<Map<String, Object>>> getSnippetsByLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal User user) {

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        List<CodeSnippet> snippets = codeSnippetService.getSnippetsByLog(logId);

        List<Map<String, Object>> response = snippets.stream()
                .map(this::buildSnippetResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/logs/{logId}/toggle-snippets")
    public ResponseEntity<Map<String, Object>> toggleSnippets(
            @PathVariable Long logId,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal User user) {

        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            throw new BadRequestException("Enabled status is required");
        }

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        DailyLog updatedLog = codeSnippetService.toggleSnippets(logId, enabled);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", updatedLog.getId());
        response.put("codeSnippetsEnabled", updatedLog.getCodeSnippetsEnabled());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/logs/{logId}/snippets")
    public ResponseEntity<Map<String, Object>> addSnippet(
            @PathVariable Long logId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        String title = (String) body.getOrDefault("title", "Untitled Snippet");
        String language = (String) body.getOrDefault("language", "java");
        String code = (String) body.getOrDefault("code", "");
        Integer editorHeight = body.get("editorHeight") != null ? ((Number) body.get("editorHeight")).intValue() : 300;

        DailyLog log = logService.getLogById(logId);
        journeyService.getJourneyByIdAndUser(log.getJourney().getId(), user.getId());

        CodeSnippet snippet = codeSnippetService.addSnippet(log, title, language, code, editorHeight);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildSnippetResponse(snippet));
    }

    @PutMapping("/api/snippets/{snippetId}")
    public ResponseEntity<Map<String, Object>> updateSnippet(
            @PathVariable Long snippetId,
            @RequestBody Map<String, Object> body) {

        String title = (String) body.get("title");
        String language = (String) body.get("language");
        String code = (String) body.get("code");
        Integer editorHeight = body.get("editorHeight") != null ? ((Number) body.get("editorHeight")).intValue() : null;

        CodeSnippet snippet = codeSnippetService.updateSnippet(snippetId, title, language, code, editorHeight);
        return ResponseEntity.ok(buildSnippetResponse(snippet));
    }

    @DeleteMapping("/api/snippets/{snippetId}")
    public ResponseEntity<Void> deleteSnippet(@PathVariable Long snippetId) {
        codeSnippetService.deleteSnippet(snippetId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> buildSnippetResponse(CodeSnippet snippet) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", snippet.getId());
        map.put("title", snippet.getTitle());
        map.put("language", snippet.getLanguage());
        map.put("code", snippet.getCode());
        map.put("editorHeight", snippet.getEditorHeight());
        map.put("displayOrder", snippet.getDisplayOrder());
        return map;
    }
}
