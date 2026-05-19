import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import LogCard from '../components/LogCard';
import LogListRow from '../components/LogListRow';
import { FiArrowLeft, FiPlus, FiBookOpen, FiGrid, FiList } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const JourneyDetailPage = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode: 'grid' | 'list' — persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('logsViewMode') || 'grid';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('logsViewMode', mode);
  };

  const fetchData = useCallback(async () => {
    try {
      const [journeyRes, logsRes] = await Promise.all([
        api.get(`/api/journeys/${id}`),
        api.get(`/api/journeys/${id}/logs`)
      ]);
      setJourney(journeyRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error('Failed to load journey details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Are you sure you want to delete this log? All notes and attachments will be permanently deleted.')) {
      try {
        await api.delete(`/api/logs/${logId}`);
        toast.success('Log deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete log');
      }
    }
  };

  if (isLoading) return <div className="page-wrapper"><Navbar /><div className="container" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div></div></div>;
  if (!journey) return <div className="page-wrapper"><Navbar /><div className="container">Journey not found</div></div>;

  return (
    <>
      <Navbar leftContent={
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <FiArrowLeft /> Back to Home
        </Link>
      } />
      <div className="page-wrapper">
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            
            <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FiBookOpen style={{ color: 'var(--primary)' }} />
                  {journey.name}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px' }}>
                  {journey.description || 'No description provided.'}
                </p>
              </div>
              
              <Link to={`/journey/${id}/logs/new`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
                <FiPlus size={18} /> Add Today's Log
              </Link>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

          {/* ── Section Header with view toggle ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Daily Logs</h2>

            {logs.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px',
              }}>
                {/* Grid button */}
                <button
                  onClick={() => handleSetViewMode('grid')}
                  title="Grid view"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <FiGrid size={15} />
                </button>

                {/* List button */}
                <button
                  onClick={() => handleSetViewMode('list')}
                  title="List view"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <FiList size={15} />
                </button>
              </div>
            )}
          </div>

          {logs.length > 0 ? (
            viewMode === 'grid' ? (
              /* ── Grid View ── */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {logs.map(log => (
                  <LogCard
                    key={log.id}
                    log={log}
                    journeyId={id}
                    onDelete={handleDeleteLog}
                  />
                ))}
              </div>
            ) : (
              /* ── List View ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map((log, index) => (
                  <LogListRow
                    key={log.id}
                    log={log}
                    journeyId={id}
                    onDelete={handleDeleteLog}
                    index={index}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>No days logged yet.</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Click "Add Today's Log" to start your Day 1!</p>
              <Link to={`/journey/${id}/logs/new`} className="btn-primary">Add Today's Log</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JourneyDetailPage;
