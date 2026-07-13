package com.learntrack.dao;

import com.learntrack.model.UniversalProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniversalProjectRepository extends JpaRepository<UniversalProject, Long> {
    List<UniversalProject> findByUserIdOrderByPinnedDescUpdatedAtDesc(Long userId);
}
