import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';

const ShortNoteItem = ({ note, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim() || editContent === note.content) {
      setIsEditing(false);
      setEditContent(note.content);
      return;
    }

    if (note.isDraft) {
      onUpdate({ ...note, content: editContent });
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.put(`/api/notes/${note.id}`, { content: editContent });
      onUpdate(res.data);
      setIsEditing(false);
      toast.success('Note updated');
    } catch (error) {
      toast.error('Failed to update note');
      setEditContent(note.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(note.content);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.75rem',
      backgroundColor: '#f8fafc',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      border: '1px solid var(--border)'
    }}>
      <div style={{ flexGrow: 1 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ padding: '0.4rem 0.5rem', fontSize: '14px' }}
              disabled={isLoading}
            />
            <button onClick={handleSave} className="btn-primary" style={{ padding: '0.4rem 0.5rem' }} disabled={isLoading}>
              <FiCheck />
            </button>
            <button onClick={() => { setIsEditing(false); setEditContent(note.content); }} className="btn-secondary" style={{ padding: '0.4rem 0.5rem' }} disabled={isLoading}>
              <FiX />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '14.5px', lineHeight: '1.4' }}>• {note.content}</span>
        )}
      </div>

      {!isEditing && (
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.25rem' }}
          >
            <FiEdit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            style={{ background: 'none', border: 'none', color: 'var(--error)', padding: '0.25rem' }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShortNoteItem;
