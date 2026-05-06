package com.learntrack.dto;

import lombok.*;

/**
 * LogRequest DTO — Request body for creating/updating a Daily Log.
 * 
 * PRD Reference: Section 8.5
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogRequest {

    private String title;

    private String description;
}
