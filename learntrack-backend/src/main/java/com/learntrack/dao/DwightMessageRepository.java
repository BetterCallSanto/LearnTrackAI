package com.learntrack.dao;

import com.learntrack.model.DwightMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DwightMessageRepository extends JpaRepository<DwightMessage, Long> {
    List<DwightMessage> findByUserIdOrderByTimestampAsc(Long userId);
    void deleteByUserId(Long userId);
}
