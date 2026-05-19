import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiBookOpen, FiSun, FiMoon } from 'react-icons/fi';

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
            <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', fontSize: '1.25rem' }}>
              <FiBookOpen size={24} />
              LearnTrack
            </Link>
          )}
        </div>

        <div>
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
