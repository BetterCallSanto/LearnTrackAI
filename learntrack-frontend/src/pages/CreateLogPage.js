import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import ShortNoteItem from '../components/ShortNoteItem';
import AttachmentUploader from '../components/AttachmentUploader';
import { FiArrowLeft, FiSave, FiList } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreateLogPage = () => {
  const { id, logId } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = Boolean(logId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [log, setLog] = useState({ title: '', description: '', dayNumber: null, logDate: new Date() });
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
  const [newNote, setNewNote] = useState('');

  const [currentLogId] = useState(isEditMode ? logId : null);
  const isInitializing = useRef(false);

  useEffect(() => {
    const initializeLog = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      
      try {
        if (isEditMode) {
          const res = await api.get(`/api/logs/${logId}`);
          setLog(res.data);
          setNotes(res.data.shortNotes || []);
          setAttachments(res.data.attachments || []);
        }
      } catch (error) {
        toast.error('Failed to initialize log');
        navigate(`/journey/${id}/logs`);
      } finally {
        setIsLoading(false);
      }
    };
    initializeLog();
  }, [id, logId, isEditMode, navigate]);

  const handleSaveLog = async () => {
    setIsSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/api/logs/${currentLogId}`, { title: log.title, description: log.description });
        toast.success('Log updated');
        navigate(`/journey/${id}/logs`);
      } else {
        // Bulk Create Flow
        // 1. Create Log
        const logRes = await api.post(`/api/journeys/${id}/logs`, { title: log.title, description: log.description });
        const newLogId = logRes.data.id;

        // 2. Upload Notes
        for (const note of notes) {
          if (note.isDraft) {
            await api.post(`/api/logs/${newLogId}/notes`, { content: note.content });
          }
        }

        // 3. Upload Attachments
        for (const att of attachments) {
          if (att.isDraft) {
            let formData = new FormData();
            formData.append('attachmentType', att.attachmentType);
            if (att.attachmentType === 'FILE' || att.attachmentType === 'IMAGE') {
              formData.append('file', att.file);
            } else {
              formData.append('linkUrl', att.linkUrl);
            }
            await api.post(`/api/logs/${newLogId}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        }

        toast.success('Log saved successfully');
        navigate(`/journey/${id}/logs`);
      }
    } catch (error) {
      toast.error('Failed to save log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!newNote.trim()) return;
      
      if (currentLogId) {
        // Immediate API request if we are editing an existing log
        try {
          const res = await api.post(`/api/logs/${currentLogId}/notes`, { content: newNote });
          setNotes([...notes, res.data]);
        } catch (error) {
          toast.error('Failed to add note');
        }
      } else {
        // Draft mode local state
        setNotes([...notes, { id: `draft-${Date.now()}`, content: newNote, isDraft: true }]);
      }
      setNewNote('');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Delete this short note?')) {
      const noteToDelete = notes.find(n => n.id === noteId);
      if (noteToDelete && noteToDelete.isDraft) {
        setNotes(notes.filter(n => n.id !== noteId));
        return;
      }

      try {
        await api.delete(`/api/notes/${noteId}`);
        setNotes(notes.filter(n => n.id !== noteId));
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  if (isLoading) return <div className="page-wrapper"><Navbar /><div className="container" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div></div></div>;

  return (
    <>
      <Navbar 
        leftContent={
          <Link to={`/journey/${id}/logs`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <FiArrowLeft /> Back to Journey
          </Link>
        }
        rightContent={
          <button 
            onClick={handleSaveLog} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={isSaving}
          >
            {isSaving ? <div className="spinner"></div> : <><FiSave /> Save Log</>}
          </button>
        }
      />
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              {isEditMode ? (
                <span style={{ 
                  backgroundColor: 'rgba(77, 142, 255, 0.12)', 
                  color: 'var(--primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  Day {log.dayNumber}
                </span>
              ) : (
                <span style={{ 
                  backgroundColor: 'var(--bg-subtle)', 
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  New Log
                </span>
              )}
              
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {new Date(log.logDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Day Title <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>(What topic did you cover today?)</span></label>
              <input 
                type="text" 
                className="form-control" 
                value={log.title || ''}
                onChange={(e) => setLog({ ...log, title: e.target.value })}
                placeholder="e.g. Introduction to OOP, Arrays & Strings, REST APIs..."
                maxLength="255"
                style={{ fontSize: '15px', fontWeight: '500' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                value={log.description || ''}
                onChange={(e) => setLog({ ...log, description: e.target.value })}
                placeholder="What did you learn today? Write in detail..."
                rows="8"
                style={{ resize: 'vertical', fontSize: '15px', lineHeight: '1.6' }}
              />
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

            {/* Short Notes Section */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiList /> Short Notes
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleAddNote}
                  placeholder="Type a short note and press Enter..."
                  style={{ backgroundColor: 'var(--bg-input)' }}
                />
              </div>

              {notes.length > 0 ? (
                <div>
                  {notes.map(note => (
                    <ShortNoteItem 
                      key={note.id} 
                      note={note} 
                      onDelete={handleDeleteNote}
                      onUpdate={handleUpdateNote}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                  No short notes added yet.
                </p>
              )}
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

            {/* Attachments Section */}
            <AttachmentUploader 
              logId={currentLogId} 
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />

          </div>
        </div>
      </div>
    </>
  );
};

export default CreateLogPage;
