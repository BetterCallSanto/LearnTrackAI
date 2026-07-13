import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { FiPlay, FiCopy, FiSave } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';

const InlineSnippetCard = ({ initialCode, initialLanguage, isDark }) => {
  const [code, setCode] = useState(initialCode || '');
  const [language, setLanguage] = useState(initialLanguage || 'javascript');
  const [stdin, setStdin] = useState('');
  
  const [activeTab, setActiveTab] = useState('output');
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef(null);

  // Height state for Monaco editor container (resizable)
  const [editorHeight, setEditorHeight] = useState(220);
  const cardId = useRef(Math.random().toString(36).substring(7)).current;

  // Mouse Drag resizing logic
  const handleResize = useCallback((e) => {
    const editorDom = document.getElementById(`editor-area-${cardId}`);
    if (editorDom) {
      const rect = editorDom.getBoundingClientRect();
      // Calculate vertical height based on cursor position relative to top of editor
      const newHeight = Math.max(100, Math.min(800, e.clientY - rect.top));
      setEditorHeight(newHeight);
    }
  }, [cardId]);

  const stopResize = useCallback(() => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }, [handleResize]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [handleResize, stopResize]);

  // Touch Drag resizing logic (for mobile screens)
  const handleTouchResize = useCallback((e) => {
    const editorDom = document.getElementById(`editor-area-${cardId}`);
    if (editorDom && e.touches && e.touches[0]) {
      const rect = editorDom.getBoundingClientRect();
      const newHeight = Math.max(100, Math.min(600, e.touches[0].clientY - rect.top));
      setEditorHeight(newHeight);
    }
  }, [cardId]);

  const stopTouchResize = useCallback(() => {
    document.removeEventListener('touchmove', handleTouchResize);
    document.removeEventListener('touchend', stopTouchResize);
  }, [handleTouchResize]);

  const startTouchResize = useCallback((e) => {
    document.addEventListener('touchmove', handleTouchResize, { passive: false });
    document.addEventListener('touchend', stopTouchResize);
  }, [handleTouchResize, stopTouchResize]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchmove', handleTouchResize);
      document.removeEventListener('touchend', stopTouchResize);
    };
  }, [handleResize, stopResize, handleTouchResize, stopTouchResize]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRun = async () => {
    setIsCompiling(true);
    setActiveTab('output');
    setOutput('Running...');
    try {
      if (language === 'html') {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(code);
          newWindow.document.close();
          setOutput('HTML page opened in a new tab.');
        } else {
          setOutput('Pop-up blocked! Please allow pop-ups for this website.');
        }
        setIsCompiling(false);
        return;
      }
      
      const res = await api.post('/api/compiler/run', { language, code, stdin });
      if (language === 'sql') {
        if (res.data.error) {
          setOutput(res.data.error);
        } else if (res.data.stderr) {
          setOutput(res.data.stderr);
        } else {
          const headers = res.data.headers || [];
          const rows = res.data.rows || [];
          if (headers.length > 0) {
            let tableText = headers.join(' | ') + '\n' + '-'.repeat(40) + '\n';
            rows.forEach(row => { tableText += row.join(' | ') + '\n'; });
            setOutput(tableText);
          } else {
            setOutput(res.data.stdout || 'Query executed successfully.');
          }
        }
      } else {
        const out = res.data.stdout || '';
        const err = res.data.stderr || '';
        const comp = res.data.compile_output || '';
        const msg = res.data.message || '';
        let result = '';
        if (comp) result += 'Compile Output:\n' + comp + '\n\n';
        if (out) result += out;
        if (err) result += '\nError:\n' + err;
        if (msg) result += '\nMessage:\n' + msg;
        setOutput(result || 'Program finished with no output.');
      }
    } catch (e) {
      setOutput('Failed to reach compiler service.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async () => {
    const userTitle = window.prompt('Name your project (leave blank for default):', "Dwight's Snippet");
    if (userTitle === null) return;

    const finalTitle = userTitle.trim() || "Dwight's Snippet";

    setIsSaving(true);
    try {
      await api.post('/api/universal-projects', {
        name: finalTitle,
        language: language,
        code: code,
        fromDwight: true
      });
      toast.success(`"${finalTitle}" saved to Universal Compiler!`);
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="inline-snippet-card"
      style={{
        border: isDark ? '1px solid #333' : '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '10px 0',
        background: isDark ? '#1e1e1e' : '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Toolbar — always single row, no wrapping */}
      <div
        className="inline-snippet-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: isDark ? '#252526' : '#edf2f7',
          borderBottom: isDark ? '1px solid #333' : '1px solid #cbd5e0',
          gap: '6px',
          flexWrap: 'nowrap',
          overflow: 'hidden'
        }}
      >
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '3px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            background: isDark ? '#333' : '#fff',
            color: isDark ? '#fff' : '#333',
            border: '1px solid var(--border)',
            flexShrink: 0
          }}
        >
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="sql">SQL</option>
        </select>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={handleCopy}
            title="Copy Code"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDark ? '#cbd5e0' : '#4a5568', padding: '4px',
              display: 'flex', alignItems: 'center'
            }}
          >
            <FiCopy size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Save to Universal Compiler"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDark ? '#cbd5e0' : '#4a5568', padding: '4px',
              display: 'flex', alignItems: 'center'
            }}
          >
            <FiSave size={14} />
          </button>
          <button
            onClick={handleRun}
            disabled={isCompiling}
            title="Run Code"
            style={{
              background: isCompiling ? '#555' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 8px',
              cursor: isCompiling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isCompiling
              ? <span style={{ fontSize: '10px', lineHeight: 1 }}>…</span>
              : <FiPlay size={13} />
            }
          </button>
        </div>
      </div>

      {/* Editor — resizable container height */}
      <div id={`editor-area-${cardId}`} style={{ height: `${editorHeight}px`, width: '100%' }}>
        <Editor
          height="100%"
          width="100%"
          language={language === 'c' || language === 'cpp' ? 'cpp' : language}
          theme={isDark ? 'vs-dark' : 'light'}
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "'Consolas', 'Courier New', monospace",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            padding: { top: 4, bottom: 4 }
          }}
        />
      </div>

      {/* Drag Resize Handle (top of the console window / below editor) */}
      <div 
        className="compiler-resize-handle"
        onMouseDown={startResize}
        onTouchStart={startTouchResize}
        style={{
          height: '6px',
          backgroundColor: isDark ? '#333' : '#e2e8f0',
          cursor: 'row-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease',
          margin: '2px 0'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary)'}
        onMouseOut={(e) => e.target.style.backgroundColor = isDark ? '#333' : '#e2e8f0'}
      />

      {/* Stdin / Output Panel */}
      <div style={{ borderTop: isDark ? '1px solid #333' : '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', background: isDark ? '#1a1a1a' : '#f7fafc', fontSize: '11px' }}>
          <button
            onClick={() => setActiveTab('output')}
            style={{
              padding: '5px 12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'output' ? (isDark ? '#252526' : '#fff') : 'transparent',
              color: activeTab === 'output' ? 'var(--primary)' : (isDark ? '#a0aec0' : '#718096'),
              fontWeight: '600'
            }}
          >
            Output
          </button>
          <button
            onClick={() => setActiveTab('input')}
            style={{
              padding: '5px 12px', border: 'none', cursor: 'pointer',
              background: activeTab === 'input' ? (isDark ? '#252526' : '#fff') : 'transparent',
              color: activeTab === 'input' ? 'var(--primary)' : (isDark ? '#a0aec0' : '#718096'),
              fontWeight: '600'
            }}
          >
            Stdin
          </button>
        </div>
        <div style={{ 
          padding: '8px', 
          height: '90px', 
          minHeight: '55px', 
          maxHeight: '300px', 
          overflow: 'auto', 
          background: isDark ? '#1e1e1e' : '#fff' 
        }}>
          {activeTab === 'input' ? (
            <textarea
              placeholder="Provide program inputs here..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              style={{
                width: '100%', height: '100%', background: 'transparent',
                border: 'none', resize: 'none', outline: 'none',
                color: isDark ? '#e2e8f0' : '#2d3748', fontSize: '11px'
              }}
            />
          ) : (
            <pre style={{
              margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Consolas', monospace",
              fontSize: '11px', color: isDark ? '#e2e8f0' : '#2d3748'
            }}>
              {output || 'Output will appear here.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default InlineSnippetCard;
