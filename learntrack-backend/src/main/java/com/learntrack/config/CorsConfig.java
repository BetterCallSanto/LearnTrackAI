package com.learntrack.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * CorsConfig — Cross-Origin Resource Sharing Configuration.
 * 
 * Since the React frontend (localhost:3000 during dev, Netlify in production)
 * and the Spring Boot backend (localhost:8080) are on different origins,
 * CORS must be explicitly configured to allow cross-origin requests.
 * 
 * PRD Reference: Section 10.4
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins — Simplified wildcard for production stability
        config.setAllowedOriginPatterns(Arrays.asList("*"));

        // Allowed HTTP methods
        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // Allowed headers
        config.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        // Allow credentials (disabled to allow wildcard origin)
        config.setAllowCredentials(false);

        // How long the browser caches the CORS preflight response (1 hour)
        config.setMaxAge(3600L);

        // Apply CORS config to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
