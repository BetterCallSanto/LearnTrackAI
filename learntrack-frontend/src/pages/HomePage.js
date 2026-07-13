import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import JourneyCard from '../components/JourneyCard';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

import DwightChatbot from '../components/DwightChatbot';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [journeys, setJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      const response = await api.get('/api/journeys');
      setJourneys(response.data);
    } catch (error) {
      toast.error('Failed to load journeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this journey? All logs and notes will be permanently lost.')) {
      try {
        await api.delete(`/api/journeys/${id}`);
        setJourneys(journeys.filter(j => j.id !== id));
        toast.success('Journey deleted');
      } catch (error) {
        toast.error('Failed to delete journey');
      }
    }
  };

  const handleUpdate = async (id, newName) => {
    try {
      const targetJourney = journeys.find(j => j.id === id);
      const response = await api.put(`/api/journeys/${id}`, { 
        name: newName, 
        description: targetJourney.description || '' 
      });
      setJourneys(journeys.map(j => j.id === id ? { ...j, name: response.data.name } : j));
      toast.success('Journey renamed');
    } catch (error) {
      toast.error('Failed to rename journey');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="container">
          <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back, {user?.fullName || user?.username}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Ready to continue your learning?</p>
            </div>
            <Link to="/journey/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
              <FiPlus size={18} /> Create New Journey
            </Link>
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>My Learning Journeys</h2>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ height: '24px', background: 'var(--skeleton-bg)', borderRadius: '4px', width: '70%', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '16px', background: 'var(--skeleton-bg)', borderRadius: '4px', width: '100%', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '16px', background: 'var(--skeleton-bg)', borderRadius: '4px', width: '80%', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ marginTop: 'auto', height: '38px', background: 'var(--skeleton-bg)', borderRadius: '6px', width: '100%', animation: 'pulse 1.5s infinite' }}></div>
                </div>
              ))}
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
            </div>
          ) : journeys.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {journeys.map(journey => (
                <JourneyCard 
                  key={journey.id} 
                  journey={journey} 
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>No learning journeys yet. Start your first one!</h3>
              <Link to="/journey/create" className="btn-primary">Create New Journey</Link>
            </div>
          )}
        </div>
      </div>
      <DwightChatbot />
    </>
  );
};

export default HomePage;
