package com.learntrack.dao;

import com.learntrack.model.User;

import java.util.Optional;

/**
 * UserDAO Interface — Defines all data access operations for User entity.
 * 
 * This interface is part of the DAO design pattern. The Service layer
 * injects this interface (not the implementation) to keep layers decoupled.
 * 
 * PRD Reference: Section 10.1, Step 2
 */
public interface UserDAO {

    /**
     * Save a new user or update an existing user in the database.
     */
    User saveUser(User user);

    /**
     * Find a user by their username.
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if a username already exists in the database.
     */
    boolean existsByUsername(String username);

    /**
     * Check if an email already exists in the database.
     */
    boolean existsByEmail(String email);

    /**
     * Find a user by their ID.
     */
    Optional<User> findById(Long id);
}
