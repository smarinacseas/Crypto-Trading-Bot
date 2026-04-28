import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addToBasket as apiAdd,
  bulkAddToBasket as apiBulk,
  clearBasket as apiClear,
  listBasket,
  removeFromBasket as apiRemove,
} from '../lib/api';

const BasketContext = createContext(null);

export function BasketProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listBasket();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tickers = useMemo(() => new Set(items.map((i) => i.ticker)), [items]);

  const add = useCallback(async (ticker, note) => {
    const item = await apiAdd(ticker, note);
    setItems((prev) => {
      const without = prev.filter((p) => p.ticker !== item.ticker);
      return [item, ...without];
    });
    return item;
  }, []);

  const bulkAdd = useCallback(async (tickerList) => {
    const all = await apiBulk(tickerList);
    setItems(all);
    return all;
  }, []);

  const remove = useCallback(async (ticker) => {
    await apiRemove(ticker);
    setItems((prev) => prev.filter((p) => p.ticker !== ticker));
  }, []);

  const clear = useCallback(async () => {
    await apiClear();
    setItems([]);
  }, []);

  const value = { items, tickers, loading, add, bulkAdd, remove, clear, refresh };
  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used inside BasketProvider');
  return ctx;
}
