package com.learntrack.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * RegisterRequest DTO — Request body for user registration.
 * 
 * Carries the data from the frontend Register form to the backend.
 * All fields are validated using Bean Validation annotations.
 * 
 * PRD Reference: Section 6.2, Section 8.1.1
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^\\S+$", message = "Username must not contain spaces")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
