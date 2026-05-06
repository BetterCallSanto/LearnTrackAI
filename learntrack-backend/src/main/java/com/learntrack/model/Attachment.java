package com.learntrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Attachment Entity — Maps to the 'attachments' table.
 * 
 * Attachments are files, images, links, or YouTube videos attached to a
 * daily log entry. Each attachment has a type that determines how it is
 * displayed in the frontend (file download, image thumbnail, hyperlink,
 * or embedded YouTube video).
 * 
 * Table: attachments
 * PRD Reference: Section 5.6
 */
@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The daily log this attachment belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id", nullable = false)
    private DailyLog dailyLog;

    /**
     * The type of attachment.
     * FILE   — A document (PDF, DOC, etc.) uploaded by the user
     * IMAGE  — An image file uploaded by the user
     * LINK   — A reference URL (any web link)
     * YOUTUBE — A YouTube video URL (embedded as iframe)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false)
    private AttachmentType attachmentType;

    /**
     * Original file name (used for FILE and IMAGE types).
     */
    @Column(name = "file_name", length = 255)
    private String fileName;

    /**
     * URL or file path where the uploaded file is stored (for FILE and IMAGE types).
     */
    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    /**
     * The URL for LINK and YOUTUBE attachment types.
     */
    @Column(name = "link_url", columnDefinition = "TEXT")
    private String linkUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Enum for the four supported attachment types.
     */
    public enum AttachmentType {
        FILE, IMAGE, LINK, YOUTUBE
    }
}
