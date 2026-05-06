package com.learntrack.dao;

import com.learntrack.model.LearningJourney;
import com.learntrack.repository.JourneyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JourneyDAOImpl — Implementation of JourneyDAO interface.
 * 
 * All database operations for LearningJourney go through this class.
 */
@Repository
public class JourneyDAOImpl implements JourneyDAO {

    @Autowired
    private JourneyRepository journeyRepository;

    @Override
    public LearningJourney save(LearningJourney journey) {
        return journeyRepository.save(journey);
    }

    @Override
    public List<LearningJourney> findByUserId(Long userId) {
        return journeyRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<LearningJourney> findByIdAndUserId(Long id, Long userId) {
        return journeyRepository.findByIdAndUserId(id, userId);
    }

    @Override
    public Optional<LearningJourney> findById(Long id) {
        return journeyRepository.findById(id);
    }

    @Override
    public void delete(LearningJourney journey) {
        journeyRepository.delete(journey);
    }
}
