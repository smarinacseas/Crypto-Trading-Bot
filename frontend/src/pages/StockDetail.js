import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import TradingViewWidget from '../components/TradingViewWidget';
import { getStock, getStockBars } from '../lib/api';
import {
  fmtCompact,
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  fmtRatio,
  fmtVolume,
  pctClass,
} from '../lib/format';

function Stat({ label, value, color }) {
  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-3">
      <div className="text-xs text-neutral-400 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${color || 'text-neutral-100'}`}>{value}</div>
    </div>
  );
}

export default function StockDetail() {
  const { ticker } = useParams();
  const [stock, setStock] = useState(null);
  const [bars, setBars] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStock(null);
    setBars([]);
    setError(null);
    getStock(ticker).then(setStock).catch((e) => setError(e?.message || 'Not found'));
    getStockBars(ticker, 252).then(setBars).catch(() => setBars([]));
  }, [ticker]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/screener" className="inline-flex items-center text-primary-300 hover:text-primary-200 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to screener
        </Link>
        <div className="bg-rose-950/40 border border-rose-700 text-rose-200 rounded-lg p-4">
          {error}. Try refreshing data for this ticker first.
        </div>
      </div>
    );
  }

  if (!stock) {
    return <div className="text-neutral-400">Loading...</div>;
  }

  const s = stock.latest_snapshot || {};
  const tvSymbol = stock.exchange === 'NYQ' || stock.exchange === 'NYSE'
    ? `NYSE:${stock.ticker}`
    : `NASDAQ:${stock.ticker}`;

  const chartData = bars.map((b) => ({
    date: b.bar_date,
    close: b.close,
  }));

  return (
    <div className="space-y-6">
      <Link to="/screener" className="inline-flex items-center text-primary-300 hover:text-primary-200 text-sm">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to screener
      </Link>

      {/* Header */}
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-neutral-100 font-mono">{stock.ticker}</h1>
              <span className="text-neutral-400">{stock.name}</span>
            </div>
            <div className="mt-1 text-sm text-neutral-400 flex flex-wrap gap-x-3 gap-y-1">
              {stock.sector && <span>{stock.sector}</span>}
              {stock.industry && <span>· {stock.industry}</span>}
              {stock.exchange && <span>· {stock.exchange}</span>}
              {s.as_of && <span>· Snapshot {fmtDateTime(s.as_of)}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-neutral-100">{fmtCurrency(s.price)}</div>
            <div className={`text-sm ${pctClass(s.day_change_pct)}`}>{fmtPct(s.day_change_pct)} today</div>
          </div>
        </div>
      </div>

      {/* Live chart */}
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-2">
        <TradingViewWidget symbol={tvSymbol} height={520} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Market Cap" value={fmtCompact(s.market_cap)} />
        <Stat label="P/E (TTM)" value={fmtRatio(s.pe_ratio)} />
        <Stat label="Forward P/E" value={fmtRatio(s.forward_pe)} />
        <Stat label="PEG" value={fmtRatio(s.peg_ratio)} />
        <Stat label="P/B" value={fmtRatio(s.price_to_book)} />
        <Stat label="Beta" value={fmtRatio(s.beta)} />

        <Stat label="Short % Float" value={fmtPct(s.short_percent_of_float)} />
        <Stat label="Short Ratio (days)" value={fmtRatio(s.short_ratio)} />
        <Stat label="Shares Short" value={fmtCompact(s.shares_short)?.replace('$', '')} />
        <Stat label="Float" value={fmtCompact(s.float_shares)?.replace('$', '')} />
        <Stat label="Volume" value={fmtVolume(s.volume)} />
        <Stat label="Avg Vol 10d" value={fmtVolume(s.avg_volume_10d)} />

        <Stat label="Profit Margin" value={s.profit_margin != null ? fmtPct(s.profit_margin * 100) : '—'} />
        <Stat label="Revenue Growth" value={s.revenue_growth != null ? fmtPct(s.revenue_growth * 100) : '—'} color={pctClass(s.revenue_growth)} />
        <Stat label="Earnings Growth" value={s.earnings_growth != null ? fmtPct(s.earnings_growth * 100) : '—'} color={pctClass(s.earnings_growth)} />
        <Stat label="52W High" value={fmtCurrency(s.fifty_two_week_high)} />
        <Stat label="52W Low" value={fmtCurrency(s.fifty_two_week_low)} />
        <Stat label="Sentiment" value={fmtRatio(s.sentiment_score)} />
      </div>

      {/* Historical close chart */}
      {chartData.length > 0 && (
        <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">
            Daily close (last {chartData.length} bars)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ background: '#0e1a28', border: '1px solid #1f2d3d', borderRadius: 6 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#47a7c7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
