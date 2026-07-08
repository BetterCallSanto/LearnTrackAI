import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import ImageLightbox from '../components/ImageLightbox';
import InterviewAvatar from '../components/InterviewAvatar';
import CodeSnippet from '../components/CodeSnippet';
import { FiArrowLeft, FiCheckSquare, FiRefreshCcw, FiChevronDown, FiChevronRight, FiPaperclip, FiImage, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const RevisionPage = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [dayGroups, setDayGroups] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* attachments cache: { [logId]: [{type, url, name}] } */
  const [attachCache, setAttachCache] = useState({});
  const [loadingAttach, setLoadingAttach] = useState({});

  /* snippets cache: { [logId]: [CodeSnippet] } */
  const [snippetCache, setSnippetCache] = useState({});
  const [loadingSnippets, setLoadingSnippets] = useState({});

  /* dropdown open state — which logId's dropdown is open */
  const [openDropdown, setOpenDropdown] = useState(null);

  /* lightbox state */
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [journeyRes, revisionRes] = await Promise.all([
        api.get(`/api/journeys/${id}`),
        api.get(`/api/journeys/${id}/revision`)
      ]);

      setJourney(journeyRes.data);
      setDayGroups(revisionRes.data.dayGroups || []);

      if (revisionRes.data.dayGroups && revisionRes.data.dayGroups.length > 0) {
        const groups = revisionRes.data.dayGroups;
        let firstIncomplete = groups[0].dayNumber;
        for (const group of groups) {
          if (!group.notes.every(n => n.isRevised)) {
            firstIncomplete = group.dayNumber;
            break;
          }
        }
        setActiveDay(firstIncomplete);
      }
    } catch (error) {
      toast.error('Failed to load revision data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Fetch attachments (IMAGE + FILE only) for a log ── */
  const fetchAttachments = useCallback(async (logId) => {
    if (!logId || attachCache[logId] || loadingAttach[logId]) return;
    setLoadingAttach(prev => ({ ...prev, [logId]: true }));
    try {
      const res = await api.get(`/api/logs/${logId}`);
      const items = (res.data.attachments || [])
        .filter(att => att.attachmentType === 'IMAGE' || att.attachmentType === 'FILE')
        .map(att => ({
          type: att.attachmentType,
          name: att.fileName || 'Untitled',
          url: att.fileUrl ? `${API_BASE}${att.fileUrl}` : null,
        }))
        .filter(a => a.url);
      setAttachCache(prev => ({ ...prev, [logId]: items }));
    } catch (_) {
      setAttachCache(prev => ({ ...prev, [logId]: [] }));
    } finally {
      setLoadingAttach(prev => ({ ...prev, [logId]: false }));
    }
  }, [attachCache, loadingAttach]);

  /* ── Fetch snippets for a log ── */
  const fetchSnippets = useCallback(async (logId) => {
    if (!logId || snippetCache[logId] || loadingSnippets[logId]) return;
    setLoadingSnippets(prev => ({ ...prev, [logId]: true }));
    try {
      const res = await api.get(`/api/logs/${logId}`);
      setSnippetCache(prev => ({ ...prev, [logId]: res.data.codeSnippets || [] }));
    } catch (_) {
      setSnippetCache(prev => ({ ...prev, [logId]: [] }));
    } finally {
      setLoadingSnippets(prev => ({ ...prev, [logId]: false }));
    }
  }, [snippetCache, loadingSnippets]);

  // Auto-fetch attachments and snippets for the active day
  useEffect(() => {
    if (activeDay !== null && dayGroups.length > 0) {
      const activeGroup = dayGroups.find(g => g.dayNumber === activeDay);
      if (activeGroup && activeGroup.logId) {
        fetchAttachments(activeGroup.logId);
        fetchSnippets(activeGroup.logId);
      }
    }
  }, [activeDay, dayGroups, fetchAttachments, fetchSnippets]);

  /* ── Day toggle ── */
  const handleDayToggle = useCallback((dayNumber) => {
    const expanding = activeDay !== dayNumber;
    setActiveDay(expanding ? dayNumber : null);
    setOpenDropdown(null);
  }, [activeDay]);

  /* ── Note toggle ── */
  const toggleNote = async (dayNumber, noteId) => {
    try {
      let newDayGroups = [...dayGroups];
      let dayGroup = newDayGroups.find(g => g.dayNumber === dayNumber);
      let note = dayGroup.notes.find(n => n.id === noteId);

      const wasRevised = note.isRevised;
      note.isRevised = !note.isRevised;
      setDayGroups(newDayGroups);

      await api.patch(`/api/notes/${noteId}/revise`);

      if (!wasRevised) {
        const isDayComplete = dayGroup.notes.every(n => n.isRevised);
        if (isDayComplete) {
          const currentIndex = newDayGroups.findIndex(g => g.dayNumber === dayNumber);
          if (currentIndex < newDayGroups.length - 1) {
            const nextGroup = newDayGroups[currentIndex + 1];
            setTimeout(() => {
              setActiveDay(nextGroup.dayNumber);
              toast.success(`Day ${dayNumber} complete! Moving to Day ${nextGroup.dayNumber}`);
            }, 600);
          } else {
            setTimeout(() => {
              toast.success('🎉 Great job! You have revised all your notes!', { duration: 5000 });
            }, 600);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to update note');
      fetchData();
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Are you sure you want to reset all revision progress? This will uncheck all notes.')) {
      try {
        await api.post(`/api/journeys/${id}/revision/reset`);
        toast.success('All progress reset');
        fetchData();
      } catch (error) {
        toast.error('Failed to reset progress');
      }
    }
  };

  /* ── Lightbox helpers ── */
  const openLightbox = (images, index) => { setOpenDropdown(null); setLightbox({ open: true, images, index }); };
  const closeLightbox = () => setLightbox({ open: false, images: [], index: 0 });
  const prevImage = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const nextImage = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  /* ── Handle attachment click ── */
  const handleAttachmentClick = (att, allImages, imgIndex) => {
    const isImage = (att.type || '').toUpperCase() === 'IMAGE';
    if (isImage && allImages.length > 0) {
      openLightbox(allImages, Math.max(0, imgIndex));
    } else {
      // PDF / file — open in new tab
      window.open(att.url, '_blank', 'noopener');
    }
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openDropdown]);

  if (isLoading) return <div className="page-wrapper"><Navbar /><div className="container" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div></div></div>;
  if (!journey) return <div className="page-wrapper"><Navbar /><div className="container">Journey not found</div></div>;

  let totalNotes = 0;
  let revisedNotes = 0;
  dayGroups.forEach(group => {
    totalNotes += group.notes.length;
    revisedNotes += group.notes.filter(n => n.isRevised).length;
  });

  const progressPercent = totalNotes === 0 ? 0 : Math.round((revisedNotes / totalNotes) * 100);
  const isAllComplete = totalNotes > 0 && revisedNotes === totalNotes;

  return (
    <>
      <Navbar leftContent={
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <FiArrowLeft /> Back to Home
        </Link>
      } />
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FiCheckSquare style={{ color: 'var(--success)' }} />
                  Revision: {journey.name}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  Review your short notes day by day to reinforce your learning.
                </p>
              </div>

              <button
                onClick={handleResetAll}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={revisedNotes === 0}
              >
                <FiRefreshCcw size={16} /> Reset All
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '14px', fontWeight: '500' }}>
                <span>Revision Progress</span>
                <span>{revisedNotes} / {totalNotes} notes revised ({progressPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--success)', width: `${progressPercent}%`, transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>

          {isAllComplete && (
            <div style={{ backgroundColor: 'var(--success-banner-bg)', color: 'var(--success-banner-color)', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--success-banner-border)' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Great job!</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>You have successfully revised all your notes for this journey.</p>
              </div>
            </div>
          )}

          {dayGroups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dayGroups.map((group) => {
                const isExpanded = activeDay === group.dayNumber;
                const isDayComplete = group.notes.every(n => n.isRevised);
                const dateStr = new Date(group.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const attachments = attachCache[group.logId] || [];
                const snippets = snippetCache[group.logId] || [];
                const isDropdownOpen = openDropdown === group.logId;
                const imageAttachments = attachments.filter(a => a.type === 'IMAGE').map(a => ({ url: a.url, name: a.name }));

                return (
                  <div key={group.dayNumber} className="card" style={{ padding: '0', overflow: 'visible', borderLeft: isDayComplete ? '4px solid var(--success)' : '4px solid var(--primary)' }}>
                    <button
                      onClick={() => handleDayToggle(group.dayNumber, group.logId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem 1.5rem',
                        background: isExpanded ? 'var(--day-header-expanded-bg)' : 'var(--day-header-base-bg)',
                        border: 'none',
                        borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: isExpanded ? '0' : '0 8px 8px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                        <span style={{
                          fontWeight: '600', fontSize: '1.05rem',
                          color: isDayComplete ? 'var(--text-secondary)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block'
                        }}>
                          Day {group.dayNumber}{group.title ? `: ${group.title}` : ''}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {dateStr} • {group.notes.length} notes
                        </span>
                        {isDayComplete && <FiCheckSquare color="var(--success)" />}
                      </div>

                      {/* Right side: file icon + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, position: 'relative' }}>

                        {/* File icon button — shows only when expanded and has attachments */}
                        {isExpanded && attachments.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(isDropdownOpen ? null : group.logId);
                            }}
                            title={`${attachments.length} file(s) attached`}
                            style={{
                              width: '32px', height: '32px', borderRadius: '6px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: isDropdownOpen ? 'var(--primary)' : 'rgba(77, 142, 255, 0.12)',
                              color: isDropdownOpen ? 'white' : 'var(--primary)',
                              cursor: 'pointer', transition: 'all 0.15s ease',
                              position: 'relative',
                            }}
                          >
                            <FiPaperclip size={16} />
                            {/* badge count */}
                            <span style={{
                              position: 'absolute', top: '-5px', right: '-5px',
                              backgroundColor: 'var(--primary)', color: 'white',
                              fontSize: '10px', fontWeight: '700',
                              width: '16px', height: '16px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}>
                              {attachments.length}
                            </span>
                          </div>
                        )}

                        {/* Loading indicator for attachments or snippets */}
                        {isExpanded && (loadingAttach[group.logId] || loadingSnippets[group.logId]) && (
                          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                        )}

                        {/* Dropdown menu */}
                        {isDropdownOpen && (
                          <AttachDropdown
                            attachments={attachments}
                            imageAttachments={imageAttachments}
                            onSelect={handleAttachmentClick}
                          />
                        )}

                        {isExpanded ? <FiChevronDown size={20} color="var(--text-secondary)" /> : <FiChevronRight size={20} color="var(--text-secondary)" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '1.25rem' }}>
                        {snippets.length > 0 && (
                          <div style={{ marginBottom: '1.5rem' }}>
                            {snippets.map(snippet => (
                              <CodeSnippet
                                key={snippet.id}
                                snippet={snippet}
                                logId={group.logId}
                                isRevisionMode={true}
                                onUpdate={(updated) => {
                                  if (snippetCache[group.logId]) {
                                    const updatedSnippets = snippetCache[group.logId].map(s => s.id === updated.id ? updated : s);
                                    setSnippetCache(prev => ({ ...prev, [group.logId]: updatedSnippets }));
                                  }
                                }}
                                onDelete={() => {}}
                              />
                            ))}
                          </div>
                        )}
                        
                        {group.notes.map(note => (
                          <label
                            key={note.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.7rem 0.75rem',
                              backgroundColor: note.isRevised ? 'var(--bg-hover-row)' : 'var(--bg-card)',
                              borderRadius: '6px',
                              marginBottom: '0.4rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={note.isRevised}
                              onChange={() => toggleNote(group.dayNumber, note.id)}
                              style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--success)', cursor: 'pointer' }}
                            />
                            <span style={{
                              fontSize: '15px',
                              lineHeight: '1.5',
                              color: note.isRevised ? 'var(--revised)' : 'var(--text-primary)',
                              textDecoration: note.isRevised ? 'line-through' : 'none'
                            }}>
                              {note.content}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>No short notes to revise yet.</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add short notes in your daily logs to start your revision process.</p>
              <Link to={`/journey/${id}/logs`} className="btn-primary">Go to Daily Logs</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Interview Avatar ── */}
      <InterviewAvatar journeyId={id} />

      {/* ── Lightbox Modal ── */}
      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════
 * AttachDropdown — popover listing IMAGE and FILE items
 * ═══════════════════════════════════════════════════════ */
const AttachDropdown = ({ attachments, imageAttachments, onSelect }) => {
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '40px',
        right: 0,
        width: '260px',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        zIndex: 100,
        animation: 'dropIn 0.15s ease',
        padding: '0.4rem',
      }}
    >
      {/* header */}
      <div style={{
        padding: '0.5rem 0.6rem 0.4rem',
        fontSize: '12px', fontWeight: '600',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border)',
        marginBottom: '0.3rem',
        display: 'flex', alignItems: 'center', gap: '0.3rem',
      }}>
        <FiPaperclip size={12} /> Attachments ({attachments.length})
      </div>

      {attachments.map((att, idx) => {
        const isImage = att.type === 'IMAGE';
        const imgIndex = isImage
          ? imageAttachments.findIndex(img => img.url === att.url)
          : -1;

        return (
          <div
            key={idx}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(att, imageAttachments, imgIndex); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.55rem 0.6rem',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.12s ease',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Icon */}
            {isImage ? (
              <FiImage size={15} style={{ color: '#8B5CF6', flexShrink: 0 }} />
            ) : (
              <FiFileText size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            )}

            {/* Name */}
            <span style={{
              flexGrow: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {att.name}
            </span>

            {/* Thumbnail for images */}
            {isImage && (
              <img
                src={att.url}
                alt=""
                style={{
                  width: '32px', height: '32px',
                  objectFit: 'cover', borderRadius: '4px',
                  flexShrink: 0, border: '1px solid var(--border)',
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
};

export default RevisionPage;
