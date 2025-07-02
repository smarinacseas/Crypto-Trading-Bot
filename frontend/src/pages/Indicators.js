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
        labels: {
          color: 'rgb(212, 212, 216)', // neutral-300
        },
      },
      title: {
        display: true,
        text: 'SMA Indicator - BTC/USD',
        color: 'rgb(212, 212, 216)', // neutral-300
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(163, 163, 163)', // neutral-400
        },
        grid: {
          color: 'rgba(163, 163, 163, 0.1)',
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: 'rgb(163, 163, 163)', // neutral-400
        },
        grid: {
          color: 'rgba(163, 163, 163, 0.1)',
        },
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
        return 'bg-success-500/20 text-success-300 border border-success-500/30';
      case 'SELL':
        return 'bg-danger-500/20 text-danger-300 border border-danger-500/30';
      case 'NEUTRAL':
        return 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30';
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
      <div className="card">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Add New Indicator</h3>
        
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Indicator Type
            </label>
            <select
              value={newIndicatorForm.type}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, type: e.target.value})}
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="SMA">Simple Moving Average</option>
              <option value="RSI">RSI</option>
              <option value="MACD">MACD</option>
              <option value="BB">Bollinger Bands</option>
              <option value="STOCH">Stochastic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Symbol
            </label>
            <select
              value={newIndicatorForm.symbol}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, symbol: e.target.value})}
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
              <option value="SOL/USD">SOL/USD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Timeframe
            </label>
            <select
              value={newIndicatorForm.timeframe}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, timeframe: e.target.value})}
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
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
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Period
            </label>
            <input
              type="number"
              value={newIndicatorForm.period}
              onChange={(e) => setNewIndicatorForm({...newIndicatorForm, period: parseInt(e.target.value)})}
              min="1"
              max="200"
              className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
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
      <div className="card">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Active Indicators</h3>
        
        <div className="space-y-4">
          {activeIndicators.map((indicator) => (
            <div key={indicator.id} className="border border-secondary-600 rounded-lg p-4 bg-secondary-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-neutral-100">{indicator.name}</h4>
                  <p className="text-sm text-neutral-400">
                    {indicator.symbol} • {indicator.timeframe} • Period: {indicator.period}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    indicator.status === 'ACTIVE' ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'
                  }`}>
                    {indicator.status}
                  </span>
                  <button
                    onClick={() => runIndicator(indicator.id)}
                    className="p-2 text-primary-400 hover:bg-primary-500/20 rounded"
                  >
                    <PlayIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-neutral-400 hover:bg-neutral-500/20 rounded">
                    <CogIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-neutral-400 hover:bg-neutral-500/20 rounded">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-secondary-600 rounded-lg border border-secondary-500">
                  <p className="text-sm text-neutral-400">Last Value</p>
                  <p className="text-lg font-semibold text-neutral-100">{indicator.lastValue.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-secondary-600 rounded-lg border border-secondary-500">
                  <p className="text-sm text-neutral-400">Signal</p>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getSignalColor(indicator.signal)}`}>
                    {indicator.signal}
                  </span>
                </div>
                <div className="text-center p-3 bg-secondary-600 rounded-lg border border-secondary-500">
                  <p className="text-sm text-neutral-400">Confidence</p>
                  <p className="text-lg font-semibold text-neutral-100">{indicator.confidence}%</p>
                </div>
                <div className="text-center p-3 bg-secondary-600 rounded-lg border border-secondary-500">
                  <p className="text-sm text-neutral-400">Last Update</p>
                  <p className="text-sm text-neutral-300">2 min ago</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMA Chart Visualization */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">SMA Indicator Visualization</h3>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-neutral-300">Live Chart</span>
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
              <p className="text-sm font-medium text-neutral-400">Active Indicators</p>
              <p className="text-2xl font-bold text-neutral-100">
                {activeIndicators.filter(i => i.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-success-500/20 rounded-lg border border-success-500/30">
              <ChartBarIcon className="w-6 h-6 text-success-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">Buy Signals</p>
              <p className="text-2xl font-bold text-neutral-100">
                {activeIndicators.filter(i => i.signal === 'BUY').length}
              </p>
            </div>
            <div className="p-3 bg-success-500/20 rounded-lg border border-success-500/30">
              <PlayIcon className="w-6 h-6 text-success-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-neutral-100">
                {Math.round(activeIndicators.reduce((sum, i) => sum + i.confidence, 0) / activeIndicators.length)}%
              </p>
            </div>
            <div className="p-3 bg-primary-600/20 rounded-lg border border-primary-600/30">
              <CogIcon className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Indicators;