package com.learntrack.repository;

import com.learntrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository — Spring Data JPA Repository for User entity.
 * 
 * Extends JpaRepository to get built-in CRUD methods (save, findById,
 * findAll, delete, etc.) plus custom query methods defined below.
 * 
 * PRD Reference: Section 10.1, Step 1
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their username.
     * Used during login authentication and JWT token validation.
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if a user with the given email already exists.
     * Used during registration to prevent duplicate emails.
     */
    boolean existsByEmail(String email);

    /**
     * Check if a user with the given username already exists.
     * Used during registration to prevent duplicate usernames.
     */
    boolean existsByUsername(String username);
}
