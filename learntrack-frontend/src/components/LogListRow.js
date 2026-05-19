import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronDown, FiChevronUp, FiEdit2, FiTrash2,
  FiFileText, FiPaperclip, FiCalendar, FiLink,
  FiYoutube, FiImage, FiDownload, FiExternalLink,
  FiList, FiChevronRight,
} from 'react-icons/fi';
import api from '../api/axiosConfig';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

/* ── helper: YouTube embed ── */
const getEmbedUrl = (url) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
  } catch (_) {}
  return null;
};

/* ── attachment icon helper ── */
const AttIcon = ({ type }) => {
  if (type === 'YOUTUBE') return <FiYoutube size={13} style={{ color: '#EF4444', flexShrink: 0 }} />;
  if (type === 'LINK')    return <FiLink    size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />;
  if (type === 'IMAGE')   return <FiImage   size={13} style={{ color: '#8B5CF6', flexShrink: 0 }} />;
  return <FiFileText size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />;
};

/* ════════════════════════════════════════════════════════════ */
const LogListRow = ({ log, journeyId, onDelete }) => {
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [details,      setDetails]      = useState(null);   // fetched once on expand
  const [isFetching,   setIsFetching]   = useState(false);

  /* ── formatted dates ── */
  const formattedDate = new Date(log.logDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const formattedDateFull = new Date(log.logDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ── lazy-fetch on first expand ── */
  const handleToggle = useCallback(async () => {
    const expanding = !isExpanded;
    setIsExpanded(expanding);
    if (expanding && !details) {
      setIsFetching(true);
      try {
        const res = await api.get(`/api/logs/${log.id}`);
        setDetails(res.data);
      } catch (_) { /* silently ignore – counts still show */ }
      finally { setIsFetching(false); }
    }
  }, [isExpanded, details, log.id]);

  const notes       = details?.shortNotes   || [];
  const attachments = details?.attachments  || [];
  const description = details?.description  || log.description || '';

  /* ── description clamp (3 lines ≈ 4.5em) ── */
  const DESC_CLAMP = 3;

  return (
    <div style={{
      border:          '1px solid var(--border)',
      borderRadius:    '10px',
      overflow:        'hidden',
      backgroundColor: 'var(--bg-card)',
      transition:      'box-shadow 0.2s ease, border-color 0.2s ease',
      boxShadow:       isExpanded ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
      borderColor:     isExpanded ? 'var(--primary)' : 'var(--border)',
    }}>

      {/* ════════ ROW HEADER ════════ */}
      <div
        onClick={handleToggle}
        style={{
          display:         'flex',
          flexDirection:   'column',
          gap:             '0.55rem',
          padding:         '0.85rem 1rem',
          cursor:          'pointer',
          backgroundColor: isExpanded ? 'var(--day-header-expanded-bg)' : 'var(--bg-card)',
          userSelect:      'none',
          transition:      'background-color 0.2s ease',
        }}
      >
        {/* Sub-row 1: badge + title + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            backgroundColor: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '13px', flexShrink: 0,
          }}>
            {log.dayNumber}
          </div>

          <span style={{
            flexGrow: 1, fontWeight: '600', fontSize: '15px',
            color: 'var(--text-primary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
          }}>
            {log.title || `Day ${log.dayNumber}`}
          </span>

          <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </div>
        </div>

        {/* Sub-row 2: chips (always full-width, wraps on mobile) */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          gap: '0.4rem', paddingLeft: '44px',
        }}>
          <Chip icon={<FiCalendar size={11} />} label={formattedDate}
                bg="var(--bg-subtle)" color="var(--text-secondary)" />
          <Chip icon={<FiFileText size={11} />} label={`${log.shortNoteCount} Notes`}
                bg="rgba(77,142,255,0.12)" color="var(--primary)" />
          {log.attachmentCount > 0 && (
            <Chip icon={<FiPaperclip size={11} />} label={`${log.attachmentCount} Files`}
                  bg="rgba(22,163,74,0.12)" color="var(--success)" />
          )}
        </div>
      </div>

      {/* ════════ EXPANDED BODY ════════ */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding:   '1rem',
          display:   'flex', flexDirection: 'column', gap: '1rem',
          animation: 'slideDown 0.18s ease',
        }}>

          {/* Full date */}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <FiCalendar size={13} /> {formattedDateFull}
          </p>

          {/* ── Loading skeleton ── */}
          {isFetching && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[80, 100, 60].map((w, i) => (
                <div key={i} style={{
                  height: '14px', width: `${w}%`,
                  backgroundColor: 'var(--skeleton-bg)', borderRadius: '4px',
                  animation: 'pulse 1.5s infinite',
                }} />
              ))}
            </div>
          )}

          {/* ── Description with Show more / less ── */}
          {!isFetching && (
            description ? (
              <div>
                <p style={{
                  fontSize: '14px', color: 'var(--text-primary)',
                  lineHeight: '1.65', whiteSpace: 'pre-wrap', margin: 0,
                  backgroundColor: 'var(--bg-input)', padding: '0.75rem 1rem',
                  borderRadius: '6px', border: '1px solid var(--border)',
                  display: '-webkit-box',
                  WebkitLineClamp: showFullDesc ? 'unset' : DESC_CLAMP,
                  WebkitBoxOrient: 'vertical',
                  overflow: showFullDesc ? 'visible' : 'hidden',
                }}>
                  {description}
                </p>
                {/* Only show toggle if text is long enough to be clamped */}
                {description.length > 160 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowFullDesc(v => !v); }}
                    style={{
                      background: 'none', border: 'none', padding: '0.3rem 0',
                      color: 'var(--primary)', fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}
                  >
                    {showFullDesc ? 'Show less ↑' : 'Show more ↓'}
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                No description provided.
              </p>
            )
          )}

          {/* ── Short Notes ── */}
          {!isFetching && notes.length > 0 && (
            <Section icon={<FiList size={14} />} title={`Short Notes (${notes.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {notes.map((n) => (
                  <div key={n.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    fontSize: '13.5px', color: 'var(--text-primary)',
                    lineHeight: '1.5',
                  }}>
                    <FiChevronRight size={13} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                    <span>{n.content}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {!isFetching && !isFetching && notes.length === 0 && log.shortNoteCount > 0 && (
            /* Edge case: API returned but notes empty */ null
          )}

          {/* ── Attachments ── */}
          {!isFetching && attachments.length > 0 && (
            <Section icon={<FiPaperclip size={14} />} title={`Attachments (${attachments.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attachments.map((att) => (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    overflow: 'hidden',
                  }}>
                    <AttIcon type={att.attachmentType} />

                    <div style={{
                      flexGrow: 1, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontSize: '13px',
                    }}>
                      {(att.attachmentType === 'LINK' || att.attachmentType === 'YOUTUBE') ? (
                        <a href={att.linkUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.linkUrl}
                          </span>
                          <FiExternalLink size={11} style={{ flexShrink: 0 }} />
                        </a>
                      ) : (
                        <a href={`${API_BASE}${att.fileUrl}`} target="_blank" rel="noopener noreferrer" download
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.fileName}
                          </span>
                          <FiDownload size={11} style={{ flexShrink: 0 }} />
                        </a>
                      )}
                    </div>

                    {/* Image thumbnail */}
                    {att.attachmentType === 'IMAGE' && att.fileUrl && (
                      <img
                        src={`${API_BASE}${att.fileUrl}`}
                        alt={att.fileName}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
            <Link
              to={`/journey/${journeyId}/logs/${log.id}`}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', padding: '0.45rem 1rem' }}
            >
              <FiEdit2 size={13} /> View / Edit Log
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--error)', fontSize: '13px', padding: '0.45rem 0.9rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--error)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--error)'; }}
              onMouseOut={(e)  => { e.currentTarget.style.backgroundColor = 'transparent';  e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              title="Delete Log"
            >
              <FiTrash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:.45; } }
      `}</style>
    </div>
  );
};

/* ── Reusable section header ── */
const Section = ({ icon, title, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
      marginBottom: '0.5rem',
    }}>
      {icon} {title}
    </div>
    <div style={{
      backgroundColor: 'var(--bg-subtle)', borderRadius: '8px',
      padding: '0.75rem',
    }}>
      {children}
    </div>
  </div>
);

/* ── Chip ── */
const Chip = ({ icon, label, bg, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    backgroundColor: bg, color,
    padding: '0.2rem 0.6rem', borderRadius: '999px',
    fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap',
  }}>
    {icon} {label}
  </span>
);

export default LogListRow;
