import React, { useState, useContext } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', { username, password });
      
      // Save token and user info via context
      login(response.data.token, {
        userId: response.data.userId,
        username: response.data.username,
        fullName: response.data.fullName
      });

      toast.success('Login successful!');
      navigate('/home');

    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorMsg('Invalid username or password');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/favicon.png" alt="LearnTrack Logo" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Log in to your account</p>

        {errorMsg && (
          <div style={{ backgroundColor: 'var(--error-banner-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner"></div> : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
