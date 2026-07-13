package com.learntrack.controller;

import com.learntrack.dao.UniversalProjectRepository;
import com.learntrack.model.UniversalProject;
import com.learntrack.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/universal-projects")
public class UniversalProjectController {

    @Autowired
    private UniversalProjectRepository repository;

    @GetMapping
    public ResponseEntity<List<UniversalProject>> getUserProjects(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repository.findByUserIdOrderByPinnedDescUpdatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<UniversalProject> createProject(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        UniversalProject project = UniversalProject.builder()
                .user(user)
                .name((String) body.getOrDefault("name", "Untitled Project"))
                .language((String) body.getOrDefault("language", "java"))
                .code((String) body.getOrDefault("code", ""))
                .pinned(body.containsKey("pinned") ? (Boolean) body.get("pinned") : false)
                .fromDwight(body.containsKey("fromDwight") ? Boolean.TRUE.equals(body.get("fromDwight")) : false)
                .build();
        
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(project));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UniversalProject> updateProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {

        UniversalProject project = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        if (body.containsKey("name")) project.setName((String) body.get("name"));
        if (body.containsKey("language")) project.setLanguage((String) body.get("language"));
        if (body.containsKey("code")) project.setCode((String) body.get("code"));
        if (body.containsKey("pinned")) project.setPinned((Boolean) body.get("pinned"));

        return ResponseEntity.ok(repository.save(project));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, @AuthenticationPrincipal User user) {
        UniversalProject project = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        repository.delete(project);
        return ResponseEntity.noContent().build();
    }
}
