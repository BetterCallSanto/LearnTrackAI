package com.learntrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DailyLog Entity — Maps to the 'daily_logs' table.
 * 
 * A Daily Log represents a single day's learning entry within a journey.
 * Each log has a sequential day number, the actual calendar date, and a
 * detailed description of what was learned. It can also contain multiple
 * short notes and attachments.
 * 
 * Table: daily_logs
 * PRD Reference: Section 5.4
 */
@Entity
@Table(name = "daily_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"journey_id", "day_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The journey this log belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journey_id", nullable = false)
    private LearningJourney journey;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /**
     * The topic or title for this day's learning session.
     * Entered by the user to quickly identify what was covered.
     */
    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * All short notes belonging to this daily log.
     * Cascade delete: when a log is deleted, all its notes are also deleted.
     */
    @OneToMany(mappedBy = "dailyLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ShortNote> shortNotes = new ArrayList<>();

    /**
     * All attachments belonging to this daily log.
     * Cascade delete: when a log is deleted, all its attachments are also deleted.
     */
    @OneToMany(mappedBy = "dailyLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
