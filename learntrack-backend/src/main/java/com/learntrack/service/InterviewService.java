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
     * to the Groq API.
     *
     * @param journey  The learning journey providing topic context
     * @param messages The conversation history from the frontend
     * @return The assistant's reply text
     */
    public String chat(LearningJourney journey, List<Map<String, String>> messages) {
        // Build the system prompt with journey context
        String systemPrompt = buildSystemPrompt(journey);

        // Construct the full messages array: system prompt + user conversation
        List<Map<String, String>> fullMessages = new ArrayList<>();
        Map<String, String> systemMessage = new LinkedHashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        fullMessages.add(systemMessage);
        fullMessages.addAll(messages);

        // Build the request body
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", groqModel);
        requestBody.put("messages", fullMessages);
        requestBody.put("temperature", 0.8);
        requestBody.put("max_tokens", 1024);

        // Set headers
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

            // Extract the assistant's reply from the Groq API response
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, String> message = (Map<String, String>) firstChoice.get("message");
                    return message.get("content");
                }
            }

            return "I'm having trouble thinking right now. Could you try again?";
        } catch (Exception e) {
            System.err.println("Groq API error: " + e.getMessage());
            e.printStackTrace();
            return "Sorry, I couldn't connect to my brain right now. Please try again in a moment.";
        }
    }

    /**
     * Build a dynamic system prompt from the journey's daily logs and short notes.
     *
     * The prompt instructs Pam to act as a professional interviewer and
     * restricts questions to the specific topics covered in the journey.
     */
    private String buildSystemPrompt(LearningJourney journey) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are Pam Beesley, a friendly, warm, and professional female mock interviewer. ");
        sb.append("You are conducting a practice interview for a learner who has been studying: \"");
        sb.append(journey.getName()).append("\".\n\n");

        sb.append("Your personality traits:\n");
        sb.append("- Warm and encouraging, but honest with feedback\n");
        sb.append("- Professional and knowledgeable\n");
        sb.append("- You give brief, constructive feedback on each answer before asking the next question\n");
        sb.append("- You use casual expressions in parentheses like (smiling), (nodding), (impressed) to show emotion\n");
        sb.append("- You keep your responses concise and focused\n\n");

        sb.append("Interview rules:\n");
        sb.append("- When the user first says hello or yes, greet them warmly and ask if they're ready to start\n");
        sb.append("- Once they confirm, start asking questions one at a time. Do NOT ask questions in chronological order of days; shuffle the topics and pick a random starting concept from the topics list below to keep each session completely fresh.\n");
        sb.append("- Act like a real conversational interviewer: pay close attention to the user's response. When they mention technical terms, concepts, or details in their answer, link your next question to what they just said. Ask them 'how', 'why', or to explain/give an example of the concept they brought up (for example, if they mention 'constructor chaining', immediately drill down and ask them to explain or write code for constructor chaining).\n");
        sb.append("- Do not jump abruptly to a completely new topic. Follow the thread of conversation naturally by asking deep follow-up questions based on their answers, and only pivot to another topic from the list once that concept has been explored.\n");
        sb.append("- After the user answers, give brief, natural feedback (e.g., 'Exactly!', 'That's close, but...', or 'Impressed! Yes, that's correct') before transitioning to your follow-up or the next question.\n");
        sb.append("- Vary question difficulty: mix conceptual, practical, and scenario-based questions.\n");
        sb.append("- Generate completely different, non-repetitive questions every session — never use the same opening or follow-up questions.\n");
        sb.append("- Ask exactly one question at a time. Never ask multiple questions in a single message.\n");
        sb.append("- If the user says 'end interview' or 'stop', summarize their performance, list areas of strength and improvement, and say goodbye warmly.\n\n");

        // Gather journey topics from daily logs and short notes
        List<DailyLog> logs = logDAO.findByJourneyId(journey.getId());

        if (!logs.isEmpty()) {
            sb.append("=== TOPICS COVERED IN THIS JOURNEY ===\n\n");
            
            List<DailyLog> selectedLogs = new ArrayList<>(logs);
            if (selectedLogs.size() > 8) {
                // Deterministic seed changes every 30 minutes to keep selection stable during one interview session
                long timeWindow = System.currentTimeMillis() / (1000 * 60 * 30);
                long seed = journey.getId() + timeWindow;
                Random rand = new Random(seed);
                Collections.shuffle(selectedLogs, rand);
                selectedLogs = selectedLogs.subList(0, 8);
                // Sort them back by day number for readability
                selectedLogs.sort(Comparator.comparingInt(DailyLog::getDayNumber));
            }

            for (DailyLog log : selectedLogs) {
                sb.append("Day ").append(log.getDayNumber());
                if (log.getTitle() != null && !log.getTitle().isBlank()) {
                    sb.append(": ").append(log.getTitle());
                }
                sb.append("\n");

                List<ShortNote> notes = shortNoteDAO.findByLogId(log.getId());
                if (!notes.isEmpty()) {
                    sb.append("  Key points:\n");
                    int noteCount = 0;
                    for (ShortNote note : notes) {
                        if (noteCount >= 3) break;
                        String content = note.getContent();
                        if (content != null && !content.isBlank()) {
                            if (content.length() > 100) {
                                content = content.substring(0, 97) + "...";
                            }
                            sb.append("    - ").append(content).append("\n");
                            noteCount++;
                        }
                    }
                }
                sb.append("\n");
            }
        } else {
            sb.append("The learner hasn't logged any topics yet. Ask them general questions about: ");
            sb.append(journey.getName()).append("\n");
        }

        sb.append("\nRemember: Stay within these topics only. Be encouraging but honest.");

        return sb.toString();
    }
}
