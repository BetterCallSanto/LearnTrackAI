package com.learntrack.exception;

/**
 * ResourceNotFoundException — Thrown when a requested resource does not exist.
 * 
 * Maps to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
