import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiSave, FiPlay, FiFile, FiTrash2, FiPlus, FiArrowLeft, 
  FiChevronLeft, FiChevronRight, FiCopy, FiDatabase, FiX, 
  FiFileText, FiMaximize, FiMinimize
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { BsPin, BsPinFill } from 'react-icons/bs';

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

const API_BASE = 'http://localhost:8080/api/universal-projects';
const RUN_API = 'http://localhost:8080/api/compiler/run';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const UniversalCompilerPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  
  const [code, setCode] = useState(TEMPLATES.java);
  const [language, setLanguage] = useState('java');
  const [projectName, setProjectName] = useState('Untitled Project');
  
  // Console state
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'input'
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  // Resizing editor height (like CodeSnippet.js)
  const [editorHeight, setEditorHeight] = useState(typeof window !== 'undefined' ? Math.max(300, (window.innerHeight - 100) / 2) : 350);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // SQL Table viewing states
  const [dbTables, setDbTables] = useState([]);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [activeTablePopup, setActiveTablePopup] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  // Draggable SQL Table Viewer Popup position & size
  const [popupPosition, setPopupPosition] = useState({ x: 100, y: 100 });
  const [popupSize, setPopupSize] = useState({ width: 550, height: 400 });
  const [isDraggingPopup, setIsDraggingPopup] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const [isResizingPopup, setIsResizingPopup] = useState(false);
  const resizeDirection = useRef(null);
  const resizeStartRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  // Track window resizing for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(API_BASE, getAuthHeaders());
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  }, []);

  // Fetch projects and load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle SQL Table list loading
  const fetchTables = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/compiler/tables', getAuthHeaders());
      setDbTables(res.data || []);
    } catch (e) {
      console.error('Failed to fetch DB tables', e);
    }
  }, []);

  const fetchTableData = useCallback(async (tableName) => {
    setIsLoadingTable(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/compiler/table-data?table=${tableName}`, getAuthHeaders());
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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(TEMPLATES[newLang] || '');
  };

  const handleTemplate = () => {
    setCode(TEMPLATES[language] || '');
    toast.success('Loaded starter template!');
  };

  const createNewProject = () => {
    setActiveProject(null);
    setCode(TEMPLATES[language] || '// Write your code here\n');
    setProjectName('Untitled Project');
    setOutput('');
  };

  const loadProject = (project) => {
    setActiveProject(project);
    setCode(project.code);
    setLanguage(project.language);
    setProjectName(project.name);
    setOutput('');
    if (isMobile) {
      setIsSidebarOpen(false); // Close sidebar on mobile once selected
    }
  };

  const saveProject = async () => {
    let currentName = projectName.trim();
    if (!currentName || currentName === 'Untitled Project') {
      const promptedName = window.prompt('Please enter a title for your project:', currentName || '');
      if (promptedName === null) return; // User cancelled
      if (!promptedName.trim()) {
        toast.error('Project title cannot be empty!');
        return;
      }
      currentName = promptedName.trim();
      setProjectName(currentName);
    }

    setIsSaving(true);
    try {
      if (activeProject) {
        // Update existing
        const res = await axios.put(`${API_BASE}/${activeProject.id}`, {
          name: currentName,
          language,
          code
        }, getAuthHeaders());
        setActiveProject(res.data);
        toast.success('Project saved!');
      } else {
        // Create new
        const res = await axios.post(API_BASE, {
          name: currentName,
          language,
          code
        }, getAuthHeaders());
        setActiveProject(res.data);
        toast.success('Project created!');
      }
      fetchProjects();
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCurrentProject = async () => {
    if (!activeProject) {
      toast.error('No project is currently loaded.');
      return;
    }
    if (!window.confirm(`Delete the project "${projectName}"?`)) return;
    
    try {
      await axios.delete(`${API_BASE}/${activeProject.id}`, getAuthHeaders());
      toast.success('Project deleted');
      createNewProject();
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const deleteProjectFromSidebar = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    
    try {
      await axios.delete(`${API_BASE}/${id}`, getAuthHeaders());
      toast.success('Project deleted');
      if (activeProject && activeProject.id === id) {
        createNewProject();
      }
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const togglePinProject = async (e, proj) => {
    e.stopPropagation();
    try {
      const res = await axios.put(`${API_BASE}/${proj.id}`, {
        pinned: !proj.pinned
      }, getAuthHeaders());
      toast.success(proj.pinned ? 'Project unpinned' : 'Project pinned');
      if (activeProject && activeProject.id === proj.id) {
        setActiveProject(res.data);
      }
      fetchProjects();
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const runCode = async () => {
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

      const res = await axios.post(RUN_API, {
        language: language,
        code: code,
        stdin: stdin
      }, getAuthHeaders());

      const data = res.data;
      
      if (language === 'sql') {
        if (data.error) {
          setOutput(data.error);
        } else if (data.stderr) {
          setOutput(data.stderr);
        } else {
          const headers = data.headers || [];
          const rows = data.rows || [];
          
          if (headers.length > 0) {
            setOutput({
              type: 'table',
              message: data.stdout || `Query executed successfully. ${rows.length} rows returned.`,
              headers,
              rows
            });
          } else {
            setOutput(data.stdout || 'Query executed successfully with no returned rows.');
          }
        }
      } else {
        const out = data.stdout || '';
        const err = data.stderr || '';
        const comp = data.compile_output || '';
        const msg = data.message || '';
        
        let result = '';
        if (comp) result += 'Compile Output:\n' + comp + '\n\n';
        if (out) result += out;
        if (err) result += '\nError:\n' + err;
        if (msg) result += '\nMessage:\n' + msg;
        
        setOutput(result || 'Program finished with no output.');
      }
    } catch (error) {
      setOutput(`Execution failed: ${error.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  // Editor Resizing (exactly like CodeSnippet.js)
  const handleResize = useCallback((e) => {
    const editorDom = document.getElementById('universal-editor-area');
    if (editorDom) {
      const rect = editorDom.getBoundingClientRect();
      const newHeight = Math.max(150, Math.min(800, e.clientY - rect.top));
      setEditorHeight(newHeight);
    }
  }, []);

  const stopResize = useCallback(() => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }, [handleResize]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [handleResize, stopResize]);

  const handleTouchResize = useCallback((e) => {
    const editorDom = document.getElementById('universal-editor-area');
    if (editorDom && e.touches && e.touches[0]) {
      const rect = editorDom.getBoundingClientRect();
      const newHeight = Math.max(100, Math.min(600, e.touches[0].clientY - rect.top));
      setEditorHeight(newHeight);
    }
  }, []);

  const stopTouchResize = useCallback(() => {
    document.removeEventListener('touchmove', handleTouchResize);
    document.removeEventListener('touchend', stopTouchResize);
  }, [handleTouchResize]);

  const startTouchResize = useCallback((e) => {
    document.addEventListener('touchmove', handleTouchResize, { passive: false });
    document.addEventListener('touchend', stopTouchResize);
  }, [handleTouchResize, stopTouchResize]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchmove', handleTouchResize);
      document.removeEventListener('touchend', stopTouchResize);
    };
  }, [handleResize, stopResize, handleTouchResize, stopTouchResize]);

  // SQL Draggable/Resizable Popup Event Handlers
  const handlePopupDragStart = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDraggingPopup(true);
    dragStartOffset.current = {
      x: e.clientX - popupPosition.x,
      y: e.clientY - popupPosition.y
    };
  };

  const handlePopupDragMove = useCallback((e) => {
    if (!isDraggingPopup) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragStartOffset.current.x));
    const newY = Math.max(60, Math.min(window.innerHeight - 100, e.clientY - dragStartOffset.current.y));
    setPopupPosition({ x: newX, y: newY });
  }, [isDraggingPopup]);

  const handlePopupDragEnd = useCallback(() => {
    setIsDraggingPopup(false);
  }, []);

  const handlePopupResizeStart = (e, dir) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingPopup(true);
    resizeDirection.current = dir;
    resizeStartRect.current = {
      x: popupPosition.x,
      y: popupPosition.y,
      width: popupSize.width,
      height: popupSize.height
    };
    resizeStartMouse.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handlePopupResizeMove = useCallback((e) => {
    if (!isResizingPopup) return;
    const deltaX = e.clientX - resizeStartMouse.current.x;
    const deltaY = e.clientY - resizeStartMouse.current.y;
    
    let newWidth = resizeStartRect.current.width;
    let newHeight = resizeStartRect.current.height;
    let newX = resizeStartRect.current.x;
    let newY = resizeStartRect.current.y;
    
    const minW = 300;
    const minH = 200;
    const dir = resizeDirection.current;
    
    if (dir.includes('e')) newWidth = Math.max(minW, resizeStartRect.current.width + deltaX);
    if (dir.includes('s')) newHeight = Math.max(minH, resizeStartRect.current.height + deltaY);
    if (dir.includes('w')) {
      const calcW = resizeStartRect.current.width - deltaX;
      if (calcW >= minW) {
        newWidth = calcW;
        newX = resizeStartRect.current.x + deltaX;
      }
    }
    if (dir.includes('n')) {
      const calcH = resizeStartRect.current.height - deltaY;
      if (calcH >= minH) {
        newHeight = calcH;
        newY = resizeStartRect.current.y + deltaY;
      }
    }
    
    setPopupSize({ width: newWidth, height: newHeight });
    setPopupPosition({ x: newX, y: newY });
  }, [isResizingPopup]);

  const handlePopupResizeEnd = useCallback(() => {
    setIsResizingPopup(false);
  }, []);

  useEffect(() => {
    if (isDraggingPopup) {
      window.addEventListener('mousemove', handlePopupDragMove);
      window.addEventListener('mouseup', handlePopupDragEnd);
    } else {
      window.removeEventListener('mousemove', handlePopupDragMove);
      window.removeEventListener('mouseup', handlePopupDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePopupDragMove);
      window.removeEventListener('mouseup', handlePopupDragEnd);
    };
  }, [isDraggingPopup, handlePopupDragMove, handlePopupDragEnd]);

  useEffect(() => {
    if (isResizingPopup) {
      window.addEventListener('mousemove', handlePopupResizeMove);
      window.addEventListener('mouseup', handlePopupResizeEnd);
    } else {
      window.removeEventListener('mousemove', handlePopupResizeMove);
      window.removeEventListener('mouseup', handlePopupResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePopupResizeMove);
      window.removeEventListener('mouseup', handlePopupResizeEnd);
    };
  }, [isResizingPopup, handlePopupResizeMove, handlePopupResizeEnd]);

  const handleTableSelect = (tableName) => {
    setActiveTablePopup(tableName);
    setShowDbDropdown(false);
    fetchTableData(tableName);
    setPopupPosition({
      x: Math.max(20, window.innerWidth / 2 - 275),
      y: Math.max(80, window.innerHeight / 2 - 200)
    });
  };

  const themeColors = isDark ? {
    bg: '#1E1E1E', // Match Monaco editor background seamlessly
    sidebar: '#252526', // VS Code sidebar
    border: '#333333',
    text: '#D4D4D4',
    primary: 'var(--primary)', // Keep brand primary
    hover: '#2A2D2E',
    panel: '#1E1E1E',
    toolbar: '#252526'
  } : {
    bg: '#FFFFFF',
    sidebar: '#F3F3F3',
    border: '#E5E5E5',
    text: '#333333',
    primary: 'var(--primary)',
    hover: '#E8E8E8',
    panel: '#FFFFFF',
    toolbar: '#F3F3F3'
  };

  // Match fullscreen styles from CodeSnippet.js
  const fullScreenStyle = isFullScreen ? {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    zIndex: 9999, margin: 0, borderRadius: 0,
    display: 'flex', flexDirection: 'column'
  } : {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: themeColors.bg, color: themeColors.text }}>
      <Navbar leftContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-primary)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FiArrowLeft size={18} />
          </button>

          <Link to="/home" className="brand-logo-link" style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.25rem' }}>
            <img src="/favicon.png" alt="LearnTrack Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span className="gold-shimmer-text" style={{ fontWeight: '800' }}>LearnTrack</span>
          </Link>
        </div>
      } />
      
      <div style={{ display: 'flex', position: 'fixed', top: '64px', bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
        
        {/* Collapsible Sidebar */}
        <div style={{ 
          width: isSidebarOpen ? (isMobile ? '100%' : '290px') : '0px', 
          backgroundColor: themeColors.sidebar, 
          borderRight: isSidebarOpen && !isMobile ? `1px solid ${themeColors.border}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 100,
          position: isMobile && isSidebarOpen ? 'absolute' : 'relative',
          height: '100%'
        }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={createNewProject}
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: themeColors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                boxShadow: isDark ? '0 4px 12px rgba(77, 142, 255, 0.2)' : '0 4px 12px rgba(26, 86, 219, 0.2)'
              }}
            >
              <FiPlus /> New Project
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'none',
                border: `1px solid ${themeColors.border}`,
                color: themeColors.text,
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiChevronLeft size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 8px' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'gray', letterSpacing: '0.05em' }}>My Projects</h3>
              <span style={{ fontSize: '0.75rem', color: 'gray', background: themeColors.hover, padding: '2px 8px', borderRadius: '10px' }}>{projects.length}</span>
            </div>
            
            {projects.map(proj => (
              <div 
                key={proj.id}
                onClick={() => loadProject(proj)}
                title={proj.name}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeProject?.id === proj.id ? themeColors.hover : 'transparent',
                  border: activeProject?.id === proj.id ? `1px solid ${themeColors.border}` : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <FiFile style={{ flexShrink: 0, color: activeProject?.id === proj.id ? themeColors.primary : 'gray' }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: activeProject?.id === proj.id ? '600' : '400', fontSize: '0.9rem' }}>
                      {proj.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'gray', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        {proj.language}
                        {proj.fromDwight && (
                          <span style={{
                            fontSize: '0.65rem',
                            background: 'rgba(218,165,32,0.15)',
                            color: '#DAA520',
                            border: '1px solid rgba(218,165,32,0.4)',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                          }}>
                            · Dwight Snippet
                          </span>
                        )}
                      </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => togglePinProject(e, proj)}
                    title={proj.pinned ? "Unpin Project" : "Pin Project"}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      color: proj.pinned ? themeColors.primary : 'gray',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: proj.pinned ? 'rotate(-45deg)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = themeColors.hover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {proj.pinned ? <BsPinFill size={14} /> : <BsPin size={14} />}
                  </button>
                  <button 
                    onClick={(e) => deleteProjectFromSidebar(e, proj.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: themeColors.text, opacity: 0.6, fontSize: '0.85rem' }}>
                No projects saved yet.
              </div>
            )}
          </div>
        </div>

        {/* Collapsible toggle handle for desktop when sidebar is hidden */}
        {!isSidebarOpen && !isMobile && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 101,
              width: '20px',
              height: '40px',
              backgroundColor: themeColors.sidebar,
              border: `1px solid ${themeColors.border}`,
              borderLeft: 'none',
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColors.text
            }}
          >
            <FiChevronRight size={14} />
          </button>
        )}

        {/* Main Compiler Container */}
        <div 
          className="compiler-container" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            border: 'none', 
            borderRadius: 0, 
            margin: 0, 
            overflow: 'hidden',
            ...fullScreenStyle 
          }}
        >
          {/* Toolbar (identical layout to CodeSnippet.js) */}
          <div className="compiler-toolbar" style={{ backgroundColor: themeColors.toolbar, borderBottom: `1px solid ${themeColors.border}` }}>
            <div className="compiler-toolbar-left" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.6rem' }}>
              {isMobile && !isFullScreen && (
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="compiler-toolbar-btn"
                  style={{ padding: '0.45rem', display: 'flex', alignItems: 'center' }}
                >
                  <FiChevronRight size={16} />
                </button>
              )}
              
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                style={{ 
                  background: 'transparent', border: 'none', color: themeColors.text, 
                  fontWeight: '600', fontSize: '14px', outline: 'none', width: isMobile ? '75px' : '150px'
                }}
                placeholder="Project Title"
              />
              
              <select 
                className="compiler-select" 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
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
              
              <button className="compiler-toolbar-btn" onClick={handleTemplate} style={{ padding: isMobile ? '0.45rem' : '0.4rem 0.6rem' }} title="Load template">
                <FiFileText /> {!isMobile && 'TEMPLATE'}
              </button>
            </div>

            <div className="compiler-toolbar-right" style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                      background: themeColors.panel,
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 999,
                      minWidth: '160px',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {dbTables.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', color: themeColors.text, opacity: 0.7, fontSize: '13px' }}>No tables found</div>
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
                              color: themeColors.text,
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'background 0.2s',
                              display: 'block'
                            }}
                            onMouseOver={(e) => e.target.style.background = themeColors.hover}
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
                onClick={copyToClipboard}
                title="Copy Code"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem' }}
              >
                <FiCopy size={14} /> {!isMobile && 'Copy'}
              </button>

              <button 
                className="compiler-toolbar-btn" 
                onClick={saveProject} 
                disabled={isSaving}
                title="Save Project" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem' }}
              >
                <FiSave size={14} /> {!isMobile && (isSaving ? 'Saving...' : 'Save')}
              </button>

              <button 
                className="compiler-toolbar-btn" 
                onClick={deleteCurrentProject} 
                title="Delete active project" 
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <FiTrash2 />
              </button>

              {!isMobile && (
                <button className="compiler-toolbar-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Full Screen" style={{ padding: '0.4rem 0.6rem' }}>
                  {isFullScreen ? <FiMinimize /> : <FiMaximize />}
                </button>
              )}

              <button 
                className="compiler-run-btn" 
                onClick={runCode}
                disabled={isCompiling}
                style={{ padding: isMobile ? '0.4rem 0.6rem' : '0.4rem 1rem' }}
              >
                {isCompiling ? <div className="spinner" style={{width: '14px', height: '14px'}}></div> : <><FiPlay /> {!isMobile && 'Run'}</>}
              </button>
            </div>
          </div>

          {/* Editor Container (identical layout/resize to CodeSnippet.js) */}
          <div 
            id="universal-editor-area"
            className="compiler-editor-area" 
            style={{ flex: isFullScreen ? 1 : 'none', height: isFullScreen ? '100%' : `${editorHeight}px` }}
          >
            <Editor
              height="100%"
              language={language === 'c' || language === 'cpp' ? 'cpp' : language}
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={val => setCode(val)}
              options={{
                minimap: { enabled: false },
                fontSize: isMobile ? 12 : 14,
                fontFamily: "'Consolas', 'Courier New', monospace",
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                padding: { top: 0, bottom: 0 }
              }}
            />
          </div>

          {/* Drag Resize Handle */}
          {!isFullScreen && (
            <div 
              className="compiler-resize-handle"
              onMouseDown={startResize}
              onTouchStart={startTouchResize}
              style={{
                height: '6px',
                backgroundColor: themeColors.border,
                cursor: 'row-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
                margin: '2px 0'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = themeColors.primary}
              onMouseOut={(e) => e.target.style.backgroundColor = themeColors.border}
            />
          )}

          {/* Output Console (identical layout to CodeSnippet.js) */}
          <div 
            className="compiler-console" 
            style={{ 
              height: isFullScreen ? '250px' : 'auto', 
              flex: isFullScreen ? 'none' : 1, 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: themeColors.panel,
              borderTop: `1px solid ${themeColors.border}`
            }}
          >
            <div className="compiler-console-tabs" style={{ backgroundColor: themeColors.toolbar, borderBottom: `1px solid ${themeColors.border}` }}>
              <button 
                className={`compiler-console-tab ${activeTab === 'output' ? 'active' : ''}`} 
                onClick={() => setActiveTab('output')}
                style={{
                  color: activeTab === 'output' ? themeColors.text : 'var(--text-secondary)',
                  borderBottom: activeTab === 'output' ? `2px solid ${themeColors.primary}` : 'none',
                  backgroundColor: 'transparent'
                }}
              >
                Output
              </button>
              <button 
                className={`compiler-console-tab ${activeTab === 'input' ? 'active' : ''}`} 
                onClick={() => setActiveTab('input')}
                style={{
                  color: activeTab === 'input' ? themeColors.text : 'var(--text-secondary)',
                  borderBottom: activeTab === 'input' ? `2px solid ${themeColors.primary}` : 'none',
                  backgroundColor: 'transparent'
                }}
              >
                Stdin (Input)
              </button>
            </div>

            <div className="compiler-console-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: themeColors.panel, color: themeColors.text }}>
              {activeTab === 'output' && (
                <div>
                  {typeof output === 'object' && output !== null && output.type === 'table' ? (
                    <div>
                      <div style={{ color: '#A7F3D0', marginBottom: '0.75rem', fontWeight: '500' }}>
                        {output.message}
                      </div>
                      {output.headers.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="sql-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e2e8f0', border: '1px solid var(--border)' }}>
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
                                      borderBottom: '1px solid var(--border)', 
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
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SQL Table Draggable & Resizable Modal (Identical styling to CodeSnippet.js) */}
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
            onMouseDown={handlePopupDragStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: isDraggingPopup ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
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
                  marginLeft: '8px'
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
                borderRadius: '4px'
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Table Data View */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {isLoadingTable ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: '#94a3b8' }}>
                <span style={{ fontSize: '13px' }}>Loading table records...</span>
              </div>
            ) : !tableData ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
                No records loaded
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
                      <td colSpan={tableData.headers.length} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
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
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'n')}
            style={{ position: 'absolute', top: 0, left: '8px', right: '8px', height: '6px', cursor: 'n-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 's')}
            style={{ position: 'absolute', bottom: 0, left: '8px', right: '8px', height: '6px', cursor: 's-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'e')}
            style={{ position: 'absolute', top: '8px', bottom: '8px', right: 0, width: '6px', cursor: 'e-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'w')}
            style={{ position: 'absolute', top: '8px', bottom: '8px', left: 0, width: '6px', cursor: 'w-resize', zIndex: 10001 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'nw')}
            style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', cursor: 'nw-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'ne')}
            style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', cursor: 'ne-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'sw')}
            style={{ position: 'absolute', bottom: 0, left: 0, width: '10px', height: '10px', cursor: 'sw-resize', zIndex: 10002 }}
          />
          <div 
            onMouseDown={(e) => handlePopupResizeStart(e, 'se')}
            style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', cursor: 'se-resize', zIndex: 10002 }}
          />
        </div>
      )}
    </div>
  );
};

export default UniversalCompilerPage;
