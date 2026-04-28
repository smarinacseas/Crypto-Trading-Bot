import React, { useEffect, useId, useRef, memo } from 'react';

/**
 * TradingView advanced chart widget. Pass `symbol` like "NASDAQ:AAPL" or
 * "AAPL" (defaults to NASDAQ). Height is configurable for compact use.
 */
function TradingViewWidget({ symbol = 'NASDAQ:AAPL', height = 500, interval = 'D' }) {
  const container = useRef();
  const widgetId = useId().replace(/:/g, '');

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    el.innerHTML = '';

    const fullSymbol = symbol.includes(':') ? symbol : `NASDAQ:${symbol}`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval,
      locale: 'en',
      save_image: false,
      style: '1',
      symbol: fullSymbol,
      theme: 'dark',
      timezone: 'Etc/UTC',
      backgroundColor: 'rgba(11, 21, 31, 1)',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      withdateranges: true,
      width: '100%',
      height: '100%',
      container_id: `tv_${widgetId}`,
    });
    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = '';
    };
  }, [symbol, interval, widgetId]);

  return (
    <div
      ref={container}
      style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden' }}
    >
      <div id={`tv_${widgetId}`} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default memo(TradingViewWidget);
