import axios from 'axios';

// CRA dev server proxies "/api" -> http://localhost:8000 (see package.json).
// For prod builds, set REACT_APP_API_BASE.
const baseURL = process.env.REACT_APP_API_BASE || '/api';

export const api = axios.create({ baseURL, timeout: 30000 });

// Stocks
export const listStocks = (params = {}) => api.get('/stocks', { params }).then(r => r.data);
export const getStock = (ticker) => api.get(`/stocks/${ticker}`).then(r => r.data);
export const getStockBars = (ticker, limit = 252) =>
  api.get(`/stocks/${ticker}/bars`, { params: { limit } }).then(r => r.data);

// Sectors
export const listSectors = () => api.get('/sectors').then(r => r.data);

// Refresh
export const refreshUniverse = (tickers = null) =>
  api.post('/refresh', { tickers }).then(r => r.data);
export const refreshUniverseSync = (tickers) =>
  api.post('/refresh/sync', { tickers }).then(r => r.data);
