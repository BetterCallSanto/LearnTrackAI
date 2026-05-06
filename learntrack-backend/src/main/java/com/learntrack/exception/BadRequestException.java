package com.learntrack.exception;

/**
 * BadRequestException — Thrown when the client sends invalid data.
 * 
 * Maps to HTTP 400 Bad Request.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
