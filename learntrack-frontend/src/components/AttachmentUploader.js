import React, { useState } from 'react';
import { FiPaperclip, FiImage, FiLink, FiYoutube, FiX, FiExternalLink, FiDownload } from 'react-icons/fi';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';

const AttachmentUploader = ({ logId, attachments, onAttachmentsChange }) => {
  const [activeTab, setActiveTab] = useState('FILE'); // FILE, IMAGE, LINK, YOUTUBE
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setIsLoading(true);
    
    try {
      if (!logId) {
        // Draft mode: Add to local state without API call
        if (activeTab === 'FILE' || activeTab === 'IMAGE') {
          if (!selectedFile) {
            toast.error('Please select a file');
            setIsLoading(false);
            return;
          }
          const draftAtt = {
            id: `draft-${Date.now()}`,
            attachmentType: activeTab,
            file: selectedFile,
            fileName: selectedFile.name,
            isDraft: true
          };
          onAttachmentsChange([...attachments, draftAtt]);
        } else {
          if (!linkUrl.trim()) {
            toast.error('Please enter a URL');
            setIsLoading(false);
            return;
          }
          if (activeTab === 'YOUTUBE' && !getEmbedUrl(linkUrl)) {
            toast.error('Invalid YouTube URL');
            setIsLoading(false);
            return;
          }
          const draftAtt = {
            id: `draft-${Date.now()}`,
            attachmentType: activeTab,
            linkUrl: linkUrl,
            isDraft: true
          };
          onAttachmentsChange([...attachments, draftAtt]);
        }
        setSelectedFile(null);
        setLinkUrl('');
        setIsLoading(false);
        return;
      }

      // Existing API upload logic for saved logs
      let formData = new FormData();
      formData.append('attachmentType', activeTab);
      
      if (activeTab === 'FILE' || activeTab === 'IMAGE') {
        if (!selectedFile) {
          toast.error('Please select a file');
          setIsLoading(false);
          return;
        }
        formData.append('file', selectedFile);
      } else {
        if (!linkUrl.trim()) {
          toast.error('Please enter a URL');
          setIsLoading(false);
          return;
        }
        if (activeTab === 'YOUTUBE' && !getEmbedUrl(linkUrl)) {
          toast.error('Invalid YouTube URL');
          setIsLoading(false);
          return;
        }
        formData.append('linkUrl', linkUrl);
      }

      const res = await api.post(`/api/logs/${logId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onAttachmentsChange([...attachments, res.data]);
      toast.success('Attachment added');
      
      // Reset forms
      setSelectedFile(null);
      setLinkUrl('');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attId) => {
    if (window.confirm('Delete this attachment?')) {
      const att = attachments.find(a => a.id === attId);
      if (att && att.isDraft) {
        onAttachmentsChange(attachments.filter(a => a.id !== attId));
        return;
      }
      try {
        await api.delete(`/api/attachments/${attId}`);
        onAttachmentsChange(attachments.filter(a => a.id !== attId));
        toast.success('Attachment deleted');
      } catch (error) {
        toast.error('Failed to delete attachment');
      }
    }
  };

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiPaperclip /> Attachments
      </h3>

      {/* Upload Controls */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-input)' }}>
        <div className="tabs-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button 
            type="button"
            className={activeTab === 'FILE' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => {setActiveTab('FILE'); setSelectedFile(null); setLinkUrl('');}}
            style={{ padding: '0.3rem 0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
          >
            <FiFileText /> File
          </button>
          <button 
            type="button"
            className={activeTab === 'IMAGE' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => {setActiveTab('IMAGE'); setSelectedFile(null); setLinkUrl('');}}
            style={{ padding: '0.3rem 0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
          >
            <FiImage /> Image
          </button>
          <button 
            type="button"
            className={activeTab === 'LINK' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => {setActiveTab('LINK'); setSelectedFile(null); setLinkUrl('');}}
            style={{ padding: '0.3rem 0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
          >
            <FiLink /> Link
          </button>
          <button 
            type="button"
            className={activeTab === 'YOUTUBE' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => {setActiveTab('YOUTUBE'); setSelectedFile(null); setLinkUrl('');}}
            style={{ padding: '0.3rem 0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
          >
            <FiYoutube /> YouTube
          </button>
        </div>

        <div className="flex-mobile-col" style={{ display: 'flex', gap: '1rem' }}>
          {(activeTab === 'FILE' || activeTab === 'IMAGE') ? (
            <input 
              id="file-upload-input"
              type="file" 
              className="form-control" 
              onChange={handleFileChange}
              accept={activeTab === 'IMAGE' ? 'image/*' : '*/*'}
            />
          ) : (
            <input 
              type="url" 
              className="form-control" 
              placeholder={activeTab === 'YOUTUBE' ? "https://youtube.com/watch?v=..." : "https://..."}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          )}
          <button type="button" className="btn-primary" onClick={handleUpload} disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Add'}
          </button>
        </div>
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {attachments.map(att => (
            <div key={att.id} style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-card)', position: 'relative' }}>
              <button 
                type="button"
                onClick={() => handleDelete(att.id)}
                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '0.2rem', color: 'var(--error)', zIndex: 10 }}
              >
                <FiX size={16} />
              </button>

              {att.attachmentType === 'IMAGE' && (
                <div style={{ height: '120px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                  <img src={`${API_BASE}${att.fileUrl}`} alt={att.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {att.attachmentType === 'YOUTUBE' && (
                <div style={{ height: '120px' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={getEmbedUrl(att.linkUrl)} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                {att.attachmentType === 'FILE' && <FiFileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                {att.attachmentType === 'LINK' && <FiLink size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                
                <div style={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.attachmentType === 'LINK' || att.attachmentType === 'YOUTUBE' ? (
                    <a href={att.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {att.linkUrl} <FiExternalLink size={12} />
                    </a>
                  ) : (
                    <a href={`${API_BASE}${att.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} download>
                      {att.fileName} <FiDownload size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FiFileText = () => <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

export default AttachmentUploader;
