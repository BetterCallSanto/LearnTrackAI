import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import ShortNoteItem from '../components/ShortNoteItem';
import AttachmentUploader from '../components/AttachmentUploader';
import CodeSnippet from '../components/CodeSnippet';
import { FiArrowLeft, FiSave, FiList, FiCode, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreateLogPage = () => {
  const { id, logId } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = Boolean(logId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [log, setLog] = useState({ title: '', description: '', dayNumber: null, logDate: new Date(), codeSnippetsEnabled: false });
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [snippets, setSnippets] = useState([]);
  
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
          setSnippets(res.data.codeSnippets || []);
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
      let targetLogId = currentLogId;

      if (isEditMode) {
        await api.put(`/api/logs/${targetLogId}`, { title: log.title, description: log.description });
      } else {
        const logRes = await api.post(`/api/journeys/${id}/logs`, { title: log.title, description: log.description });
        targetLogId = logRes.data.id;
      }

      // Notes
      for (const note of notes) {
        if (note.isDraft) {
          await api.post(`/api/logs/${targetLogId}/notes`, { content: note.content });
        } else if (isEditMode) {
          await api.put(`/api/notes/${note.id}`, { content: note.content });
        }
      }

      // Attachments
      for (const att of attachments) {
        if (att.isDraft) {
          let formData = new FormData();
          formData.append('attachmentType', att.attachmentType);
          if (att.attachmentType === 'FILE' || att.attachmentType === 'IMAGE') {
            formData.append('file', att.file);
          } else {
            formData.append('linkUrl', att.linkUrl);
          }
          await api.post(`/api/logs/${targetLogId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      // Snippets
      if (log.codeSnippetsEnabled) {
        await api.patch(`/api/logs/${targetLogId}/toggle-snippets`, { enabled: true });
        for (const snippet of snippets) {
          if (snippet.isDraft) {
            await api.post(`/api/logs/${targetLogId}/snippets`, { 
              title: snippet.title, 
              language: snippet.language, 
              code: snippet.code,
              editorHeight: snippet.editorHeight 
            });
          } else if (isEditMode) {
            await api.put(`/api/snippets/${snippet.id}`, { 
              title: snippet.title, 
              language: snippet.language, 
              code: snippet.code,
              editorHeight: snippet.editorHeight
            });
          }
        }
      } else if (isEditMode) {
        await api.patch(`/api/logs/${targetLogId}/toggle-snippets`, { enabled: false });
      }

      toast.success(isEditMode ? 'Log updated successfully' : 'Log saved successfully');
      navigate(`/journey/${id}/logs`);
      
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

  const handleToggleSnippets = async () => {
    const newState = !log.codeSnippetsEnabled;
    setLog({ ...log, codeSnippetsEnabled: newState });
    if (currentLogId) {
      try {
        await api.patch(`/api/logs/${currentLogId}/toggle-snippets`, { enabled: newState });
      } catch (e) {
        toast.error('Failed to toggle code snippets');
        setLog({ ...log, codeSnippetsEnabled: !newState });
      }
    }
  };

  const handleAddSnippet = () => {
    const javaTemplate = `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`;
    setSnippets([...snippets, { id: `draft-${Date.now()}`, isDraft: true, title: 'Untitled Snippet', language: 'java', code: javaTemplate }]);
  };

  const handleDeleteSnippet = async (id) => {
    if (window.confirm('Delete this code snippet?')) {
      const snippet = snippets.find(s => s.id === id);
      if (snippet && snippet.isDraft) {
        setSnippets(snippets.filter(s => s.id !== id));
        return;
      }
      try {
        await api.delete(`/api/snippets/${id}`);
        setSnippets(snippets.filter(s => s.id !== id));
      } catch (e) {
        toast.error('Failed to delete snippet');
      }
    }
  };

  const handleUpdateSnippet = (updated) => {
    setSnippets(snippets.map(s => s.id === updated.id || (s.isDraft && s.id === updated.id) ? updated : s));
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

            {/* Code Snippets Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCode /> Code Snippet Interactive Compiler
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Enable Compiler</span>
                  <div style={{ position: 'relative', width: '40px', height: '24px', backgroundColor: log.codeSnippetsEnabled ? 'var(--primary)' : 'var(--border)', borderRadius: '12px', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: log.codeSnippetsEnabled ? '18px' : '2px', width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                  </div>
                  <input type="checkbox" style={{ display: 'none' }} checked={log.codeSnippetsEnabled} onChange={handleToggleSnippets} />
                </label>
              </div>

              {log.codeSnippetsEnabled && (
                <div style={{ marginBottom: '1rem' }}>
                  {snippets.map(snippet => (
                    <CodeSnippet
                      key={snippet.id}
                      snippet={snippet}
                      logId={currentLogId}
                      onDelete={handleDeleteSnippet}
                      onUpdate={handleUpdateSnippet}
                    />
                  ))}
                  
                  <button 
                    className="btn-secondary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderStyle: 'dashed' }}
                    onClick={handleAddSnippet}
                  >
                    <FiPlus /> Add Code Snippet
                  </button>
                </div>
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
