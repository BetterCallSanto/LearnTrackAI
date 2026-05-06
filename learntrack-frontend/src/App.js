import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CreateJourneyPage from './pages/CreateJourneyPage';
import JourneyDetailPage from './pages/JourneyDetailPage';
import CreateLogPage from './pages/CreateLogPage';
import RevisionPage from './pages/RevisionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/journey/create" element={
            <ProtectedRoute>
              <CreateJourneyPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journey/:id/logs" element={
            <ProtectedRoute>
              <JourneyDetailPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journey/:id/logs/new" element={
            <ProtectedRoute>
              <CreateLogPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journey/:id/logs/:logId" element={
            <ProtectedRoute>
              <CreateLogPage />
            </ProtectedRoute>
          } />
          
          <Route path="/journey/:id/revision" element={
            <ProtectedRoute>
              <RevisionPage />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
