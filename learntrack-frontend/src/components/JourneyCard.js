import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiCheckSquare, FiEdit2, FiTrash2 } from 'react-icons/fi';

const JourneyCard = ({ journey, onDelete }) => {
  const formattedDate = new Date(journey.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, lineHeight: '1.4' }}>
          {journey.name}
        </h3>
        <button 
          onClick={() => onDelete(journey.id)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            padding: '0.25rem',
            marginLeft: '0.5rem'
          }}
          title="Delete Journey"
        >
          <FiTrash2 />
        </button>
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
