package com.learntrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * JourneyRequest DTO — Request body for creating/updating a Learning Journey.
 * 
 * PRD Reference: Section 8.3
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JourneyRequest {

    @NotBlank(message = "Journey name is required")
    @Size(max = 150, message = "Journey name must be at most 150 characters")
    private String name;

    private String description;
}
