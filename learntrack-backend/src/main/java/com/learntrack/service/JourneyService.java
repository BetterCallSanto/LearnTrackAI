package com.learntrack.service;

import com.learntrack.dao.JourneyDAO;
import com.learntrack.dto.JourneyRequest;
import com.learntrack.exception.ResourceNotFoundException;
import com.learntrack.exception.UnauthorizedException;
import com.learntrack.model.LearningJourney;
import com.learntrack.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * JourneyService — Business logic for Learning Journey operations.
 * 
 * Handles CRUD operations for Learning Journeys, always filtering by
 * the authenticated user's ID to ensure data isolation (User A cannot
 * access User B's journeys).
 * 
 * PRD Reference: Section 7.2, Section 12.2
 */
@Service
public class JourneyService {

    @Autowired
    private JourneyDAO journeyDAO;

    /**
     * Get all learning journeys for a specific user.
     * Ordered by creation date (newest first).
     */
    public List<LearningJourney> getAllJourneysByUser(Long userId) {
        return journeyDAO.findByUserId(userId);
    }

    /**
     * Get a single journey by ID, ensuring it belongs to the specified user.
     * Throws 404 if the journey doesn't exist or doesn't belong to the user.
     */
    public LearningJourney getJourneyByIdAndUser(Long journeyId, Long userId) {
        return journeyDAO.findByIdAndUserId(journeyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Journey not found with ID: " + journeyId));
    }

    /**
     * Create a new learning journey for the given user.
     */
    public LearningJourney createJourney(JourneyRequest request, User user) {
        LearningJourney journey = LearningJourney.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .build();

        return journeyDAO.save(journey);
    }

    /**
     * Update an existing journey's name and/or description.
     * Only the owner can update their own journey.
     */
    public LearningJourney updateJourney(Long journeyId, JourneyRequest request, Long userId) {
        LearningJourney journey = getJourneyByIdAndUser(journeyId, userId);

        journey.setName(request.getName());
        journey.setDescription(request.getDescription());

        return journeyDAO.save(journey);
    }

    /**
     * Delete a journey and all its associated logs, notes, and attachments.
     * Cascade delete is handled by JPA (CascadeType.ALL on the entity).
     * Only the owner can delete their own journey.
     */
    public void deleteJourney(Long journeyId, Long userId) {
        LearningJourney journey = getJourneyByIdAndUser(journeyId, userId);
        journeyDAO.delete(journey);
    }
}
