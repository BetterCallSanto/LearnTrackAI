import React from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiFileText, FiPaperclip, FiCode } from 'react-icons/fi';

const LogCard = ({ log, journeyId, onDelete }) => {
  const formattedDate = new Date(log.logDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <span style={{ 
            display: 'inline-block',
            backgroundColor: 'rgba(77, 142, 255, 0.12)', 
            color: 'var(--primary)',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Day {log.dayNumber}
          </span>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {formattedDate}
          </div>
        </div>
        
        <button 
          onClick={() => onDelete(log.id)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            padding: '0.25rem'
          }}
          title="Delete Log"
        >
          <FiTrash2 />
        </button>
      </div>

      {/* Day Title */}
      {log.title && (
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: '0 0 0.5rem 0',
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          {log.title}
        </h4>
      )}

      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '14px',
        marginBottom: '1.5rem',
        flexGrow: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap'
      }}>
        {log.description || <span style={{ fontStyle: 'italic' }}>No description provided.</span>}
      </p>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '1.5rem', 
        fontSize: '13px', 
        color: 'var(--text-secondary)', 
        marginBottom: '1.5rem',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFileText /> {log.shortNoteCount} Short Notes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPaperclip /> {log.attachmentCount} Attachments
        </div>
        {log.codeSnippetCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCode /> {log.codeSnippetCount} Snippets
          </div>
        )}
      </div>

      <Link 
        to={`/journey/${journeyId}/logs/${log.id}`} 
        className="btn-secondary" 
        style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <FiEdit2 /> View / Edit Log
      </Link>
    </div>
  );
};

export default LogCard;
