import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSend, FiArrowLeft, FiTrash2, FiMinimize2, FiTerminal } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';
import InlineSnippetCard from '../components/InlineSnippetCard';

const DwightChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isDark } = useTheme();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch chat history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
          <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0' }}>
            <span style={{
              background: isDark ? '#2d3748' : '#cbd5e0',
              color: isDark ? '#e2e8f0' : '#2d3748',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
                  marginBottom: '16px'
                }}
              >
                <div 
                  className="dwight-message-bubble"
                  style={{
                    maxWidth: '75%',
                    background: isUser 
                      ? (isDark ? '#056162' : '#d9fdd3')
                      : (isDark ? '#202c33' : '#ffffff'),
                    color: isDark ? '#e9edef' : '#111b21',
                    borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    padding: '10px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    fontSize: '15px',
                    lineHeight: '1.5'
                  }}>
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

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '6px',
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
      <div style={{
        minHeight: '100vh',
        background: isDark ? '#0b141a' : '#efeae2',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Fullscreen Header */}
        <div 
          className="dwight-header"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: isDark ? '#202c33' : '#00a884',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 100,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/home" style={{ color: '#fff', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Back to home">
              <FiArrowLeft size={20} />
            </Link>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)' }} />
            <img 
              src="/dwight.webp" 
              alt="Dwight" 
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff' }} 
            />
            <div>
              <span className="dwight-header-title" style={{ fontSize: '16px', fontWeight: '700', display: 'block' }}>Dwight Schrute</span>
              <span className="dwight-header-subtitle" style={{ fontSize: '11px', display: 'block', opacity: '0.85' }}>Learn anything mode</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => navigate('/compiler')}
              title="Open Universal Compiler"
              style={{
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: '4px'
              }}
            >
              <FiTerminal size={18} />
            </button>
            <button 
              onClick={() => navigate('/home', { state: { openChatbot: true } })}
              title="Minimize Chat"
              style={{
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: '4px'
              }}
            >
              <FiMinimize2 size={18} />
            </button>
            <button 
              onClick={handleClearHistory}
              title="Clear Chat History"
              style={{
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600'
              }}
            >
              <FiTrash2 size={16} /> <span className="dwight-clear-text">Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div 
          className="dwight-chat-container"
          style={{
            flex: 1,
            marginTop: '60px',
            marginBottom: '80px', // footer input height
            padding: '24px 0',
            overflowY: 'auto',
            backgroundImage: isDark 
              ? 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)' 
              : 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)',
            backgroundSize: '16px 16px'
          }}
        >
          <div className="container" style={{ maxWidth: '800px', padding: '0 16px' }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: isDark ? '#8696a0' : '#667781',
                fontSize: '15px',
                marginTop: '10%'
              }}>
                <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px 0' }}>Dwight Schrute AI Learning Assistant</p>
                <p>Welcome to Dwight's Learning Assistant. Ask me any programming or tech concepts.</p>
                <p>I am here to support your learning journey! 💡</p>
              </div>
            ) : (
              renderMessageGroups()
            )}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  background: isDark ? '#202c33' : '#ffffff',
                  color: isDark ? '#8696a0' : '#667781',
                  borderRadius: '12px 12px 12px 0',
                  padding: '10px 14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  fontSize: '13px'
                }}>
                  Dwight is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Floating Footer Input */}
        <div 
          className="dwight-input-footer"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: isDark ? '#1f2c34' : '#f0f2f5',
            borderTop: isDark ? '1px solid #2d3748' : '1px solid #cbd5e0',
            display: 'flex',
            alignItems: 'center',
            zIndex: 100
          }}
        >
          <div className="dwight-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <input 
              ref={inputRef}
              className="dwight-input-box"
              type="text" 
              placeholder="Ask Dwight anything about programming..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '24px',
                padding: '12px 20px',
                outline: 'none',
                background: isDark ? '#2a3942' : '#ffffff',
                color: isDark ? '#e9edef' : '#111b21',
                fontSize: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
            <button 
              onClick={handleSend}
              className="dwight-send-btn"
              disabled={!input.trim() || isLoading}
              style={{
                background: '#DAA520',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (!input.trim() || isLoading) ? 0.6 : 1
              }}
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Styles Overlay */}
      <style>{`
        @media (max-width: 768px) {
          .dwight-header {
            padding: 0 12px !important;
          }
          .dwight-header-title {
            font-size: 14px !important;
          }
          .dwight-header-subtitle {
            font-size: 9px !important;
          }
          .dwight-clear-text {
            display: none !important;
          }
          .dwight-chat-container {
            margin-top: 60px !important;
            margin-bottom: 70px !important;
            padding: 12px 0 !important;
          }
          .dwight-message-bubble {
            max-width: 88% !important;
            font-size: 14px !important;
            padding: 8px 12px !important;
          }
          .dwight-input-footer {
            height: 60px !important;
          }
          .dwight-input-wrapper {
            gap: 8px !important;
            padding: 0 8px !important;
          }
          .dwight-input-box {
            font-size: 14px !important;
            padding: 9px 14px !important;
          }
          .dwight-send-btn {
            width: 38px !important;
            height: 38px !important;
          }
        }
      `}</style>
    </>
  );
};

export default DwightChatPage;
