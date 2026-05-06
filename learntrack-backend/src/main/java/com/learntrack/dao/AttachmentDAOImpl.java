package com.learntrack.dao;

import com.learntrack.model.Attachment;
import com.learntrack.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * AttachmentDAOImpl — Implementation of AttachmentDAO interface.
 * 
 * All database operations for Attachment go through this class.
 */
@Repository
public class AttachmentDAOImpl implements AttachmentDAO {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Override
    public Attachment save(Attachment attachment) {
        return attachmentRepository.save(attachment);
    }

    @Override
    public List<Attachment> findByLogId(Long logId) {
        return attachmentRepository.findByDailyLogId(logId);
    }

    @Override
    public Optional<Attachment> findById(Long id) {
        return attachmentRepository.findById(id);
    }

    @Override
    public void delete(Attachment attachment) {
        attachmentRepository.delete(attachment);
    }
}
