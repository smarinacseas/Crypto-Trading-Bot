import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Section from '../components/Section';
import BasketButton from '../components/BasketButton';
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

function Field({ label, value, valueClass = '' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="section-label">{label}</span>
      <span className={`num text-sm font-medium text-neutral-100 ${valueClass}`}>{value}</span>
    </div>
  );
}

function FieldGrid({ children, cols = 6 }) {
  const colsClass = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[cols];
  return <div className={`grid ${colsClass} gap-x-6 gap-y-4`}>{children}</div>;
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
          {error}. Refresh the ticker first.
        </div>
      </div>
    );
  }

  if (!stock) return <div className="text-neutral-400 text-sm">Loading…</div>;

  const s = stock.latest_snapshot || {};
  const tvSymbol = stock.exchange === 'NYQ' || stock.exchange === 'NYSE'
    ? `NYSE:${stock.ticker}`
    : `NASDAQ:${stock.ticker}`;

  const chartData = bars.map((b) => ({ date: b.bar_date, close: b.close }));

  return (
    <div className="space-y-4">
      <Link to="/screener" className="inline-flex items-center text-primary-300 hover:text-primary-200 text-sm">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to screener
      </Link>

      {/* Header */}
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BasketButton ticker={stock.ticker} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="ticker text-3xl font-bold text-neutral-100">{stock.ticker}</h1>
                <span className="text-neutral-400 text-sm truncate">{stock.name}</span>
              </div>
              <div className="mt-1 text-xs text-neutral-500 flex flex-wrap gap-x-3">
                {stock.sector && <span>{stock.sector}</span>}
                {stock.industry && <span>· {stock.industry}</span>}
                {stock.exchange && <span>· {stock.exchange}</span>}
                {s.as_of && <span>· {fmtDateTime(s.as_of)}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="num text-3xl font-semibold text-neutral-100">{fmtCurrency(s.price)}</div>
            <div className={`num text-sm ${pctClass(s.day_change_pct)}`}>{fmtPct(s.day_change_pct)} today</div>
          </div>
        </div>
      </div>

      {/* Live chart */}
      <Section title="Live chart" subtitle="TradingView · realtime" dense>
        <div className="p-2">
          <TradingViewWidget symbol={tvSymbol} height={520} />
        </div>
      </Section>

      {/* Fundamentals — collapsible groups */}
      <Section title="Valuation" collapsible defaultOpen>
        <FieldGrid cols={6}>
          <Field label="Market cap" value={fmtCompact(s.market_cap)} />
          <Field label="P/E (TTM)" value={fmtRatio(s.pe_ratio)} />
          <Field label="Forward P/E" value={fmtRatio(s.forward_pe)} />
          <Field label="PEG" value={fmtRatio(s.peg_ratio)} />
          <Field label="P/B" value={fmtRatio(s.price_to_book)} />
          <Field label="Beta" value={fmtRatio(s.beta)} />
        </FieldGrid>
      </Section>

      <Section title="Short interest" collapsible defaultOpen>
        <FieldGrid cols={4}>
          <Field label="Short % of float" value={fmtPct(s.short_percent_of_float)} />
          <Field label="Days to cover" value={fmtRatio(s.short_ratio)} />
          <Field label="Shares short" value={fmtCompact(s.shares_short)?.replace('$', '')} />
          <Field label="Float" value={fmtCompact(s.float_shares)?.replace('$', '')} />
        </FieldGrid>
      </Section>

      <Section title="Growth & profitability" collapsible defaultOpen={false}>
        <FieldGrid cols={4}>
          <Field
            label="Profit margin"
            value={s.profit_margin != null ? fmtPct(s.profit_margin * 100) : '—'}
          />
          <Field
            label="Revenue growth"
            value={s.revenue_growth != null ? fmtPct(s.revenue_growth * 100) : '—'}
            valueClass={pctClass(s.revenue_growth)}
          />
          <Field
            label="Earnings growth"
            value={s.earnings_growth != null ? fmtPct(s.earnings_growth * 100) : '—'}
            valueClass={pctClass(s.earnings_growth)}
          />
          <Field label="Sentiment" value={fmtRatio(s.sentiment_score)} />
        </FieldGrid>
      </Section>

      <Section title="Volume & range" collapsible defaultOpen={false}>
        <FieldGrid cols={4}>
          <Field label="Volume" value={fmtVolume(s.volume)} />
          <Field label="Avg vol 10d" value={fmtVolume(s.avg_volume_10d)} />
          <Field label="52W high" value={fmtCurrency(s.fifty_two_week_high)} />
          <Field label="52W low" value={fmtCurrency(s.fifty_two_week_low)} />
        </FieldGrid>
      </Section>

      {/* Local close history chart */}
      {chartData.length > 0 && (
        <Section
          title="Daily close"
          subtitle={`${chartData.length} bars`}
          collapsible
          defaultOpen
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={40} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['auto', 'auto']} width={60} />
                <Tooltip
                  contentStyle={{ background: '#0e1a28', border: '1px solid #1f2d3d', borderRadius: 6 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Line type="monotone" dataKey="close" stroke="#47a7c7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}
    </div>
  );
}
