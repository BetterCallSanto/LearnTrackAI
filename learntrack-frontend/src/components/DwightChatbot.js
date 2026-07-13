import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSend, FiX, FiTrash2, FiMaximize2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';
import InlineSnippetCard from './InlineSnippetCard';

const DwightChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isDark } = useTheme();
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Rehydrate open state if redirected from full screen minimize
  useEffect(() => {
    if (location.state?.openChatbot) {
      setIsOpen(true);
      // Clear location state to prevent repeating on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch chat history on mount
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/dwight/history');
      setMessages(res.data || []);
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Optimistically add user message with local timestamp
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      await api.post('/api/dwight/chat', { message: text });
      // Replace optimistic message and append assistant response
      fetchHistory();
    } catch (error) {
      toast.error('Failed to communicate with Dwight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Delete all Dwight chat history?')) {
      try {
        await api.delete('/api/dwight/history');
        setMessages([]);
        toast.success('History cleared');
      } catch (e) {
        toast.error('Failed to clear history');
      }
    }
  };

  const parseMessageContent = (text) => {
    const parts = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'javascript',
        code: match[2]
      });
      lastIndex = regex.lastIndex;
    }

    const textAfter = text.substring(lastIndex);
    if (textAfter.trim() || parts.length === 0) {
      parts.push({ type: 'text', content: textAfter || text });
    }

    return parts;
  };

  const getGroupDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Group messages by day for WhatsApp style rendering
  const renderMessageGroups = () => {
    const groups = {};
    messages.forEach(msg => {
      const dateKey = new Date(msg.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return Object.keys(groups).map(dateKey => {
      const dayMessages = groups[dateKey];
      const headerDate = getGroupDateHeader(dayMessages[0].timestamp);

      return (
        <div key={dateKey}>
          {/* WhatsApp style date header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '16px 0'
          }}>
            <span style={{
              background: isDark ? '#2d3748' : '#e2e8f0',
              color: isDark ? '#e2e8f0' : '#4a5568',
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {headerDate}
            </span>
          </div>

          {dayMessages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                  padding: '0 8px'
                }}
              >
                {/* Bubble */}
                <div style={{
                  maxWidth: '85%',
                  background: isUser 
                    ? (isDark ? '#056162' : '#d9fdd3') // WhatsApp user green
                    : (isDark ? '#202c33' : '#ffffff'), // WhatsApp other white/dark
                  color: isDark ? '#e9edef' : '#111b21',
                  borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  padding: '8px 12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  position: 'relative',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {/* Message Content */}
                  <div>
                    {parseMessageContent(msg.content).map((part, idx) => {
                      if (part.type === 'code') {
                        return (
                          <InlineSnippetCard 
                            key={idx}
                            initialCode={part.code}
                            initialLanguage={part.language}
                            isDark={isDark}
                          />
                        );
                      }
                      return (
                        <p key={idx} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {part.content}
                        </p>
                      );
                    })}
                  </div>

                  {/* Timestamp aligned bottom-right inside the bubble */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '4px',
                    fontSize: '10px',
                    color: isDark ? '#8696a0' : '#667781'
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <>
          <button 
            onClick={() => setIsOpen(true)}
            title="Learn with Dwight 😠"
            aria-label="Start chatting with Dwight Schrute"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #DAA520',
              boxShadow: '0 4px 20px rgba(218, 165, 32, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 9999,
              padding: '0',
              background: isDark ? '#1a1a1a' : '#fff',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(218, 165, 32, 0.6), 0 4px 12px rgba(0,0,0,0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(218, 165, 32, 0.4), 0 2px 8px rgba(0,0,0,0.2)';
            }}
          >
            <img 
              src="/dwight.webp" 
              alt="Dwight Chatbot" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} 
            />
          </button>

          {/* Pulse ring animation */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #DAA520',
              zIndex: 899,
              pointerEvents: 'none',
              animation: 'dwightPulse 2s ease-out infinite',
            }}
          />

          <style>{`
            @keyframes dwightPulse {
              0% { transform: scale(1); opacity: 0.6; }
              70% { transform: scale(1.4); opacity: 0; }
              100% { transform: scale(1.4); opacity: 0; }
            }
          `}</style>
        </>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '600px',
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: isDark ? '#0b141a' : '#efeae2', // WhatsApp background colors
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          border: isDark ? '1px solid #222' : '1px solid #ddd'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: isDark ? '#202c33' : '#00a884', // WhatsApp green / dark header
            color: '#fff',
            borderBottom: isDark ? '1px solid #2d3748' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/dwight.webp" 
                alt="Dwight Avatar" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff' }} 
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Dwight Schrute</div>
                <div style={{ fontSize: '11px', opacity: '0.9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#25D366', borderRadius: '50%' }}></span>
                  Learn anything mode
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={handleClearHistory}
                title="Clear Chat History"
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <FiTrash2 size={16} />
              </button>
              <button 
                onClick={() => navigate('/dwight-chat')}
                title="Maximize to Fullscreen"
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <FiMaximize2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 8px',
            backgroundImage: isDark 
              ? 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)' 
              : 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)',
            backgroundSize: '16px 16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                margin: 'auto',
                padding: '24px',
                color: isDark ? '#8696a0' : '#667781',
                fontSize: '13px'
              }}>
                <p>Welcome! I am Dwight Schrute.</p>
                <p>Ask me any technology or programming questions. I am eager to help you learn! 💡</p>
              </div>
            ) : (
              renderMessageGroups()
            )}
            
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 8px', marginBottom: '12px' }}>
                <div style={{
                  background: isDark ? '#202c33' : '#ffffff',
                  color: isDark ? '#8696a0' : '#667781',
                  borderRadius: '12px 12px 12px 0',
                  padding: '8px 12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  fontSize: '12px'
                }}>
                  Dwight is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Box */}
          <div style={{
            padding: '10px 12px',
            background: isDark ? '#1f2c34' : '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderTop: isDark ? '1px solid #2d3748' : 'none'
          }}>
            <input 
              type="text" 
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '8px',
                padding: '9px 12px',
                outline: 'none',
                background: isDark ? '#2a3942' : '#ffffff',
                color: isDark ? '#e9edef' : '#111b21',
                fontSize: '14px'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                background: '#DAA520',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (!input.trim() || isLoading) ? 0.6 : 1
              }}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DwightChatbot;
