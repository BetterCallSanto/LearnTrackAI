import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiSun, FiMoon, FiTerminal } from 'react-icons/fi';

const Navbar = ({ leftContent, rightContent }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4rem',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 1000,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        <div>
          {leftContent ? leftContent : (
            <Link to="/home" className="brand-logo-link" style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.25rem' }}>
              <img src="/favicon.png" alt="LearnTrack Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span className="gold-shimmer-text" style={{
                fontWeight: '800'
              }}>LearnTrack</span>
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Logo Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link 
              to="/compiler"
              title="Universal Compiler"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                overflow: 'hidden',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                background: isDark ? 'rgba(30, 30, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: isDark 
                  ? '0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)';
                e.currentTarget.style.background = isDark ? 'rgba(45, 45, 45, 0.75)' : 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.16)';
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.22)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = isDark ? 'rgba(30, 30, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.75)';
              }}
            >
              <FiTerminal size={18} />
            </Link>
          </div>

          {rightContent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {rightContent}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--theme-toggle-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
          ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span className="hide-mobile" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Hello, <strong style={{ color: 'var(--text-primary)' }}>{user.fullName || user.username}</strong>
            </span>
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--theme-toggle-bg)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <FiLogOut /> Logout
            </button>
          </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
