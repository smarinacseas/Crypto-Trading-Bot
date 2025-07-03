import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import DataStreams from './pages/DataStreams';
import Indicators from './pages/Indicators';
import Strategies from './pages/Strategies';
import Backtesting from './pages/Backtesting';
import PaperTrading from './pages/PaperTrading';
import Account from './pages/Account';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const demoMode = localStorage.getItem('demo_mode');
    
    // If user has auth token, clear demo mode
    if (token) {
      localStorage.removeItem('demo_mode');
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(!!demoMode);
    }
    
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
      <ScrollToTop />
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
        <Route path="/strategies" element={
          <Layout>
            <Strategies />
          </Layout>
        } />
        <Route path="/backtesting" element={
          <Layout>
            <Backtesting />
          </Layout>
        } />
        <Route path="/paper-trading" element={
          <Layout>
            <PaperTrading />
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