import React, { useState, useContext } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific validation error when typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errors = {};
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (/\s/.test(formData.username)) {
      errors.username = 'Username cannot contain spaces';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      await api.post('/api/auth/register', {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      toast.success('Registration successful! Please login.');
      
      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', margin: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/favicon.png" alt="LearnTrack Logo" className="brand-logo-standalone" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Create Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start your learning journey tracking today</p>

        {errorMsg && (
          <div style={{ backgroundColor: 'var(--error-banner-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              className="form-control" 
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              name="username"
              className="form-control" 
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              maxLength="50"
            />
            {validationErrors.username && <div className="text-error">{validationErrors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              name="email"
              className="form-control" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              name="password"
              className="form-control" 
              value={formData.password}
              onChange={handleChange}
              required
            />
            {validationErrors.password && <div className="text-error">{validationErrors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              className="form-control" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {validationErrors.confirmPassword && <div className="text-error">{validationErrors.confirmPassword}</div>}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner"></div> : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
