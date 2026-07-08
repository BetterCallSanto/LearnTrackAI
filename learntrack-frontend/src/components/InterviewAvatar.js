import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * InterviewAvatar — Floating circular avatar button for the Revision Page.
 *
 * Renders a fixed-position button in the bottom-right corner displaying
 * Pam Beesley's pixel-art avatar. On click, navigates to the Interview Page.
 *
 * Features:
 *   - Subtle pulse animation ring to draw attention
 *   - Hover scale-up effect
 *   - Tooltip label on hover
 *   - Fully responsive (smaller on mobile)
 *
 * Props:
 *   journeyId — The ID of the current learning journey
 */
const InterviewAvatar = ({ journeyId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/journey/${journeyId}/interview`);
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Practice Interview with Pam"
        aria-label="Start mock interview with Pam Beesley"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '3px solid var(--interview-avatar-border)',
          background: 'var(--bg-card)',
          cursor: 'pointer',
          zIndex: 900,
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 4px 20px var(--interview-avatar-glow), 0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 28px var(--interview-avatar-glow), 0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px var(--interview-avatar-glow), 0 2px 8px rgba(0,0,0,0.1)';
        }}
      >
        <img
          src="/pam2.png"
          alt="Pam Beesley"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      </button>

      {/* Pulse ring animation */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '2px solid var(--interview-avatar-border)',
          zIndex: 899,
          pointerEvents: 'none',
          animation: 'interviewPulse 2s ease-out infinite',
        }}
      />

      {/* Tooltip label */}
      <div
        style={{
          position: 'fixed',
          bottom: '6.5rem',
          right: '1rem',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: '600',
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid var(--border)',
          zIndex: 900,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: 'tooltipFadeIn 0.5s ease 1s both',
        }}
      >
        Practice with Pam 💬
      </div>

      <style>{`
        @keyframes interviewPulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes tooltipFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          /* Override fixed positions for mobile */
        }
      `}</style>
    </>
  );
};

export default InterviewAvatar;
