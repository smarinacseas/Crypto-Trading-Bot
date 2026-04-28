import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import StockDetail from './pages/StockDetail';
import Sectors from './pages/Sectors';
import Watchlist from './pages/Watchlist';
import Refresh from './pages/Refresh';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/sectors" element={<Sectors />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/refresh" element={<Refresh />} />
          <Route path="/stocks/:ticker" element={<StockDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
