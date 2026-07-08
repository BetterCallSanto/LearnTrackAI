package com.learntrack.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class CompilerController {

    private static final String JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
    private static final String DB_URL = "jdbc:sqlite:myntra_practice.db";

    @PostMapping("/api/compiler/run")
    public ResponseEntity<Map<String, Object>> runCode(@RequestBody Map<String, String> body) {
        String language = body.getOrDefault("language", "java").toLowerCase();
        String code = body.getOrDefault("code", "");
        String stdin = body.getOrDefault("stdin", "");

        Map<String, Object> response = new LinkedHashMap<>();

        if ("sql".equals(language)) {
            // Execute locally against SQLite
            return executeSql(code);
        } else {
            // Execute via Judge0 API
            return executeJudge0(language, code, stdin);
        }
    }

    private ResponseEntity<Map<String, Object>> executeSql(String query) {
        Map<String, Object> response = new LinkedHashMap<>();

        // Validate basic safety (only allow SELECT for this simple practice)
        if (!query.trim().toUpperCase().startsWith("SELECT")) {
            response.put("error", "For security reasons, only SELECT queries are allowed in practice mode.");
            return ResponseEntity.ok(response);
        }

        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            List<String> headers = new ArrayList<>();
            for (int i = 1; i <= columnCount; i++) {
                headers.add(metaData.getColumnName(i));
            }

            List<List<Object>> rows = new ArrayList<>();
            while (rs.next()) {
                List<Object> row = new ArrayList<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.add(rs.getObject(i));
                }
                rows.add(row);
            }

            response.put("headers", headers);
            response.put("rows", rows);
            response.put("stdout", "Query executed successfully. " + rows.size() + " rows returned.");

        } catch (Exception e) {
            response.put("stderr", "SQL Error: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> executeJudge0(String language, String code, String stdin) {
        Map<String, Object> response = new LinkedHashMap<>();

        int languageId = 62; // Default to Java
        switch (language) {
            case "java":
                languageId = 62; // Java (OpenJDK 13.0.1)
                break;
            case "python":
                languageId = 71; // Python (3.8.1)
                break;
            case "javascript":
                languageId = 63; // Node.js (12.14.0)
                break;
            case "c":
                languageId = 50; // C (GCC 9.2.0)
                break;
            case "cpp":
                languageId = 54; // C++ (GCC 9.2.0)
                break;
            default:
                response.put("stderr", "Unsupported language: " + language);
                return ResponseEntity.ok(response);
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("source_code", code);
        requestBody.put("language_id", languageId);
        requestBody.put("stdin", stdin);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<Map> judge0Response = restTemplate.postForEntity(JUDGE0_URL, entity, Map.class);
            Map<String, Object> body = judge0Response.getBody();
            if (body != null) {
                if (body.get("stdout") != null) response.put("stdout", body.get("stdout"));
                if (body.get("stderr") != null) response.put("stderr", body.get("stderr"));
                if (body.get("compile_output") != null) response.put("compile_output", body.get("compile_output"));
                if (body.get("message") != null) response.put("message", body.get("message"));
            }
        } catch (Exception e) {
            response.put("stderr", "Error contacting Judge0 API: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
