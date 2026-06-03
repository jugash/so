import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import QuestionPage from './pages/QuestionPage';
import AskPage from './pages/AskPage';
import TagsPage from './pages/TagsPage';
import UserProfilePage from './pages/UserProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    const theme = localStorage.getItem('theme') || 'dark';
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: theme === 'light' ? '#f8fafc' : '#0a0b10',
        color: theme === 'light' ? '#0f172a' : '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>MetalStack</div>
        <div style={{ color: theme === 'light' ? '#475569' : '#94a3b8', fontSize: '0.9rem' }}>Initializing secure connection...</div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/questions/:id" element={<QuestionPage />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
