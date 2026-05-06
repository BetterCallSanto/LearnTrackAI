package com.learntrack.repository;

import com.learntrack.model.LearningJourney;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JourneyRepository — Spring Data JPA Repository for LearningJourney entity.
 * 
 * PRD Reference: Section 7.2 — Journey endpoints need user-filtered queries.
 */
@Repository
public interface JourneyRepository extends JpaRepository<LearningJourney, Long> {

    /**
     * Find all learning journeys belonging to a specific user.
     * Ordered by creation date (newest first).
     */
    List<LearningJourney> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find a specific journey by ID and user ID.
     * Ensures a user can only access their own journeys (data isolation).
     */
    Optional<LearningJourney> findByIdAndUserId(Long id, Long userId);
}
