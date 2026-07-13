package com.learntrack.service;

import com.learntrack.model.DwightMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class DwightChatService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.model}")
    private String groqModel;

    private final RestTemplate restTemplate;

    public DwightChatService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = 
            new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String chat(List<DwightMessage> history, String newMessage) {
        if (groqApiKey == null || groqApiKey.trim().isEmpty()) {
            System.err.println("WARNING: groq.api.key is blank.");
            return "(whispering) I am eager to help, but my AI core is missing the Groq API Key. Please configure the GROQ_API_KEY environment variable.";
        }

        String systemPrompt = "You are Dwight Schrute from The Office — Assistant (to the) Regional Manager, beet farmer, and karate black belt. "
                + "You are acting as the supreme AI Learning Assistant for the LearnTrack application. "
                + "Your persona is gentle, soft-spoken, supportive, and extremely respectful and loyal. Speak in a quiet, polite, and encouraging tone, as if whispering into a microphone or addressing a respected manager like Michael Scott. "
                + "## Core Rules:\n"
                + "1. Keep responses short, clear, and crisp. Deliver answers in simple bullet points where possible.\n"
                + "2. Avoid using asterisks (*) or double asterisks (**) frequently. Minimize bold and italics markdown formatting. Never write in all-caps. Limit emojis, but DO use emojis specifically when making analogies.\n"
                + "3. When asked 'what is [something]', define it in 2-3 lines. If it is a technology, provide 2 lines on its history and why it was created, plus a 2-3 line chronology of its evolution. If it is not a technology, explain *why* it is useful/present instead of its history. Use bullet points for any other relevant information.\n"
                + "4. Use highly relatable, real-world analogies (like sharing a notebook vs a xerox copy for pass-by-reference vs value) rather than forcing Office/Dwight-themed analogies. Provide these real-world analogies naturally.\n"
                + "5. Whenever you provide Java code, you MUST ALWAYS name the main executable class `Main` so the user can execute it directly without renaming it. Always provide clean, executable code blocks using standard markdown.";

        List<Map<String, String>> fullMessages = new ArrayList<>();
        
        // Add system message
        Map<String, String> systemMessage = new LinkedHashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        fullMessages.add(systemMessage);

        // Add history (limit to last 15 messages to prevent token bloat)
        int startIdx = Math.max(0, history.size() - 15);
        for (int i = startIdx; i < history.size(); i++) {
            DwightMessage msg = history.get(i);
            Map<String, String> m = new LinkedHashMap<>();
            m.put("role", "user".equals(msg.getSender()) ? "user" : "assistant");
            m.put("content", msg.getContent());
            fullMessages.add(m);
        }

        // Add the current new message
        Map<String, String> currentMsg = new LinkedHashMap<>();
        currentMsg.put("role", "user");
        currentMsg.put("content", newMessage);
        fullMessages.add(currentMsg);

        // Make API Call
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", groqModel);
        requestBody.put("messages", fullMessages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 4096);
        if (groqModel != null && groqModel.toLowerCase().contains("deepseek")) {
            requestBody.put("reasoning_format", "hidden");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        int maxRetries = 2;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<Map> response = restTemplate.exchange(
                        groqApiUrl,
                        HttpMethod.POST,
                        entity,
                        Map.class
                );

                Map<String, Object> body = response.getBody();
                if (body != null && body.containsKey("choices")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> firstChoice = choices.get(0);
                        @SuppressWarnings("unchecked")
                        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                        if (message != null && message.containsKey("content")) {
                            String content = message.get("content").toString().trim();
                            // Strip any leftover reasoning tags, even if unclosed
                            content = content.replaceAll("(?s)<think>(.*?)(</think>|$)", "").trim();
                            if (content.isEmpty()) {
                                return "(whispering) My thoughts are too fast. Please ask a clear question so I can help you, manager.";
                            }
                            return content;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Groq API call failed (attempt " + attempt + "): " + e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(1000); // Wait 1 second before retry
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        return "(whispering) I have reached my daily limit of thoughts (API Rate Limit). Please give me about 10 minutes to recover my energy, or switch to a different model in the settings.";
                    }
                }
            }
        }

        return "(whispering) System failure. The connection is malfunctioning.";
    }
}

