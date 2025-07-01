import React, { useState } from 'react';
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

function Trading() {
  const [activeTab, setActiveTab] = useState('manual');
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTC/USD',
    side: 'BUY',
    type: 'MARKET',
    quantity: '',
    price: '',
  });

  const [positions] = useState([
    {
      id: 1,
      symbol: 'BTC/USD',
      side: 'LONG',
      size: '0.5',
      entryPrice: '43,200',
      currentPrice: '43,450',
      pnl: '+125.00',
      pnlPercent: '+0.58%',
      status: 'OPEN',
    },
    {
      id: 2,
      symbol: 'ETH/USD',
      side: 'SHORT',
      size: '2.0',
      entryPrice: '2,680',
      currentPrice: '2,650',
      pnl: '+60.00',
      pnlPercent: '+1.12%',
      status: 'OPEN',
    },
  ]);

  const [botStrategies, setBotStrategies] = useState([
    {
      id: 1,
      name: 'SMA Crossover',
      symbol: 'BTC/USD',
      status: 'RUNNING',
      pnl: '+$1,250.50',
      trades: 23,
      winRate: '78.3%',
      lastSignal: 'BUY at 43,100',
    },
    {
      id: 2,
      name: 'RSI Divergence',
      symbol: 'ETH/USD',
      status: 'PAUSED',
      pnl: '-$45.20',
      trades: 8,
      winRate: '62.5%',
      lastSignal: 'SELL at 2,680',
    },
  ]);

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    console.log('Order submitted:', orderForm);
    // Add API call here
  };

  const handleInputChange = (e) => {
    setOrderForm({
      ...orderForm,
      [e.target.name]: e.target.value,
    });
  };

  const toggleBotStrategy = (strategyId, action) => {
    setBotStrategies(strategies =>
      strategies.map(strategy =>
        strategy.id === strategyId
          ? { ...strategy, status: action }
          : strategy
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'manual', name: 'Manual Trading' },
              { id: 'automated', name: 'Automated Strategies' },
              { id: 'positions', name: 'Open Positions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Manual Trading Tab */}
          {activeTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Form */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Place Order</h3>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Symbol
                      </label>
                      <select
                        name="symbol"
                        value={orderForm.symbol}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="BTC/USD">BTC/USD</option>
                        <option value="ETH/USD">ETH/USD</option>
                        <option value="SOL/USD">SOL/USD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Side
                      </label>
                      <select
                        name="side"
                        value={orderForm.side}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Type
                      </label>
                      <select
                        name="type"
                        value={orderForm.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="MARKET">MARKET</option>
                        <option value="LIMIT">LIMIT</option>
                        <option value="STOP">STOP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={orderForm.quantity}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {orderForm.type !== 'MARKET' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={orderForm.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      orderForm.side === 'BUY'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {orderForm.side} {orderForm.symbol}
                  </button>
                </form>
              </div>

              {/* Account Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Account Balance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">USD Balance</span>
                    <span className="text-lg font-bold">$12,345.67</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">BTC Balance</span>
                    <span className="text-lg font-bold">0.285 BTC</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">ETH Balance</span>
                    <span className="text-lg font-bold">4.67 ETH</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automated Strategies Tab */}
          {activeTab === 'automated' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Trading Strategies</h3>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Strategy
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {botStrategies.map((strategy) => (
                  <div key={strategy.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{strategy.name}</h4>
                        <p className="text-sm text-gray-600">{strategy.symbol}</p>
                      </div>
                      <div className="flex space-x-2">
                        {strategy.status === 'RUNNING' ? (
                          <button
                            onClick={() => toggleBotStrategy(strategy.id, 'PAUSED')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                          >
                            <PauseIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleBotStrategy(strategy.id, 'RUNNING')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <StopIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                          <CogIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">P&L</p>
                        <p className={`font-semibold ${strategy.pnl.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {strategy.pnl}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Win Rate</p>
                        <p className="font-semibold">{strategy.winRate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Trades</p>
                        <p className="font-semibold">{strategy.trades}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          strategy.status === 'RUNNING' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {strategy.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Last Signal: {strategy.lastSignal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Open Positions</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Symbol</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Side</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Entry Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Current Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">P&L</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{position.symbol}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            position.side === 'LONG' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {position.side}
                          </span>
                        </td>
                        <td className="py-3 px-4">{position.size}</td>
                        <td className="py-3 px-4">${position.entryPrice}</td>
                        <td className="py-3 px-4">${position.currentPrice}</td>
                        <td className="py-3 px-4">
                          <div className={`${position.pnl.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="font-semibold">{position.pnl}</div>
                            <div className="text-sm">{position.pnlPercent}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Trading;