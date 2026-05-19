import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiCheckSquare, FiTrash2, FiEdit2, FiCheck } from 'react-icons/fi';

const JourneyCard = ({ journey, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(journey.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editName.trim() && editName !== journey.name) {
      onUpdate(journey.id, editName.trim());
    } else {
      setEditName(journey.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditName(journey.name);
      setIsEditing(false);
    }
  };

  const formattedDate = new Date(journey.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0,
              padding: '0.1rem 0.4rem',
              border: '1px solid var(--primary)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              width: '100%',
              marginRight: '0.5rem'
            }}
          />
        ) : (
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, lineHeight: '1.4' }}>
            {journey.name}
          </h3>
        )}

        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ 
                background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.25rem', cursor: 'pointer'
              }}
              title="Rename Journey"
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <FiEdit2 />
            </button>
          ) : (
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
              style={{ 
                background: 'none', border: 'none', color: 'var(--success)', padding: '0.25rem', cursor: 'pointer'
              }}
              title="Save"
            >
              <FiCheck />
            </button>
          )}

          <button 
            onClick={() => onDelete(journey.id)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.25rem', cursor: 'pointer'
            }}
            title="Delete Journey"
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '14px', 
        marginBottom: '1.5rem',
        flexGrow: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {journey.description || 'No description provided.'}
      </p>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        <span>{journey.daysLogged} Days Logged</span>
        <span>•</span>
        <span>Created {formattedDate}</span>
      </div>

      <div className="flex-mobile-col" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
        <Link 
          to={`/journey/${journey.id}/logs`} 
          className="btn-primary" 
          style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <FiBook /> Learning Process
        </Link>
        <Link 
          to={`/journey/${journey.id}/revision`} 
          className="btn-secondary" 
          style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <FiCheckSquare /> Revision
        </Link>
      </div>
    </div>
  );
};

export default JourneyCard;
