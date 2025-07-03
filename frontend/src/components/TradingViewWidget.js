import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef();

  useEffect(() => {
    // Capture the ref value at the start of the effect
    const containerElement = container.current;
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Clear any existing content
        if (containerElement) {
          containerElement.innerHTML = '';
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        
        // Add error handling for script loading
        script.onerror = (error) => {
          console.error('TradingViewWidget: Failed to load TradingView script:', error);
          // Show a fallback message instead of crashing
          if (containerElement) {
            containerElement.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">
                <div style="text-align: center;">
                  <div style="margin-bottom: 8px;">📊</div>
                  <div>TradingView chart is temporarily unavailable</div>
                  <div style="font-size: 12px; margin-top: 4px;">Please refresh the page to try again</div>
                </div>
              </div>
            `;
          }
        };

        // Add load event handler for successful loading
        script.onload = () => {
          console.log('TradingViewWidget: Script loaded successfully');
        };

        script.innerHTML = `
          {
            "allow_symbol_change": true,
            "calendar": false,
            "details": false,
            "hide_side_toolbar": false,
            "hide_top_toolbar": false,
            "hide_legend": false,
            "hide_volume": true,
            "hotlist": true,
            "interval": "240",
            "locale": "en",
            "save_image": false,
            "style": "2",
            "symbol": "AMEX:SPY",
            "theme": "dark",
            "timezone": "Etc/UTC",
            "backgroundColor": "rgba(24, 24, 24, 0.89)",
            "gridColor": "rgba(242, 242, 242, 0.06)",
            "watchlist": [
              "AMEX:SPY",
              "NASDAQ:QQQ",
              "AMEX:IWM",
              "NASDAQ:AAPL",
              "NASDAQ:TSLA",
              "NASDAQ:NVDA",
              "NASDAQ:MSFT",
              "NASDAQ:GOOGL",
              "NASDAQ:COIN",
              "BITSTAMP:BTCUSD",
              "BITSTAMP:ETHUSD",
              "COINBASE:SOLUSD",
              "NASDAQ:HOOD"
            ],
            "withdateranges": false,
            "compareSymbols": [],
            "studies": [],
            "width": "100%",
            "height": "100%",
            "container_id": "tradingview-widget"
          }`;
        
        if (containerElement) {
          try {
            containerElement.appendChild(script);
          } catch (error) {
            console.error('TradingViewWidget: Error appending script to container:', error);
            // Show fallback message
            containerElement.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">
                <div style="text-align: center;">
                  <div style="margin-bottom: 8px;">📊</div>
                  <div>TradingView chart failed to load</div>
                  <div style="font-size: 12px; margin-top: 4px;">Please check your internet connection</div>
                </div>
              </div>
            `;
          }
        }
      } catch (error) {
        console.error('TradingViewWidget: Unexpected error during initialization:', error);
        // Show fallback message
        if (containerElement) {
          containerElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">
              <div style="text-align: center;">
                <div style="margin-bottom: 8px;">📊</div>
                <div>TradingView chart is unavailable</div>
                <div style="font-size: 12px; margin-top: 4px;">Please try again later</div>
              </div>
            </div>
          `;
        }
      }
    }, 100); // Small delay to ensure DOM is ready

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (containerElement) {
        try {
          // Remove all script tags to prevent multiple instances
          const scripts = containerElement.querySelectorAll('script');
          scripts.forEach(scriptElement => scriptElement.remove());
          // Clear the container
          containerElement.innerHTML = '';
        } catch (error) {
          console.warn('TradingViewWidget: Error during cleanup:', error);
        }
      }
    };
  }, []);

  // Wrap the entire component in error boundary
  try {
    return (
      <div 
        className="tradingview-widget-container" 
        ref={container} 
        style={{ 
          height: "400px", 
          width: "100%", 
          position: "relative",
          overflow: "hidden",
          backgroundColor: "rgba(24, 24, 24, 0.89)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <div 
          className="tradingview-widget-container__widget" 
          id="tradingview-widget"
          style={{ 
            height: "100%", 
            width: "100%",
            backgroundColor: "rgba(24, 24, 24, 0.89)"
          }}
        ></div>
      </div>
    );
  } catch (error) {
    console.error('TradingViewWidget: Error rendering component:', error);
    return (
      <div 
        style={{ 
          height: "400px", 
          width: "100%", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "rgba(24, 24, 24, 0.89)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#888",
          fontSize: "14px"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "8px" }}>📊</div>
          <div>TradingView chart is unavailable</div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>Please try again later</div>
        </div>
      </div>
    );
  }
}

export default memo(TradingViewWidget);