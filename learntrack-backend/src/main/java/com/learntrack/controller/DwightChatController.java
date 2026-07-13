package com.learntrack.controller;

import com.learntrack.dao.DwightMessageRepository;
import com.learntrack.model.DwightMessage;
import com.learntrack.model.User;
import com.learntrack.service.DwightChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dwight")
public class DwightChatController {

    @Autowired
    private DwightMessageRepository messageRepository;

    @Autowired
    private DwightChatService chatService;

    @GetMapping("/history")
    public ResponseEntity<List<DwightMessage>> getHistory(@AuthenticationPrincipal User user) {
        List<DwightMessage> history = messageRepository.findByUserIdOrderByTimestampAsc(user.getId());
        return ResponseEntity.ok(history);
    }

    @PostMapping("/chat")
    @Transactional
    public ResponseEntity<DwightMessage> chat(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String content = body.getOrDefault("message", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Save User Message
        DwightMessage userMessage = DwightMessage.builder()
                .user(user)
                .sender("user")
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();
        messageRepository.save(userMessage);

        // 2. Fetch Full History
        List<DwightMessage> history = messageRepository.findByUserIdOrderByTimestampAsc(user.getId());

        // 3. Call Service
        String replyText = chatService.chat(history, content);

        // 4. Save Dwight Response
        DwightMessage dwightMessage = DwightMessage.builder()
                .user(user)
                .sender("dwight")
                .content(replyText)
                .timestamp(LocalDateTime.now())
                .build();
        DwightMessage savedDwightMessage = messageRepository.save(dwightMessage);

        return ResponseEntity.ok(savedDwightMessage);
    }

    @DeleteMapping("/history")
    @Transactional
    public ResponseEntity<Void> deleteHistory(@AuthenticationPrincipal User user) {
        messageRepository.deleteByUserId(user.getId());
        return ResponseEntity.noContent().build();
    }
}
