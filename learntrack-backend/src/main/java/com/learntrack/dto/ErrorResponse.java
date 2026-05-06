package com.learntrack.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ErrorResponse DTO — Standard error response format for all API errors.
 * 
 * Every backend error returns this consistent JSON structure so the
 * frontend can predictably handle and display error messages.
 * 
 * PRD Reference: Section 14.1
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    private int status;
    private String error;
    private String message;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime timestamp;
}
