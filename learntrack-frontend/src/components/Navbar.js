import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiBookOpen } from 'react-icons/fi';

const Navbar = ({ leftContent, rightContent }) => {
  const { user, logout } = useContext(AuthContext);
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
          {rightContent ? rightContent : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span className="hide-mobile" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Hello, <strong style={{ color: 'var(--text-primary)' }}>{user.fullName || user.username}</strong>
            </span>
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
