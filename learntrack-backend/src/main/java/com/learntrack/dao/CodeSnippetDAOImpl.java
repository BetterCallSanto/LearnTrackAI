package com.learntrack.dao;

import com.learntrack.model.CodeSnippet;
import com.learntrack.repository.CodeSnippetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CodeSnippetDAOImpl implements CodeSnippetDAO {

    @Autowired
    private CodeSnippetRepository codeSnippetRepository;

    @Override
    public List<CodeSnippet> findByDailyLogIdOrderByDisplayOrderAsc(Long logId) {
        return codeSnippetRepository.findByDailyLogIdOrderByDisplayOrderAsc(logId);
    }

    @Override
    public CodeSnippet save(CodeSnippet snippet) {
        return codeSnippetRepository.save(snippet);
    }

    @Override
    public Optional<CodeSnippet> findById(Long id) {
        return codeSnippetRepository.findById(id);
    }

    @Override
    public boolean existsById(Long id) {
        return codeSnippetRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id) {
        codeSnippetRepository.deleteById(id);
    }
}
