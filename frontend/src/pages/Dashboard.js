import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  SignalIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [portfolioStats, setPortfolioStats] = useState({
    totalValueUsd: '0.00',
    totalPnlUsd: '0.00',
    totalTrades: 0,
    avgSuccessRate: '0.0',
    totalActivePositions: 0,
    totalPortfolios: 0,
  });

  const [recentPositions, setRecentPositions] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const [pnlChart] = useState({
    labels: [],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  });

  const fetchPortfolioStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPortfolioStats(data);
        setRecentPositions(data.recent_positions || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio stats:', error);
    }
  };

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Start receiving live trade data
      ws.send(JSON.stringify({
        action: 'start_stream',
        stream_type: 'standard',
        symbol: 'btcusdt'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'standard_trade') {
        setLiveMessages(prev => [message, ...prev.slice(0, 49)]);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return ws; // Return the websocket instance
  }, []); // Empty dependency array to prevent recreation

  useEffect(() => {
    // Fetch portfolio stats
    fetchPortfolioStats();
    
    // Connect to WebSocket for live data and store the instance
    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]); // Only depend on connectWebSocket

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Portfolio Value Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const statCards = [
    {
      name: 'Total Portfolio Value',
      value: `$${portfolioStats.totalValueUsd || '0.00'}`,
      change: (portfolioStats.totalPnlUsd || 0) > 0 ? `+$${portfolioStats.totalPnlUsd || '0.00'}` : `-$${Math.abs(portfolioStats.totalPnlUsd || 0)}`,
      changeType: (portfolioStats.totalPnlUsd || 0) >= 0 ? 'positive' : 'negative',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Total Trades',
      value: (portfolioStats.totalTrades || 0).toString(),
      change: 'All time',
      changeType: 'neutral',
      icon: ChartBarIcon,
    },
    {
      name: 'Success Rate',
      value: `${portfolioStats.avgSuccessRate || '0.0'}%`,
      change: 'Average across portfolios',
      changeType: (portfolioStats.avgSuccessRate || 0) > 50 ? 'positive' : 'negative',
      icon: SignalIcon,
    },
    {
      name: 'Active Positions',
      value: (portfolioStats.totalActivePositions || 0).toString(),
      change: `${portfolioStats.totalPortfolios || 0} portfolios`,
      changeType: 'neutral',
      icon: ClockIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Portfolio Overview</h3>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-3xl font-bold">${portfolioStats.totalValueUsd || '0.00'}</span>
              <div className={`flex items-center ${(portfolioStats.totalPnlUsd || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {(portfolioStats.totalPnlUsd || 0) >= 0 ? (
                  <ArrowUpIcon className="w-5 h-5 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5 mr-1" />
                )}
                <span className="font-medium">
                  {(portfolioStats.totalPnlUsd || 0) >= 0 ? '+' : ''}{portfolioStats.totalPnlUsd || '0.00'} P&L
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Data Connection</div>
            <div className={`flex items-center ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`}></div>
              <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Analytics and Recent Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Value Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
          <Line data={pnlChart} options={chartOptions} />
        </div>

        {/* Recent Positions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Positions</h3>
          <div className="space-y-4">
            {recentPositions.length > 0 ? recentPositions.map((position, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    position.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {position.side}
                  </div>
                  <div>
                    <div className="font-medium">{position.symbol}</div>
                    <div className="text-sm text-gray-600">{position.size} @ ${position.entry_price}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded ${
                    position.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {position.status}
                  </div>
                  <div className={`text-xs mt-1 ${
                    parseFloat(position.pnl_usd) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(position.pnl_usd) >= 0 ? '+' : ''}${position.pnl_usd}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <p>No recent positions</p>
                <p className="text-sm">Start trading to see your positions here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Market Data Feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Market Data</h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-4">
          <div className="space-y-1 font-mono text-sm">
            {liveMessages.length > 0 ? liveMessages.map((msg, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <span className="text-gray-500 w-16">{msg.timestamp}</span>
                <span className="text-blue-600 w-12">{msg.symbol}</span>
                <span className={`w-12 ${msg.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.side}
                </span>
                <span className="text-gray-900 w-20">${msg.price.toFixed(2)}</span>
                <span className="text-gray-600 w-16">{msg.quantity.toFixed(4)}</span>
                <span className="text-gray-500 flex-1">${msg.usd_size.toFixed(0)}</span>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                <p>Connecting to live data stream...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="btn-primary flex items-center justify-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Portfolio
          </button>
          <button className="btn-secondary">Connect Exchange</button>
          <button className="btn-secondary">View Strategies</button>
          <button className="btn-secondary">Analytics</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;