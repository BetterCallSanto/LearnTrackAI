package com.learntrack.exception;

/**
 * UnauthorizedException — Thrown when a user tries to access another user's data.
 * 
 * Maps to HTTP 403 Forbidden.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
