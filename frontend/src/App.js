import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import Trading from './pages/Trading';
import DataStreams from './pages/DataStreams';
import Indicators from './pages/Indicators';
import Strategies from './pages/Strategies';
import Backtesting from './pages/Backtesting';
import PaperTrading from './pages/PaperTrading';
import Account from './pages/Account';
import AuthCallback from './pages/AuthCallback';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from './components/ui/toaster.jsx';

// App Routes component that uses auth context
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
      } />
      
      {/* OAuth callback route */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        isAuthenticated ? (
          <Layout>
            <ModernDashboard />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/dashboard/classic" element={
        isAuthenticated ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/trading" element={
        isAuthenticated ? (
          <Layout>
            <Trading />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/data-streams" element={
        isAuthenticated ? (
          <Layout>
            <DataStreams />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/indicators" element={
        isAuthenticated ? (
          <Layout>
            <Indicators />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/strategies" element={
        isAuthenticated ? (
          <Layout>
            <Strategies />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/backtesting" element={
        isAuthenticated ? (
          <Layout>
            <Backtesting />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/paper-trading" element={
        isAuthenticated ? (
          <Layout>
            <PaperTrading />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      <Route path="/account" element={
        isAuthenticated ? (
          <Layout>
            <Account />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />
      
      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;