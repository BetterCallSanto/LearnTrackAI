package com.learntrack.dao;

import com.learntrack.model.LearningJourney;

import java.util.List;
import java.util.Optional;

/**
 * JourneyDAO Interface — Defines all data access operations for LearningJourney entity.
 */
public interface JourneyDAO {

    LearningJourney save(LearningJourney journey);

    List<LearningJourney> findByUserId(Long userId);

    Optional<LearningJourney> findByIdAndUserId(Long id, Long userId);

    Optional<LearningJourney> findById(Long id);

    void delete(LearningJourney journey);
}
