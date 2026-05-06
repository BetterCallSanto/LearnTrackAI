package com.learntrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ShortNote Entity — Maps to the 'short_notes' table.
 * 
 * Short notes are concise bullet-point notes created during a daily log
 * session. They are the primary content used in the revision checklist.
 * Each note can be marked as "revised" when the user reviews it during
 * a revision session.
 * 
 * Table: short_notes
 * PRD Reference: Section 5.5
 */
@Entity
@Table(name = "short_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShortNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The daily log this note belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id", nullable = false)
    private DailyLog dailyLog;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * Whether this note has been marked as revised in the revision checklist.
     * Default is false. Toggled via PATCH /api/notes/{noteId}/revise.
     */
    @Column(name = "is_revised")
    @Builder.Default
    private Boolean isRevised = false;

    /**
     * The display order of this note in the list.
     * Notes are ordered by this field when displayed.
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
