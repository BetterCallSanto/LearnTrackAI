import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { FiArrowLeft, FiCheckSquare, FiRefreshCcw, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const RevisionPage = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [dayGroups, setDayGroups] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [journeyRes, revisionRes] = await Promise.all([
        api.get(`/api/journeys/${id}`),
        api.get(`/api/journeys/${id}/revision`)
      ]);
      
      setJourney(journeyRes.data);
      setDayGroups(revisionRes.data.dayGroups || []);
      
      // Find the first day that isn't fully completed, or just expand Day 1
      if (revisionRes.data.dayGroups && revisionRes.data.dayGroups.length > 0) {
        const groups = revisionRes.data.dayGroups;
        let firstIncomplete = groups[0].dayNumber;
        for (const group of groups) {
          const isComplete = group.notes.every(n => n.isRevised);
          if (!isComplete) {
            firstIncomplete = group.dayNumber;
            break;
          }
        }
        setActiveDay(firstIncomplete);
      }
      
    } catch (error) {
      toast.error('Failed to load revision data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleNote = async (dayNumber, noteId) => {
    try {
      // Optimistic update
      let newDayGroups = [...dayGroups];
      let dayGroup = newDayGroups.find(g => g.dayNumber === dayNumber);
      let note = dayGroup.notes.find(n => n.id === noteId);
      
      const wasRevised = note.isRevised;
      note.isRevised = !note.isRevised;
      setDayGroups(newDayGroups);

      // API call
      await api.patch(`/api/notes/${noteId}/revise`);
      
      // If we just completed this day, auto-expand the next day
      if (!wasRevised) { // i.e., we just checked it
        const isDayComplete = dayGroup.notes.every(n => n.isRevised);
        if (isDayComplete) {
          const currentIndex = newDayGroups.findIndex(g => g.dayNumber === dayNumber);
          if (currentIndex < newDayGroups.length - 1) {
            const nextDayNumber = newDayGroups[currentIndex + 1].dayNumber;
            // Delay slightly for UX
            setTimeout(() => {
              setActiveDay(nextDayNumber);
              toast.success(`Day ${dayNumber} complete! Moving to Day ${nextDayNumber}`);
            }, 600);
          } else {
            setTimeout(() => {
              toast.success('🎉 Great job! You have revised all your notes!', { duration: 5000 });
            }, 600);
          }
        }
      }

    } catch (error) {
      toast.error('Failed to update note');
      // Revert optimistic update
      fetchData();
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Are you sure you want to reset all revision progress? This will uncheck all notes.')) {
      try {
        await api.post(`/api/journeys/${id}/revision/reset`);
        toast.success('All progress reset');
        fetchData(); // Reload data
      } catch (error) {
        toast.error('Failed to reset progress');
      }
    }
  };

  if (isLoading) return <div className="page-wrapper"><Navbar /><div className="container" style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div></div></div>;
  if (!journey) return <div className="page-wrapper"><Navbar /><div className="container">Journey not found</div></div>;

  // Calculate progress
  let totalNotes = 0;
  let revisedNotes = 0;
  dayGroups.forEach(group => {
    totalNotes += group.notes.length;
    revisedNotes += group.notes.filter(n => n.isRevised).length;
  });
  
  const progressPercent = totalNotes === 0 ? 0 : Math.round((revisedNotes / totalNotes) * 100);
  const isAllComplete = totalNotes > 0 && revisedNotes === totalNotes;

  return (
    <>
      <Navbar leftContent={
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <FiArrowLeft /> Back to Home
        </Link>
      } />
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FiCheckSquare style={{ color: 'var(--success)' }} />
                  Revision: {journey.name}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  Review your short notes day by day to reinforce your learning.
                </p>
              </div>
              
              <button 
                onClick={handleResetAll} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={revisedNotes === 0}
              >
                <FiRefreshCcw size={16} /> Reset All
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '14px', fontWeight: '500' }}>
                <span>Revision Progress</span>
                <span>{revisedNotes} / {totalNotes} notes revised ({progressPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--success)', width: `${progressPercent}%`, transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>

          {isAllComplete && (
            <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Great job!</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>You have successfully revised all your notes for this journey.</p>
              </div>
            </div>
          )}

          {dayGroups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dayGroups.map((group) => {
                const isExpanded = activeDay === group.dayNumber;
                const isDayComplete = group.notes.every(n => n.isRevised);
                const dateStr = new Date(group.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <div key={group.dayNumber} className="card" style={{ padding: '0', overflow: 'hidden', borderLeft: isDayComplete ? '4px solid var(--success)' : '4px solid var(--primary)' }}>
                    <button 
                      onClick={() => setActiveDay(isExpanded ? null : group.dayNumber)}
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1.25rem 1.5rem', 
                        background: isExpanded ? '#f8fafc' : 'white', 
                        border: 'none', 
                        borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '1.1rem', color: isDayComplete ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          Day {group.dayNumber}{group.title ? `: ${group.title}` : ''}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                          {dateStr} • {group.notes.length} notes
                        </span>
                        {isDayComplete && <FiCheckSquare color="var(--success)" />}
                      </div>
                      {isExpanded ? <FiChevronDown size={20} color="var(--text-secondary)" /> : <FiChevronRight size={20} color="var(--text-secondary)" />}
                    </button>
                    
                    {isExpanded && (
                      <div style={{ padding: '1.5rem' }}>
                        {group.notes.map(note => (
                          <label 
                            key={note.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '1rem', 
                              padding: '0.75rem', 
                              backgroundColor: note.isRevised ? '#f1f5f9' : 'white',
                              borderRadius: '6px',
                              marginBottom: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                          >
                            <input 
                              type="checkbox" 
                              checked={note.isRevised}
                              onChange={() => toggleNote(group.dayNumber, note.id)}
                              style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--success)', cursor: 'pointer' }}
                            />
                            <span style={{ 
                              fontSize: '15px', 
                              lineHeight: '1.5',
                              color: note.isRevised ? 'var(--revised)' : 'var(--text-primary)',
                              textDecoration: note.isRevised ? 'line-through' : 'none'
                            }}>
                              {note.content}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>No short notes to revise yet.</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add short notes in your daily logs to start your revision process.</p>
              <Link to={`/journey/${id}/logs`} className="btn-primary">Go to Daily Logs</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RevisionPage;
