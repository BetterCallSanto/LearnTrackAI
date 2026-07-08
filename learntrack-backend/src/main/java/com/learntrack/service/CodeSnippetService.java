package com.learntrack.service;

import com.learntrack.dao.CodeSnippetDAO;
import com.learntrack.dao.LogDAO;
import com.learntrack.exception.BadRequestException;
import com.learntrack.exception.ResourceNotFoundException;
import com.learntrack.model.CodeSnippet;
import com.learntrack.model.DailyLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CodeSnippetService {

    @Autowired
    private CodeSnippetDAO codeSnippetDAO;

    @Autowired
    private LogDAO logDAO;

    public List<CodeSnippet> getSnippetsByLog(Long logId) {
        return codeSnippetDAO.findByDailyLogIdOrderByDisplayOrderAsc(logId);
    }

    @Transactional
    public DailyLog toggleSnippets(Long logId, boolean enabled) {
        DailyLog log = logDAO.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Log not found"));
        log.setCodeSnippetsEnabled(enabled);
        return logDAO.save(log);
    }

    @Transactional
    public CodeSnippet addSnippet(DailyLog log, String title, String language, String code, Integer editorHeight) {
        List<CodeSnippet> existing = codeSnippetDAO.findByDailyLogIdOrderByDisplayOrderAsc(log.getId());
        int newOrder = existing.size();

        CodeSnippet snippet = CodeSnippet.builder()
                .dailyLog(log)
                .title(title)
                .language(language)
                .code(code)
                .editorHeight(editorHeight != null ? editorHeight : 300)
                .displayOrder(newOrder)
                .build();

        return codeSnippetDAO.save(snippet);
    }

    @Transactional
    public CodeSnippet updateSnippet(Long snippetId, String title, String language, String code, Integer editorHeight) {
        CodeSnippet snippet = codeSnippetDAO.findById(snippetId)
                .orElseThrow(() -> new ResourceNotFoundException("Code Snippet not found"));

        if (title != null) snippet.setTitle(title);
        if (language != null) snippet.setLanguage(language);
        if (code != null) snippet.setCode(code);
        if (editorHeight != null) snippet.setEditorHeight(editorHeight);

        return codeSnippetDAO.save(snippet);
    }

    @Transactional
    public void deleteSnippet(Long snippetId) {
        if (!codeSnippetDAO.existsById(snippetId)) {
            throw new ResourceNotFoundException("Code Snippet not found");
        }
        codeSnippetDAO.deleteById(snippetId);
    }
}
