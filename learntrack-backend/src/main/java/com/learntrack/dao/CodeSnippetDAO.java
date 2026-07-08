package com.learntrack.dao;

import com.learntrack.model.CodeSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface CodeSnippetDAO {
    List<CodeSnippet> findByDailyLogIdOrderByDisplayOrderAsc(Long logId);
    CodeSnippet save(CodeSnippet snippet);
    Optional<CodeSnippet> findById(Long id);
    boolean existsById(Long id);
    void deleteById(Long id);
}
