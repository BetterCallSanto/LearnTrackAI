package com.learntrack.controller;

import com.learntrack.dto.AuthResponse;
import com.learntrack.dto.LoginRequest;
import com.learntrack.dto.RegisterRequest;
import com.learntrack.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController — Handles user registration and login.
 * 
 * These endpoints are PUBLIC — no JWT token required.
 * 
 * Endpoints:
 *   POST /api/auth/register  — Register a new user
 *   POST /api/auth/login     — Login and get JWT token
 * 
 * PRD Reference: Section 7.1
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Register a new user.
     * 
     * @param request RegisterRequest with fullName, username, email, password
     * @return 201 Created with success message, or 400 if duplicate
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", message));
    }

    /**
     * Login and get a JWT token.
     * 
     * @param request LoginRequest with username, password
     * @return 200 OK with AuthResponse { token, username, userId, fullName }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
}
