package com.learntrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


/**
 * LearnTrack Application — Entry Point
 * 
 * This is the main class that starts the Spring Boot application.
 * It auto-configures everything: embedded Tomcat, JPA, Security, etc.
 */
@SpringBootApplication
public class LearnTrackApplication {

    public static void main(String[] args) {
        var context = SpringApplication.run(LearnTrackApplication.class, args);
        String port = context.getEnvironment().getProperty("server.port");
        System.out.println("🚀 LearnTrack Backend is running on port: " + port);
        System.out.println("🔗 Health Check URL: http://localhost:" + port + "/api/health");
    }
}
