import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';

function Indicators() {
  const [activeIndicators, setActiveIndicators] = useState([
    {
      id: 1,
      name: 'Simple Moving Average (SMA)',
      symbol: 'BTC/USD',
      timeframe: '6h',
      period: 20,
      status: 'ACTIVE',
      lastValue: 43250.45,
      signal: 'BUY',
      confidence: 78,
    },
    {
      id: 2,
      name: 'Relative Strength Index (RSI)',
      symbol: 'BTC/USD',
      timeframe: '1h',
      period: 14,
      status: 'ACTIVE',
      lastValue: 65.2,
      signal: 'NEUTRAL',
      confidence: 45,
    },
    {
      id: 3,
      name: 'MACD',
      symbol: 'ETH/USD',
      timeframe: '4h',
      period: 12,
      status: 'INACTIVE',
      lastValue: -15.67,
      signal: 'SELL',
      confidence: 82,
    },
  ]);

  const [smaData, setSmaData] = useState({
    labels: [],
    datasets: [
      {
        label: 'BTC Price',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'SMA 20',
        data: [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
    ],
  });

  const [newIndicatorForm, setNewIndicatorForm] = useState({
    type: 'SMA',
    symbol: 'BTC/USD',
    timeframe: '6h',
    period: 20,
  });

  useEffect(() => {
    // Simulate SMA data updates
    const interval = setInterval(() => {
      const now = new Date();
      const price = 43000 + Math.random() * 1000;
      const sma = price * (0.98 + Math.random() * 0.04); // Simulate SMA close to price

      setSmaData(prev => ({
        ...prev,
        labels: [...prev.labels.slice(-19), now.toLocaleTimeString()],
        datasets: [
          {
            ...prev.datasets[0],
            data: [...prev.datasets[0].data.slice(-19), price],
          },
          {
            ...prev.datasets[1],
            data: [...prev.datasets[1].data.slice(-19), sma],
          },
        ],
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'SMA Indicator - BTC/USD',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newIndicator = {
      id: Date.now(),
      name: getIndicatorName(newIndicatorForm.type),
      symbol: newIndicatorForm.symbol,
      timeframe: newIndicatorForm.timeframe,
      period: newIndicatorForm.period,
      status: 'ACTIVE',
      lastValue: 0,
      signal: 'NEUTRAL',
      confidence: 0,
    };
    setActiveIndicators([...activeIndicators, newIndicator]);
    setNewIndicatorForm({
      type: 'SMA',
      symbol: 'BTC/USD',
      timeframe: '6h',
      period: 20,
    });
  };

  const getIndicatorName = (type) => {
    const names = {
      SMA: 'Simple Moving Average (SMA)',
      RSI: 'Relative Strength Index (RSI)',
      MACD: 'MACD',
      BB: 'Bollinger Bands',
      STOCH: 'Stochastic Oscillator',
    };
    return names[type] || type;
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'NEUTRAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const runIndicator = async (indicatorId) => {
    // Simulate API call to run indicator
    console.log(`Running indicator ${indicatorId}`);
    // Update the indicator status or trigger calculation
  };

  return (
    <div className="space-y-6">
      {/* Add New Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Indicator</h3>
        
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indicator Type
            </label>
            <select
              value={newIndicatorForm.type}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="SMA">Simple Moving Average</option>
              <option value="RSI">RSI</option>
              <option value="MACD">MACD</option>
              <option value="BB">Bollinger Bands</option>
              <option value="STOCH">Stochastic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <select
              value={newIndicatorForm.symbol}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, symbol: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
              <option value="SOL/USD">SOL/USD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              value={newIndicatorForm.timeframe}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, timeframe: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="6h">6 Hours</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <input
              type="number"
              value={newIndicatorForm.period}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, period: parseInt(e.target.value)})}
              min="1"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full btn-primary"
            >
              Add Indicator
            </button>
          </div>
        </form>
      </div>

      {/* Active Indicators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Active Indicators</h3>
        
        <div className="space-y-4">
          {activeIndicators.map((indicator) => (
            <div key={indicator.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{indicator.name}</h4>
                  <p className="text-sm text-gray-600">
                    {indicator.symbol} • {indicator.timeframe} • Period: {indicator.period}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    indicator.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {indicator.status}
                  </span>
                  <button
                    onClick={() => runIndicator(indicator.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PlayIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <CogIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Value</p>
                  <p className="text-lg font-semibold">{indicator.lastValue.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Signal</p>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getSignalColor(indicator.signal)}`}>
                    {indicator.signal}
                  </span>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-lg font-semibold">{indicator.confidence}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Update</p>
                  <p className="text-sm">2 min ago</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMA Chart Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">SMA Indicator Visualization</h3>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600">Live Chart</span>
          </div>
        </div>
        
        <div className="h-80">
          <Line data={smaData} options={chartOptions} />
        </div>
      </div>

      {/* Indicator Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Indicators</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeIndicators.filter(i => i.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Buy Signals</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeIndicators.filter(i => i.signal === 'BUY').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <PlayIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(activeIndicators.reduce((sum, i) => sum + i.confidence, 0) / activeIndicators.length)}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CogIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Indicators;