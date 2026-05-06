package com.learntrack.service;

import com.learntrack.dao.AttachmentDAO;
import com.learntrack.exception.ResourceNotFoundException;
import com.learntrack.model.Attachment;
import com.learntrack.model.DailyLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * AttachmentService — Business logic for Attachment operations.
 * 
 * Handles:
 * - Saving attachment metadata (links, YouTube URLs)
 * - Uploading files and images to the local filesystem
 * - Retrieving and deleting attachments
 * 
 * Files are stored in the local filesystem during development.
 * For production, this would be migrated to cloud storage (S3, etc.).
 * 
 * PRD Reference: Section 7.5, Section 8.5.2
 */
@Service
public class AttachmentService {

    @Autowired
    private AttachmentDAO attachmentDAO;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Get all attachments for a specific daily log.
     */
    public List<Attachment> getAttachmentsByLog(Long logId) {
        return attachmentDAO.findByLogId(logId);
    }

    /**
     * Add a link or YouTube URL attachment (no file upload).
     */
    public Attachment addLinkAttachment(DailyLog dailyLog, Attachment.AttachmentType type, String url) {
        Attachment attachment = Attachment.builder()
                .dailyLog(dailyLog)
                .attachmentType(type)
                .linkUrl(url)
                .build();

        return attachmentDAO.save(attachment);
    }

    /**
     * Add a file or image attachment (with file upload).
     * 
     * The file is saved to the local filesystem with a unique name
     * to prevent naming conflicts. The file URL is stored in the database.
     */
    public Attachment addFileAttachment(DailyLog dailyLog, Attachment.AttachmentType type,
                                         MultipartFile file) throws IOException {
        // Create the upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate a unique filename to prevent conflicts
        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        // Save the file to disk
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Create and save the attachment metadata
        Attachment attachment = Attachment.builder()
                .dailyLog(dailyLog)
                .attachmentType(type)
                .fileName(originalFileName)
                .fileUrl("/api/files/" + uniqueFileName)
                .build();

        return attachmentDAO.save(attachment);
    }

    /**
     * Delete an attachment. If it's a file/image, also delete the file from disk.
     */
    public void deleteAttachment(Long attachmentId) {
        Attachment attachment = attachmentDAO.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attachment not found with ID: " + attachmentId));

        // If it's a file or image, delete the physical file from disk
        if (attachment.getFileUrl() != null &&
                (attachment.getAttachmentType() == Attachment.AttachmentType.FILE ||
                 attachment.getAttachmentType() == Attachment.AttachmentType.IMAGE)) {
            try {
                String fileName = attachment.getFileUrl().replace("/api/files/", "");
                Path filePath = Paths.get(uploadDir).resolve(fileName);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log the error but don't fail the deletion
                System.err.println("Warning: Could not delete file from disk: " + e.getMessage());
            }
        }

        attachmentDAO.delete(attachment);
    }
}
