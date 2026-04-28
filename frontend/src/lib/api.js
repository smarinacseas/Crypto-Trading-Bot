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

// Screener presets
export const listPresets = () => api.get('/screener-presets').then(r => r.data);
export const createPreset = (preset) => api.post('/screener-presets', preset).then(r => r.data);
export const updatePreset = (id, body) => api.put(`/screener-presets/${id}`, body).then(r => r.data);
export const deletePreset = (id) => api.delete(`/screener-presets/${id}`);

// Basket
export const listBasket = () => api.get('/basket').then(r => r.data);
export const addToBasket = (ticker, note = null) =>
  api.post('/basket', { ticker, note }).then(r => r.data);
export const bulkAddToBasket = (tickers) =>
  api.post('/basket/bulk', { tickers }).then(r => r.data);
export const removeFromBasket = (ticker) => api.delete(`/basket/${ticker}`);
export const clearBasket = () => api.delete('/basket');
