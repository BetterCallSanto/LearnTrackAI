import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiMaximize, FiMinimize, FiTrash2, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';
import Editor from '@monaco-editor/react';

const CodeSnippet = ({ snippet, onDelete, onUpdate, logId, isRevisionMode = false }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [code, setCode] = useState(snippet.code || '');
  const [title, setTitle] = useState(snippet.title || 'Untitled Snippet');
  const [language, setLanguage] = useState(snippet.language || 'java');
  const [stdin, setStdin] = useState('');
  
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'input'
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  
  const [editorHeight, setEditorHeight] = useState(snippet.editorHeight || 300);
  
  const editorRef = useRef(null);

  const TEMPLATES = {
    java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
    python: `print("Hello, World!")`,
    javascript: `console.log("Hello, World!");`,
    c: `#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}`,
    cpp: `#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}`,
    sql: `SELECT * FROM products;`
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // Sync refs to avoid listener recreation during drag
  const snippetRef = useRef(snippet);
  const titleRef = useRef(title);
  const languageRef = useRef(language);
  const codeRef = useRef(code);
  const editorHeightRef = useRef(editorHeight);

  useEffect(() => {
    snippetRef.current = snippet;
    titleRef.current = title;
    languageRef.current = language;
    codeRef.current = code;
    editorHeightRef.current = editorHeight;
  }, [snippet, title, language, code, editorHeight]);

  const handleResize = useCallback((e) => {
    const editorDom = document.getElementById(`editor-area-${snippet.id}`);
    if (editorDom) {
      const rect = editorDom.getBoundingClientRect();
      const newHeight = Math.max(150, Math.min(800, e.clientY - rect.top));
      setEditorHeight(newHeight);
    }
  }, [snippet.id]);

  const stopResize = useCallback(async () => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    const updatedSnippet = {
      ...snippetRef.current,
      title: titleRef.current,
      language: languageRef.current,
      code: codeRef.current,
      editorHeight: editorHeightRef.current
    };

    onUpdate(updatedSnippet);

    const currentId = snippetRef.current.id;
    if (currentId && !String(currentId).startsWith('draft-')) {
      try {
        await api.put(`/api/snippets/${currentId}`, {
          title: titleRef.current,
          language: languageRef.current,
          code: codeRef.current,
          editorHeight: editorHeightRef.current
        });
      } catch (e) {
        console.error('Failed to save resized height', e);
      }
    }
  }, [handleResize, onUpdate]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [handleResize, stopResize]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [handleResize, stopResize]);

  // Sync basic state changes (title, language, code) to parent
  useEffect(() => {
    onUpdate({ ...snippet, title, language, code, editorHeight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, language, code]);

  // Sync snippet.editorHeight from parent updates
  useEffect(() => {
    if (snippet.editorHeight) {
      setEditorHeight(snippet.editorHeight);
    }
  }, [snippet.editorHeight]);

  const handleTemplate = () => {
    setCode(TEMPLATES[language] || '');
  };

  const handleRun = async () => {
    setIsCompiling(true);
    setActiveTab('output');
    setOutput('Running...');
    try {
      const res = await api.post('/api/compiler/run', { language, code, stdin });
      if (language === 'sql') {
        if (res.data.error) {
           setOutput(res.data.error);
        } else if (res.data.stderr) {
           setOutput(res.data.stderr);
        } else {
           const headers = res.data.headers || [];
           const rows = res.data.rows || [];
           
           let outText = res.data.stdout + '\n\n';
           if (headers.length > 0) {
              outText += headers.join(' | ') + '\n';
              outText += '-'.repeat(50) + '\n';
              rows.forEach(r => {
                 outText += r.join(' | ') + '\n';
              });
           }
           setOutput(outText);
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

  const fullScreenStyle = isFullScreen ? {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    zIndex: 9999, margin: 0, borderRadius: 0,
    display: 'flex', flexDirection: 'column'
  } : {};

  // Map our language names to Monaco's expected language IDs
  const getMonacoLanguage = (lang) => {
    if (lang === 'c' || lang === 'cpp') return 'cpp';
    return lang;
  };

  return (
    <div className="compiler-container" style={fullScreenStyle}>
      <div className="compiler-toolbar">
        <div className="compiler-toolbar-left">
          {isRevisionMode ? (
            <span style={{ color: '#E2E8F0', fontWeight: '600', fontSize: '14px', marginRight: '10px' }}>
              {title}
            </span>
          ) : (
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              style={{ 
                background: 'transparent', border: 'none', color: '#E2E8F0', 
                fontWeight: '600', fontSize: '14px', outline: 'none', width: '150px'
              }}
              placeholder="Snippet Title"
            />
          )}
          
          <select 
            className="compiler-select" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRevisionMode}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="sql">SQL</option>
          </select>
          
          {!isRevisionMode && (
            <button className="compiler-toolbar-btn" onClick={handleTemplate}>
              <FiFileText /> TEMPLATE
            </button>
          )}
        </div>
        <div className="compiler-toolbar-right">
          <button className="compiler-toolbar-btn" onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }} title="Copy">
            Copy
          </button>
          {!isRevisionMode && (
            <>
              <button className="compiler-toolbar-btn" onClick={() => onDelete(snippet.id)} title="Delete">
                <FiTrash2 />
              </button>
            </>
          )}
          <button className="compiler-toolbar-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Full Screen">
            {isFullScreen ? <FiMinimize /> : <FiMaximize />}
          </button>
          <button 
            className="compiler-run-btn" 
            onClick={handleRun}
            disabled={isCompiling}
          >
            {isCompiling ? <div className="spinner" style={{width: '14px', height: '14px'}}></div> : <><FiPlay /> Run</>}
          </button>
        </div>
      </div>
      
      <div 
        id={`editor-area-${snippet.id}`}
        className="compiler-editor-area" 
        style={{ flex: isFullScreen ? 1 : 'none', height: isFullScreen ? '100%' : `${editorHeight}px` }}
      >
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Consolas', 'Courier New', monospace",
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: isRevisionMode && language !== 'sql',
            padding: { top: 0, bottom: 0 },
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false
          }}
        />
      </div>

      {!isFullScreen && (
        <div 
          className="compiler-resize-handle"
          onMouseDown={startResize}
          style={{
            height: '6px',
            backgroundColor: 'var(--border)',
            cursor: 'row-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
            margin: '2px 0'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'var(--border)'}
        />
      )}

      <div className="compiler-console" style={{ height: isFullScreen ? '250px' : 'auto' }}>
        <div className="compiler-console-tabs">
          <button 
            className={`compiler-console-tab ${activeTab === 'output' ? 'active' : ''}`} 
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
          <button 
            className={`compiler-console-tab ${activeTab === 'input' ? 'active' : ''}`} 
            onClick={() => setActiveTab('input')}
          >
            Stdin (Input)
          </button>
        </div>
        <div className="compiler-console-content">
          {activeTab === 'output' && (
            <div>{output || 'Run your code to see output here.'}</div>
          )}
          {activeTab === 'input' && (
            <textarea
              className="compiler-stdin-textarea"
              placeholder="Enter your standard input here (e.g. for Scanner or input())..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSnippet;
