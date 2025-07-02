import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Modal, Button, Input, Badge, Spinner } from './ui';

const CreatePaperTradingModal = ({ isOpen, onClose, onSessionCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    strategy_id: '',
    symbol: 'BTCUSD',
    initial_capital: 10000,
    data_source: 'binance'
  });
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (isOpen) {
      // Mock strategies data
      const mockStrategies = [
        {
          id: 1,
          name: "SMA Crossover Strategy",
          description: "Simple Moving Average crossover with 20/50 periods",
          strategy_type: "technical",
          risk_level: "medium",
          min_capital: 1000,
          recommended_capital: 5000,
          timeframe: "1h"
        },
        {
          id: 2,
          name: "RSI Mean Reversion",
          description: "RSI-based oversold/overbought strategy",
          strategy_type: "technical",
          risk_level: "low",
          min_capital: 500,
          recommended_capital: 2000,
          timeframe: "15m"
        },
        {
          id: 3,
          name: "Momentum Breakout",
          description: "Price momentum breakout strategy with volume confirmation",
          strategy_type: "momentum",
          risk_level: "high",
          min_capital: 2000,
          recommended_capital: 10000,
          timeframe: "4h"
        },
        {
          id: 4,
          name: "Bollinger Bands Scalping",
          description: "Quick scalping strategy using Bollinger Bands",
          strategy_type: "scalping",
          risk_level: "very_high",
          min_capital: 1000,
          recommended_capital: 3000,
          timeframe: "5m"
        }
      ];
      
      // Simulate API call to load strategies
      setTimeout(() => {
        setStrategies(mockStrategies);
        setLoadingStrategies(false);
      }, 800);
    }
  }, [isOpen]);

  const symbols = [
    { value: 'BTCUSD', label: 'Bitcoin (BTC/USD)' },
    { value: 'ETHUSD', label: 'Ethereum (ETH/USD)' },
    { value: 'ADAUSD', label: 'Cardano (ADA/USD)' },
    { value: 'SOLUSD', label: 'Solana (SOL/USD)' },
    { value: 'DOTUSD', label: 'Polkadot (DOT/USD)' },
    { value: 'MATICUSD', label: 'Polygon (MATIC/USD)' }
  ];

  const dataSources = [
    { value: 'binance', label: 'Binance (Real-time)' },
    { value: 'simulation', label: 'Market Simulation' }
  ];

  const capitalPresets = [
    { value: 1000, label: '$1,000' },
    { value: 5000, label: '$5,000' },
    { value: 10000, label: '$10,000' },
    { value: 25000, label: '$25,000' },
    { value: 50000, label: '$50,000' }
  ];

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-success-400 bg-success-500/20 border-success-500/30';
      case 'medium': return 'text-warning-400 bg-warning-500/20 border-warning-500/30';
      case 'high': return 'text-danger-400 bg-danger-500/20 border-danger-500/30';
      case 'very_high': return 'text-danger-400 bg-danger-600/30 border-danger-600/40';
      default: return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Session name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Session name must be less than 200 characters';
    }

    if (!formData.strategy_id) {
      newErrors.strategy_id = 'Please select a strategy';
    }

    if (!formData.symbol) {
      newErrors.symbol = 'Please select a trading symbol';
    }

    if (!formData.initial_capital || formData.initial_capital <= 0) {
      newErrors.initial_capital = 'Initial capital must be greater than 0';
    } else if (formData.initial_capital > 1000000) {
      newErrors.initial_capital = 'Initial capital cannot exceed $1,000,000';
    }

    // Check minimum capital requirement
    const selectedStrategy = strategies.find(s => s.id === parseInt(formData.strategy_id));
    if (selectedStrategy && formData.initial_capital < selectedStrategy.min_capital) {
      newErrors.initial_capital = `Minimum capital for this strategy is ${formatCurrency(selectedStrategy.min_capital)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectedStrategy = strategies.find(s => s.id === parseInt(formData.strategy_id));
      
      // Create mock session object
      const newSession = {
        id: Date.now(),
        name: formData.name,
        strategy_name: selectedStrategy.name,
        symbol: formData.symbol,
        initial_capital: formData.initial_capital,
        current_capital: formData.initial_capital,
        status: 'active',
        start_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        total_pnl: 0,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        open_positions: 0,
        data_source: formData.data_source,
        current_positions: []
      };

      onSessionCreated(newSession);
      handleClose();
    } catch (error) {
      console.error('Error creating paper trading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      strategy_id: '',
      symbol: 'BTCUSD',
      initial_capital: 10000,
      data_source: 'binance'
    });
    setErrors({});
    setLoadingStrategies(true);
    setStrategies([]);
    onClose();
  };

  const selectedStrategy = strategies.find(s => s.id === parseInt(formData.strategy_id));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="Create Paper Trading Session">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Session Name
          </label>
          <Input
            placeholder="e.g., SMA Strategy Live Test"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            fullWidth
          />
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Trading Strategy
          </label>
          {loadingStrategies ? (
            <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
              <Spinner size="sm" className="mr-2" />
              <span className="text-neutral-400">Loading strategies...</span>
            </div>
          ) : (
            <>
              <select
                value={formData.strategy_id}
                onChange={(e) => setFormData(prev => ({ ...prev, strategy_id: e.target.value }))}
                className={`w-full px-3 py-2 bg-secondary-700 border rounded-lg text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.strategy_id ? 'border-danger-500' : 'border-secondary-600'}`}
              >
                <option value="">Select a strategy</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              
              {/* Strategy Details */}
              {selectedStrategy && (
                <div className="mt-3 p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-100 mb-1">{selectedStrategy.name}</h4>
                      <p className="text-sm text-neutral-400">{selectedStrategy.description}</p>
                    </div>
                    <div className="ml-4">
                      <Badge 
                        variant="outline" 
                        className={getRiskLevelColor(selectedStrategy.risk_level)}
                      >
                        {selectedStrategy.risk_level.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-400">Min Capital:</span>
                      <div className="font-medium text-neutral-100">
                        {formatCurrency(selectedStrategy.min_capital)}
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-400">Recommended:</span>
                      <div className="font-medium text-neutral-100">
                        {formatCurrency(selectedStrategy.recommended_capital)}
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-400">Timeframe:</span>
                      <div className="font-medium text-neutral-100">{selectedStrategy.timeframe}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trading Symbol */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Trading Symbol
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
            className={`w-full px-3 py-2 bg-secondary-700 border rounded-lg text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.symbol ? 'border-danger-500' : 'border-secondary-600'}`}
          >
            {symbols.map((symbol) => (
              <option key={symbol.value} value={symbol.value}>
                {symbol.label}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Capital */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Initial Capital
          </label>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="10000"
              value={formData.initial_capital}
              onChange={(e) => setFormData(prev => ({ ...prev, initial_capital: parseFloat(e.target.value) || 0 }))}
              error={errors.initial_capital}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              fullWidth
            />
            
            {/* Capital Presets */}
            <div>
              <div className="text-xs text-neutral-400 mb-2">Quick select:</div>
              <div className="flex flex-wrap gap-2">
                {capitalPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, initial_capital: preset.value }))}
                    className={formData.initial_capital === preset.value ? 'border-primary-500 text-primary-400' : ''}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Source */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            Market Data Source
          </label>
          <select
            value={formData.data_source}
            onChange={(e) => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
            className="w-full px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {dataSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          <div className="mt-2 p-3 bg-info-500/10 border border-info-500/20 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-info-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-info-300">
                <strong>Binance:</strong> Real-time market data with actual price movements and spreads.<br />
                <strong>Simulation:</strong> Simulated price data for testing without market dependency.
              </div>
            </div>
          </div>
        </div>

        {/* Capital Warning */}
        {selectedStrategy && formData.initial_capital < selectedStrategy.recommended_capital && (
          <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-warning-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-warning-300">
                Your capital is below the recommended amount of {formatCurrency(selectedStrategy.recommended_capital)} for this strategy. 
                Consider increasing your capital for better risk management.
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-600">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || loadingStrategies}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating Session...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Create Session
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePaperTradingModal;