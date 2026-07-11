import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiMaximize, FiMinimize, FiTrash2, FiFileText, FiDatabase, FiX, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';
import Editor from '@monaco-editor/react';

const CodeSnippet = ({ snippet, onDelete, onUpdate, logId, isRevisionMode = false }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [code, setCode] = useState(snippet.code || '');
  const [title, setTitle] = useState(snippet.title || 'untitled');
  const [language, setLanguage] = useState(snippet.language || 'java');
  const [stdin, setStdin] = useState('');
  
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'input'
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  
  const [editorHeight, setEditorHeight] = useState(snippet.editorHeight || 300);
  
  const editorRef = useRef(null);

  const [dbTables, setDbTables] = useState([]);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [activeTablePopup, setActiveTablePopup] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  // Draggable popup window positioning
  const [popupPosition, setPopupPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Resizing state variables
  const [popupSize, setPopupSize] = useState({ width: 550, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeDirection = useRef(null);
  const resizeStartRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/api/compiler/tables');
      setDbTables(res.data || []);
    } catch (e) {
      console.error('Failed to fetch DB tables', e);
    }
  }, []);

  const fetchTableData = useCallback(async (tableName) => {
    setIsLoadingTable(true);
    try {
      const res = await api.get(`/api/compiler/table-data?table=${tableName}`);
      if (res.data.error) {
        toast.error(res.data.error);
        setTableData(null);
      } else {
        setTableData(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch table data', e);
      toast.error('Failed to load table content');
      setTableData(null);
    } finally {
      setIsLoadingTable(false);
    }
  }, []);

  useEffect(() => {
    if (language === 'sql') {
      fetchTables();
    } else {
      setActiveTablePopup(null);
      setTableData(null);
    }
  }, [language, fetchTables]);

  const handleTableSelect = (tableName) => {
    setActiveTablePopup(tableName);
    setShowDbDropdown(false);
    fetchTableData(tableName);
    setPopupPosition({
      x: Math.max(50, window.innerWidth / 2 - 250),
      y: Math.max(50, window.innerHeight / 2 - 200)
    });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    dragStartOffset.current = {
      x: e.clientX - popupPosition.x,
      y: e.clientY - popupPosition.y
    };
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPopupPosition({
      x: e.clientX - dragStartOffset.current.x,
      y: e.clientY - dragStartOffset.current.y
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e, direction) => {
    setIsResizing(true);
    resizeDirection.current = direction;
    resizeStartRect.current = {
      x: popupPosition.x,
      y: popupPosition.y,
      width: popupSize.width,
      height: popupSize.height
    };
    resizeStartMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResizeMouseMove = useCallback((e) => {
    if (!isResizing || !resizeDirection.current) return;
    
    const deltaX = e.clientX - resizeStartMouse.current.x;
    const deltaY = e.clientY - resizeStartMouse.current.y;
    
    let newWidth = resizeStartRect.current.width;
    let newHeight = resizeStartRect.current.height;
    let newX = resizeStartRect.current.x;
    let newY = resizeStartRect.current.y;
    
    const minWidth = 350;
    const minHeight = 250;
    const dir = resizeDirection.current;
    
    if (dir.includes('e')) {
      newWidth = Math.max(minWidth, resizeStartRect.current.width + deltaX);
    } else if (dir.includes('w')) {
      const calculatedWidth = resizeStartRect.current.width - deltaX;
      if (calculatedWidth >= minWidth) {
        newWidth = calculatedWidth;
        newX = resizeStartRect.current.x + deltaX;
      }
    }
    
    if (dir.includes('s')) {
      newHeight = Math.max(minHeight, resizeStartRect.current.height + deltaY);
    } else if (dir.includes('n')) {
      const calculatedHeight = resizeStartRect.current.height - deltaY;
      if (calculatedHeight >= minHeight) {
        newHeight = calculatedHeight;
        newY = resizeStartRect.current.y + deltaY;
      }
    }
    
    setPopupSize({ width: newWidth, height: newHeight });
    setPopupPosition({ x: newX, y: newY });
  }, [isResizing]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    resizeDirection.current = null;
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  const TEMPLATES = {
    java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
    python: `print("Hello, World!")`,
    javascript: `console.log("Hello, World!");`,
    html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello HTML</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`,
    css: `body {\n  background-color: #f8fafc;\n  font-family: 'Inter', sans-serif;\n  color: #1e293b;\n}\n\nh1 {\n  color: #1a56db;\n  text-align: center;\n}`,
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
      if (language === 'html') {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(code);
          newWindow.document.close();
          setOutput('HTML page opened in a new tab.');
        } else {
          setOutput('Pop-up blocked! Please allow pop-ups for this website in your browser settings to preview the HTML output.');
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
              setOutput({
                 type: 'table',
                 message: res.data.stdout || `Query executed successfully. ${rows.length} rows returned.`,
                 headers,
                 rows
              });
           } else {
              setOutput(res.data.stdout || 'Query executed successfully with no returned rows.');
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
        <div className="compiler-toolbar-left" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.6rem' }}>
          {isRevisionMode ? (
            <span style={{ color: '#E2E8F0', fontWeight: '600', fontSize: '14px', marginRight: isMobile ? '5px' : '10px', maxWidth: isMobile ? '60px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
          ) : (
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              style={{ 
                background: 'transparent', border: 'none', color: '#E2E8F0', 
                fontWeight: '600', fontSize: '14px', outline: 'none', width: isMobile ? '65px' : '120px'
              }}
              placeholder="Snippet Title"
            />
          )}
          
          <select 
            className="compiler-select" 
            value={language} 
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              setCode(TEMPLATES[newLang] || '');
            }}
            disabled={isRevisionMode}
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
          
          {!isRevisionMode && (
            <button className="compiler-toolbar-btn" onClick={handleTemplate} style={{ padding: isMobile ? '0.45rem' : '0.4rem 0.6rem' }} title="Load template">
              <FiFileText /> {!isMobile && 'TEMPLATE'}
            </button>
          )}
        </div>
        <div className="compiler-toolbar-right" style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'flex-end' }}>
              {/* Run Button is first */}
              <button 
                className="compiler-run-btn" 
                onClick={handleRun}
                disabled={isCompiling}
                style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }}
                title="Run Query"
              >
                {isCompiling ? <div className="spinner" style={{width: '14px', height: '14px'}}></div> : <FiPlay />}
              </button>

              {/* Scrollable Container for Copy, Delete, Fullscreen */}
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', position: 'relative', flex: 1, maxWidth: '120px' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.4rem', 
                  overflowX: 'auto', 
                  paddingRight: '15px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }} className="hide-scrollbar">
                  <button 
                    className="compiler-toolbar-btn" 
                    onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }} 
                    title="Copy Code"
                    style={{ padding: '0.45rem', flexShrink: 0 }}
                  >
                    <FiCopy size={14} />
                  </button>
                  {!isRevisionMode && (
                    <button className="compiler-toolbar-btn" onClick={() => onDelete(snippet.id)} title="Delete" style={{ padding: '0.45rem', flexShrink: 0 }}>
                      <FiTrash2 />
                    </button>
                  )}
                  <button className="compiler-toolbar-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Full Screen" style={{ padding: '0.45rem', flexShrink: 0 }}>
                    {isFullScreen ? <FiMinimize /> : <FiMaximize />}
                  </button>
                </div>
                {/* Fade overlay on the right to indicate more content */}
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: 0, 
                  bottom: 0, 
                  width: '15px', 
                  background: 'linear-gradient(to right, transparent, #1E1F2B)', 
                  pointerEvents: 'none' 
                }} />
              </div>
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          ) : (
            <>
              {language === 'sql' && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button 
                    className="compiler-toolbar-btn" 
                    onClick={() => setShowDbDropdown(!showDbDropdown)}
                    title="Database Tables"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <FiDatabase size={16} />
                  </button>
                  {showDbDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 999,
                      minWidth: '160px',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {dbTables.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '13px' }}>No tables found</div>
                      ) : (
                        dbTables.map(t => (
                          <button
                            key={t}
                            onClick={() => handleTableSelect(t)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.75rem 1rem',
                              background: 'transparent',
                              border: 'none',
                              color: '#e2e8f0',
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'background 0.2s',
                              display: 'block'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                          >
                            {t}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              <button 
                className="compiler-toolbar-btn" 
                onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }} 
                title="Copy Code"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem' }}
              >
                <FiCopy size={14} /> Copy
              </button>
              {!isRevisionMode && (
                <>
                  <button className="compiler-toolbar-btn" onClick={() => onDelete(snippet.id)} title="Delete" style={{ padding: '0.4rem 0.6rem' }}>
                    <FiTrash2 />
                  </button>
                </>
              )}
              <button className="compiler-toolbar-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Full Screen" style={{ padding: '0.4rem 0.6rem' }}>
                {isFullScreen ? <FiMinimize /> : <FiMaximize />}
              </button>
              <button 
                className="compiler-run-btn" 
                onClick={handleRun}
                disabled={isCompiling}
                style={{ padding: '0.4rem 1rem' }}
              >
                {isCompiling ? <div className="spinner" style={{width: '14px', height: '14px'}}></div> : <><FiPlay /> Run</>}
              </button>
            </>
          )}
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
            fontSize: isMobile ? 12 : 14,
            fontFamily: "'Consolas', 'Courier New', monospace",
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            readOnly: isRevisionMode && language !== 'sql',
            padding: { top: 0, bottom: 0 },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto'
            },
            lineNumbersMinChars: isMobile ? 2 : 3,
            folding: !isMobile,
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
            <div>
              {typeof output === 'object' && output !== null && output.type === 'table' ? (
                <div>
                  <div style={{ color: '#A7F3D0', marginBottom: '0.75rem', fontWeight: '500' }}>
                    {output.message}
                  </div>
                  {output.headers.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="sql-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e2e8f0', border: '1px solid #2e3347' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
                            {output.headers.map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '600', color: '#94a3b8' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {output.rows.length === 0 ? (
                            <tr>
                              <td colSpan={output.headers.length} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            output.rows.map((row, rIdx) => (
                              <tr 
                                key={rIdx} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
                                  background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent' 
                                }}
                              >
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                                    {cell !== null ? String(cell) : <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontStyle: 'italic' }}>null</span>}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof output === 'string' ? output : 'Run your code to see output here.'}
                </div>
              )}
            </div>
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
      {activeTablePopup && (
        <div 
          style={{
            position: 'fixed',
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            width: `${popupSize.width}px`,
            height: `${popupSize.height}px`,
            background: 'rgba(25, 25, 25, 0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
              <FiDatabase style={{ color: 'var(--primary)' }} />
              <span>Table Viewer</span>
              <select
                className="no-drag"
                value={activeTablePopup}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveTablePopup(val);
                  fetchTableData(val);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '3px 8px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                  marginLeft: '0.5rem'
                }}
              >
                {dbTables.map(t => (
                  <option key={t} value={t} style={{ background: '#1e1e1e', color: '#fff' }}>{t}</option>
                ))}
              </select>
            </div>
            <button 
              className="no-drag"
              onClick={() => setActiveTablePopup(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Table Data View */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {isLoadingTable ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: '#94a3b8' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ fontSize: '13px' }}>Loading table records...</div>
              </div>
            ) : !tableData ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
                No records loaded or error fetching table
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.03)' }}>
                    {tableData.headers.map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: '600', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={tableData.headers.length} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No records found inside this table.
                      </td>
                    </tr>
                  ) : (
                    tableData.rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
                          background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent' 
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                            {cell !== null ? String(cell) : <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontStyle: 'italic' }}>null</span>}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 8-Directional Resize Handles */}
          {/* Borders */}
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            style={{ position: 'absolute', top: 0, left: '8px', right: '8px', height: '6px', cursor: 'n-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{ position: 'absolute', bottom: 0, left: '8px', right: '8px', height: '6px', cursor: 's-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{ position: 'absolute', top: '8px', bottom: '8px', right: 0, width: '6px', cursor: 'e-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            style={{ position: 'absolute', top: '8px', bottom: '8px', left: 0, width: '6px', cursor: 'w-resize', zIndex: 10001 }}
          />
          {/* Corners */}
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', cursor: 'nw-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', cursor: 'ne-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{ position: 'absolute', bottom: 0, left: 0, width: '10px', height: '10px', cursor: 'sw-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', cursor: 'se-resize', zIndex: 10002 }}
          />
        </div>
      )}
    </div>
  );
};

export default CodeSnippet;
