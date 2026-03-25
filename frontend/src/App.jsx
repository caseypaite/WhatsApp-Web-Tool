import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import PollVotingPage from './pages/PollVotingPage.jsx';
import PollEditPage from './pages/PollEditPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import './index.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (roles && !roles.some(role => user.roles?.includes(role))) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/poll/:id" element={<PollVotingPage />} />
        <Route path="/poll/edit/:id" element={
          <ProtectedRoute>
            <PollEditPage />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={
          <ProtectedRoute roles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
