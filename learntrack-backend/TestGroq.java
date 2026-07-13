import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import java.util.*;

public class TestGroq {
    public static void main(String[] args) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(15000);
            factory.setReadTimeout(30000);
            RestTemplate restTemplate = new RestTemplate(factory);

            String groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
            String groqApiKey = System.getenv("GROQ_API_KEY");
            if (groqApiKey == null || groqApiKey.isEmpty()) {
                System.err.println("Error: GROQ_API_KEY environment variable is not set.");
                return;
            }

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "qwen/qwen3.6-27b");
            
            List<Map<String, String>> fullMessages = new ArrayList<>();
            Map<String, String> m = new LinkedHashMap<>();
            m.put("role", "user");
            m.put("content", "hello");
            fullMessages.add(m);
            
            requestBody.put("messages", fullMessages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2048);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            System.out.println("Status: " + response.getStatusCode());
            System.out.println("Body: " + response.getBody());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
