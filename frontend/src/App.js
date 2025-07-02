import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import DataStreams from './pages/DataStreams';
import Indicators from './pages/Indicators';
import Account from './pages/Account';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const demoMode = localStorage.getItem('demo_mode');
    setIsAuthenticated(!!token || !!demoMode);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/trading" element={
          <Layout>
            <Trading />
          </Layout>
        } />
        <Route path="/data-streams" element={
          <Layout>
            <DataStreams />
          </Layout>
        } />
        <Route path="/indicators" element={
          <Layout>
            <Indicators />
          </Layout>
        } />
        <Route path="/account" element={
          <Layout>
            <Account />
          </Layout>
        } />
        
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;