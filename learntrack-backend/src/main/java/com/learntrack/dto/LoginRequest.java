package com.learntrack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * LoginRequest DTO — Request body for user login.
 * 
 * PRD Reference: Section 6.3, Section 8.1.2
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
