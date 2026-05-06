import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreateJourneyPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/api/journeys', { name, description });
      toast.success('Journey created successfully!');
      // Navigate straight to the new journey's detail page
      navigate(`/journey/${response.data.id}/logs`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create journey');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar leftContent={
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <FiArrowLeft /> Back to Home
        </Link>
      } />
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '700' }}>Create New Journey</h2>
          
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Journey Name <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Learning React JS"
                  maxLength="150"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-control" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what you plan to learn..."
                  rows="4"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="flex-mobile-col" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Link to="/home" className="btn-secondary">Cancel</Link>
                <button type="submit" className="btn-primary" disabled={isLoading || !name.trim()}>
                  {isLoading ? <div className="spinner"></div> : 'Create Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateJourneyPage;
