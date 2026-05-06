package com.learntrack.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig — Spring Security Configuration.
 * 
 * Configures the application's security:
 * - Disables CSRF (not needed for stateless JWT auth)
 * - Sets session management to STATELESS (no server-side sessions)
 * - Permits public access to /api/auth/** endpoints
 * - Requires authentication for all other endpoints
 * - Adds the JwtAuthFilter before Spring's default authentication filter
 * - Configures BCrypt password encoder
 * 
 * PRD Reference: Section 6, Section 12.1
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS — uses our CorsConfig
                .cors(org.springframework.security.config.Customizer.withDefaults())
                
                // Disable CSRF — not needed for stateless JWT authentication
                .csrf(csrf -> csrf.disable())

                // Configure endpoint access rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints — no authentication required
                        .requestMatchers("/api/auth/**").permitAll()
                        // File serving endpoint — public for displaying uploaded files
                        .requestMatchers("/api/files/**").permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                )

                // Set session management to stateless (JWT — no server-side sessions)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Set the authentication provider
                .authenticationProvider(authenticationProvider())

                // Add JWT filter before the default Spring Security auth filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt Password Encoder — Used to hash passwords before storing.
     * BCrypt automatically handles salting.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication Provider — Uses our UserDetailsService and BCrypt encoder.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Authentication Manager — Required by the AuthController for login.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
