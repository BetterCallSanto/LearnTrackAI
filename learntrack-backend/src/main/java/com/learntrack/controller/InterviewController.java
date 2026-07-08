package com.learntrack.controller;

import com.learntrack.model.LearningJourney;
import com.learntrack.model.User;
import com.learntrack.service.InterviewService;
import com.learntrack.service.JourneyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * InterviewController — AI-powered mock interview chat endpoint.
 *
 * Proxies conversation messages to the Groq LLM API via InterviewService,
 * with journey-specific context injected into the system prompt.
 *
 * The interviewer persona is "Pam Beesley" — a friendly, professional
 * female interviewer who asks dynamic questions based on the learning
 * journey's topics and short notes.
 *
 * Endpoints:
 *   POST /api/interview/{journeyId}/chat — Send a message and get Pam's reply
 */
@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private JourneyService journeyService;

    /**
     * Chat with Pam Beesley (AI interviewer).
     *
     * Accepts the full conversation history from the frontend, validates
     * journey ownership, and delegates to InterviewService for Groq API call.
     *
     * Request body:
     *   { "messages": [{ "role": "user"|"assistant", "content": "..." }, ...] }
     *
     * Response body:
     *   { "reply": "Pam's response text" }
     */
    @PostMapping("/{journeyId}/chat")
    public ResponseEntity<Map<String, String>> chat(
            @PathVariable Long journeyId,
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal User user) {

        // Verify the journey belongs to the authenticated user
        LearningJourney journey = journeyService.getJourneyByIdAndUser(journeyId, user.getId());

        // Extract messages from the request body
        List<Map<String, String>> messages = (List<Map<String, String>>) requestBody.get("messages");

        if (messages == null || messages.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("reply", "No messages provided."));
        }

        // Get Pam's reply from the Groq LLM
        String reply = interviewService.chat(journey, messages);

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
