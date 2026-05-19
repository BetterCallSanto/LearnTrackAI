import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

/**
 * ImageLightbox — fullscreen preview overlay for images.
 *
 * Props:
 *   images  — [{url, name}]
 *   index   — currently active index
 *   onClose — () => void
 *   onPrev  — () => void
 *   onNext  — () => void
 */
const ImageLightbox = ({ images, index, onClose, onPrev, onNext }) => {
  const current = images[index];
  const hasMultiple = images.length > 1;
  const [imgError, setImgError] = useState(false);

  /* Reset error state when index changes */
  useEffect(() => { setImgError(false); }, [index]);

  /* keyboard navigation */
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (hasMultiple && e.key === 'ArrowLeft' && onPrev) onPrev();
    if (hasMultiple && e.key === 'ArrowRight' && onNext) onNext();
  }, [onClose, onPrev, onNext, hasMultiple]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!current) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem',
        padding: '1rem',
        animation: 'lbFadeIn 0.2s ease',
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer', fontSize: '20px',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      >
        <FiX size={22} />
      </button>

      {/* Counter */}
      {hasMultiple && (
        <div style={{
          position: 'absolute', top: '1.1rem', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500',
        }}>
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev arrow */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}
          className="lb-btn lb-prev"
        >
          <FiChevronLeft size={24} />
        </button>
      )}

      {/* Image or error fallback */}
      {imgError ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '1rem', color: 'rgba(255,255,255,0.6)', padding: '3rem',
            backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px',
          }}
        >
          <FiAlertCircle size={48} />
          <span style={{ fontSize: '16px', fontWeight: '500' }}>Image not available</span>
          <span style={{ fontSize: '13px' }}>The file may have been deleted or is inaccessible.</span>
        </div>
      ) : (
        <img
          src={current.url}
          alt={current.name || 'Preview'}
          onClick={(e) => e.stopPropagation()}
          onError={() => setImgError(true)}
          className="lb-img"
        />
      )}

      {/* Filename label */}
      {current.name && (
        <div style={{
          color: 'rgba(255,255,255,0.65)', fontSize: '13px',
          maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', textAlign: 'center',
        }}>
          {current.name}
        </div>
      )}

      {/* Next arrow */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
          className="lb-btn lb-next"
        >
          <FiChevronRight size={24} />
        </button>
      )}

      <style>{`
        @keyframes lbFadeIn { from { opacity:0; } to { opacity:1; } }
        .lb-img {
          max-width: 90vw;
          max-height: 82vh;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          user-select: none;
        }
        .lb-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lb-btn:hover {
          background: rgba(255,255,255,0.25);
        }
        .lb-prev { left: 0.75rem; }
        .lb-next { right: 0.75rem; }

        @media (max-width: 600px) {
          .lb-btn {
            top: auto;
            bottom: 2rem;
            transform: none;
          }
          .lb-prev { left: 2rem; }
          .lb-next { right: 2rem; }
          .lb-img {
            max-width: 95vw;
            max-height: 70vh;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageLightbox;
