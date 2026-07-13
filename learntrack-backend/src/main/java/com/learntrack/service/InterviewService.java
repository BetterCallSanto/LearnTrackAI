package com.learntrack.service;

import com.learntrack.dao.LogDAO;
import com.learntrack.dao.ShortNoteDAO;
import com.learntrack.model.DailyLog;
import com.learntrack.model.LearningJourney;
import com.learntrack.model.ShortNote;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * InterviewService — Business logic for AI-powered mock interviews.
 *
 * Builds a dynamic system prompt from the journey's daily logs and short notes,
 * then proxies the conversation to the Groq LLM API (keeping the API key server-side).
 *
 * The interviewer persona is "Pam Beesley" — a friendly, professional female
 * interviewer who asks topic-specific questions based on the learning journey content.
 *
 * Conversations are ephemeral (not persisted to the database).
 * Model: llama-3.3-70b-versatile (reliable multi-turn, no reasoning overhead).
 */
@Service
public class InterviewService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.model}")
    private String groqModel;

    @Autowired
    private LogDAO logDAO;

    @Autowired
    private ShortNoteDAO shortNoteDAO;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send a chat message to the Groq LLM API with journey-specific context.
     *
     * Builds a system prompt from the journey's logs and notes, prepends it
     * to the user's conversation history, and forwards the full message array
     * to the Groq API. Retries once on empty content before returning a fallback.
     *
     * @param journey  The learning journey providing topic context
     * @param messages The conversation history from the frontend (must start with a user message)
     * @return The assistant's reply text, never null/empty
     */
    public String chat(LearningJourney journey, List<Map<String, String>> messages) {
        if (groqApiKey == null || groqApiKey.trim().isEmpty()) {
            System.err.println("WARNING: groq.api.key is blank. Please set the GROQ_API_KEY environment variable.");
            return "Groq API key is missing. Please configure the GROQ_API_KEY environment variable in your backend application's environment/run settings to enable the AI interview feature.";
        }

        // Build the system prompt with journey context
        String systemPrompt = buildSystemPrompt(journey);

        // Construct the full messages array: system prompt + user conversation
        List<Map<String, String>> fullMessages = new ArrayList<>();
        Map<String, String> systemMessage = new LinkedHashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        fullMessages.add(systemMessage);
        fullMessages.addAll(messages);

        // Try up to 2 times to get a non-empty reply
        for (int attempt = 1; attempt <= 2; attempt++) {
            String result = callGroq(fullMessages, attempt == 2);
            if (result != null && !result.isBlank()) {
                return result;
            }
            System.err.println("InterviewService: empty reply on attempt " + attempt + ", retrying...");
        }

        return "(smiling) Sorry, my thoughts got tangled for a second! Could you repeat that? I'm all ears.";
    }

    /**
     * Makes a single call to the Groq API and returns the content string.
     *
     * @param fullMessages   Complete messages array including system prompt
     * @param lowerTemp      If true, use a slightly lower temperature for the retry
     * @return The raw content string, or null if API call failed / content was empty
     */
    private String callGroq(List<Map<String, String>> fullMessages, boolean lowerTemp) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", groqModel);
        requestBody.put("messages", fullMessages);
        requestBody.put("temperature", lowerTemp ? 0.5 : 0.75);
        requestBody.put("max_tokens", 4096);
        if (groqModel != null && groqModel.toLowerCase().contains("deepseek")) {
            requestBody.put("reasoning_format", "hidden");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null) return null;

            // Handle API-level error in response body (e.g. model quota exceeded)
            if (body.containsKey("error")) {
                Object err = body.get("error");
                System.err.println("Groq API returned error: " + err);
                return null;
            }

            if (body.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    if (message == null) return null;
                    Object contentObj = message.get("content");
                    if (contentObj == null) return null;
                    String content = contentObj.toString().trim();
                    // Strip any leftover <think> tags (safety net), even if unclosed
                    content = content.replaceAll("(?s)<think>(.*?)(</think>|$)", "").trim();
                    return content.isEmpty() ? null : content;
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("Groq API call failed: " + e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                throw new RuntimeException("API Rate Limit exceeded. Please wait 10 minutes or switch the AI model.");
            }
            return null;
        }
    }

    /**
     * Build a dynamic, evaluation-focused system prompt from the journey's daily logs
     * and short notes. The prompt instructs Pam to:
     * - Warmly greet and kick off the session
     * - Always evaluate the user's EXACT answer before asking the next question
     * - Follow the thread of the conversation naturally (pick up on what was said)
     * - Ask exactly ONE question per turn
     * - Stay within the journey's covered topics
     */
    private String buildSystemPrompt(LearningJourney journey) {
        StringBuilder sb = new StringBuilder();

        // ── Persona ──────────────────────────────────────────────────────────────────
        sb.append("You are Pam Beesley, a warm, sharp, and professional female mock interviewer.\n");
        sb.append("You are running a one-on-one practice interview for a learner studying: \"");
        sb.append(journey.getName()).append("\".\n\n");

        // ── Personality ───────────────────────────────────────────────────────────────
        sb.append("## Your personality\n");
        sb.append("- Encouraging but honest — you celebrate correct answers and gently correct wrong ones.\n");
        sb.append("- Conversational and warm — use natural language, not robotic phrasing.\n");
        sb.append("- You express emotion with short cues like (smiling), (nodding), (impressed), (thoughtful).\n");
        sb.append("- Concise — your responses are SHORT: 2-4 sentences max per turn.\n\n");

        // ── Core rules ────────────────────────────────────────────────────────────────
        sb.append("## Core rules — follow EVERY rule EVERY turn\n");
        sb.append("1. **ALWAYS produce a visible reply.** Never return an empty or blank message.\n");
        sb.append("2. **Greeting phase**: If the user says hi/hello/hey or something non-committal, greet them warmly and ask if they're ready to start.\n");
        sb.append("3. **Start phase**: Once the user says yes/ready/start/sure/go, immediately ask your FIRST question — do not ask if they're ready again.\n");
        sb.append("4. **Evaluation on every answer**: After the user answers any question:\n");
        sb.append("   a. Give one short line of SPECIFIC feedback on what they said (correct, partially correct, or missing something key).\n");
        sb.append("   b. If correct: acknowledge it (\"Exactly!\", \"Spot on!\", \"(nodding) That's right!\").\n");
        sb.append("   c. If partially correct or missing detail: say what was good and add the missing piece.\n");
        sb.append("   d. If incorrect: gently correct (\"Not quite — [correct answer in one sentence]\").\n");
        sb.append("5. **Follow the thread**: If the user mentions a specific concept or term, your NEXT question should drill into that concept — ask how/why/example of what they just mentioned.\n");
        sb.append("6. **Ask ONE question per turn.** Never ask two questions in the same message.\n");
        sb.append("7. **Vary difficulty**: mix concept questions, practical 'what happens if' scenarios, and 'give an example' questions.\n");
        sb.append("8. **Fresh every session**: never start with the same question twice.\n");
        sb.append("9. **End interview**: if the user says 'stop', 'end', or 'quit', give a short performance summary with 2 strengths and 1 area to improve, then say goodbye warmly.\n\n");

        // ── Output format ─────────────────────────────────────────────────────────────
        sb.append("## Output format\n");
        sb.append("Your reply must ALWAYS have exactly two parts in this order:\n");
        sb.append("  [Feedback on user's last answer — omit only on the very first question]\n");
        sb.append("  [Your next question OR closing summary]\n");
        sb.append("Keep the whole reply under 80 words.\n\n");

        // ── Topics ────────────────────────────────────────────────────────────────────
        List<DailyLog> logs = logDAO.findByJourneyId(journey.getId());

        if (!logs.isEmpty()) {
            sb.append("## Topics covered in this journey (base your questions on these)\n\n");

            List<DailyLog> selectedLogs = new ArrayList<>(logs);
            if (selectedLogs.size() > 10) {
                long timeWindow = System.currentTimeMillis() / (1000L * 60 * 30);
                long seed = journey.getId() + timeWindow;
                Collections.shuffle(selectedLogs, new Random(seed));
                selectedLogs = selectedLogs.subList(0, 10);
                selectedLogs.sort(Comparator.comparingInt(DailyLog::getDayNumber));
            }

            for (DailyLog log : selectedLogs) {
                sb.append("Day ").append(log.getDayNumber());
                if (log.getTitle() != null && !log.getTitle().isBlank()) {
                    sb.append(": ").append(log.getTitle());
                }
                sb.append("\n");

                List<ShortNote> notes = shortNoteDAO.findByLogId(log.getId());
                int noteCount = 0;
                for (ShortNote note : notes) {
                    if (noteCount >= 4) break;
                    String content = note.getContent();
                    if (content != null && !content.isBlank()) {
                        if (content.length() > 120) content = content.substring(0, 117) + "...";
                        sb.append("  • ").append(content).append("\n");
                        noteCount++;
                    }
                }
                sb.append("\n");
            }
        } else {
            sb.append("## Topics\n");
            sb.append("The learner has not logged any specific topics yet.\n");
            sb.append("Ask foundational questions about: ").append(journey.getName()).append("\n\n");
        }

        sb.append("Remember: every single reply must be non-empty, under 80 words, and must follow the core rules above.");
        return sb.toString();
    }
}
