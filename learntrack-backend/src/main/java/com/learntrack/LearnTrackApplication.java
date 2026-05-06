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
        SpringApplication.run(LearnTrackApplication.class, args);
    }
}
