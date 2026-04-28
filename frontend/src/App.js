import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { BasketProvider } from './contexts/BasketContext';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import StockDetail from './pages/StockDetail';
import Sectors from './pages/Sectors';
import Basket from './pages/Basket';
import Refresh from './pages/Refresh';

export default function App() {
  return (
    <BasketProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/sectors" element={<Sectors />} />
            <Route path="/basket" element={<Basket />} />
            <Route path="/refresh" element={<Refresh />} />
            <Route path="/stocks/:ticker" element={<StockDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </BasketProvider>
  );
}
