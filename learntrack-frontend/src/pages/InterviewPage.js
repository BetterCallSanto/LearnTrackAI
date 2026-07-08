import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * InterviewPage — AI-powered mock interview conversation page.
 *
 * Displays a full-screen chat interface where "Pam Beesley" (powered by
 * Groq LLM) conducts a mock interview based on the learning journey's
 * topics and short notes.
 *
 * Features:
 *   - Real-time chat conversation with AI interviewer
 *   - Journey-specific questions (topics pulled from daily logs + notes)
 *   - Dynamic questions every session (never repeats)
 *   - Pam's avatar displayed alongside her messages
 *   - Fully responsive layout for mobile and desktop
 *   - Supports light/dark mode via CSS variables
 *   - Ephemeral conversations (not persisted to DB)
 *
 * Route: /journey/:id/interview
 */
const InterviewPage = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [daysCount, setDaysCount] = useState(0);

  /* ── Fetch journey info on mount ── */
  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const res = await api.get(`/api/journeys/${id}`);
        setJourney(res.data);
        setDaysCount(res.data.daysLogged || 0);

        // Pam's greeting message
        setMessages([{
          role: 'assistant',
          content: `(smiling) Hi there! I'm Pam Beesley, your interview partner. I see you've been studying "${res.data.name}" — that's great!\n\nWhenever you're ready, just say "yes" or "let's start" and I'll begin asking you some questions. Don't worry, this is a friendly practice session! 😊`
        }]);
      } catch (error) {
        toast.error('Failed to load journey data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourney();
  }, [id]);

  /* ── Auto-scroll to bottom when messages change ── */
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* ── Focus input after load ── */
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  /* ── Send message handler ── */
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.post(`/api/interview/${id}/chat`, {
        messages: updatedMessages
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.reply
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response from Pam');
      // Add a fallback message so the user knows something went wrong
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "(worried) Oh no, I seem to be having a technical issue. Could you try sending your message again?"
      }]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [input, messages, isSending, id]);

  /* ── Handle Enter key ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container">Journey not found</div>
      </div>
    );
  }

  return (
    <>
      {/* ── Custom Chat Header (replaces Navbar) ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4rem',
        backgroundColor: 'var(--interview-header-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
          {/* Left: Back + Pam info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <Link
              to={`/journey/${id}/revision`}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
              title="Back to Revision"
            >
              <FiArrowLeft size={20} />
            </Link>

            <img
              src="/pam2.png"
              alt="Pam Beesley"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--interview-avatar-border)',
                flexShrink: 0,
              }}
            />

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: '700',
                fontSize: '15px',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Pam — Interview Mode
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {journey.name} • Day {daysCount}
              </div>
            </div>
          </div>

          {/* Right: Online indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '12px',
            color: 'var(--success)',
            fontWeight: '500',
            flexShrink: 0,
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              animation: 'onlinePulse 2s ease infinite',
            }} />
            Online
          </div>
        </div>
      </div>

      {/* ── Chat Body ── */}
      <div style={{
        paddingTop: '4.5rem',
        paddingBottom: '5.5rem',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem 0',
          }}>
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                role={msg.role}
                content={msg.content}
              />
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.6rem',
              }}>
                <img
                  src="/pam2.png"
                  alt="Pam"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--interview-avatar-border)',
                    flexShrink: 0,
                  }}
                />
                <div style={{
                  backgroundColor: 'var(--interview-bubble-pam)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 18px',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}>
                  <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* ── Input Area ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--interview-header-bg)',
        borderTop: '1px solid var(--border)',
        padding: '0.75rem 0',
        zIndex: 1000,
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isSending}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                padding: '0.75rem 1rem',
                fontSize: '14px',
                fontFamily: 'var(--font-main)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                backgroundColor: 'var(--interview-input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                lineHeight: '1.4',
                maxHeight: '120px',
                overflow: 'auto',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(77, 142, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              title="Send message"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: input.trim() && !isSending ? 'var(--primary)' : 'var(--border)',
                color: input.trim() && !isSending ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseOver={(e) => {
                if (input.trim() && !isSending) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = input.trim() && !isSending ? 'var(--primary)' : 'var(--border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline Styles (animations) ── */}
      <style>{`
        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--text-secondary);
          animation: typingBounce 1.2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes onlinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .chat-bubble-text {
            font-size: 13px !important;
          }
        }
        @media (max-width: 480px) {
          .chat-bubble-text {
            font-size: 12.5px !important;
          }
        }
      `}</style>
    </>
  );
};


/* ═══════════════════════════════════════════════════════
 * ChatBubble — Single message bubble (Pam or User)
 * ═══════════════════════════════════════════════════════ */
const ChatBubble = ({ role, content }) => {
  const isPam = role === 'assistant';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isPam ? 'row' : 'row-reverse',
      alignItems: 'flex-end',
      gap: '0.6rem',
      maxWidth: '100%',
    }}>
      {/* Avatar (only for Pam) */}
      {isPam && (
        <img
          src="/pam2.png"
          alt="Pam"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.5px solid var(--interview-avatar-border)',
            flexShrink: 0,
          }}
        />
      )}

      {/* Bubble */}
      <div
        className="chat-bubble-text"
        style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isPam
            ? '16px 16px 16px 4px'
            : '16px 16px 4px 16px',
          backgroundColor: isPam
            ? 'var(--interview-bubble-pam)'
            : 'var(--interview-bubble-user)',
          color: isPam
            ? 'var(--interview-bubble-pam-text)'
            : 'var(--interview-bubble-user-text)',
          fontSize: '14px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isPam
            ? '0 1px 3px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.1)',
          animation: 'bubbleIn 0.25s ease',
        }}
      >
        {content}
      </div>

      <style>{`
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};


export default InterviewPage;
