package com.learntrack.dto;

import lombok.*;

/**
 * AuthResponse DTO — Response body after successful login.
 * 
 * Contains the JWT token and basic user info that the frontend
 * stores in localStorage and AuthContext.
 * 
 * PRD Reference: Section 6.3, Step 7
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String username;
    private Long userId;
    private String fullName;
}
