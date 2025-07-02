import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Modal, Button, Input } from './ui';

const CreateBacktestModal = ({ isOpen, onClose, onBacktestCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy_id: '',
    symbol: 'BTCUSD',
    timeframe: '4h',
    start_date: '',
    end_date: '',
    initial_capital: 10000,
    max_position_size: 25,
    stop_loss_pct: '',
    take_profit_pct: '',
    commission: 0.1,
    slippage: 0.1
  });

  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Mock strategies data
      const mockStrategies = [
        { id: 1, name: 'SMA Crossover Strategy', risk_level: 'medium' },
        { id: 2, name: 'RSI Mean Reversion', risk_level: 'medium' },
        { id: 3, name: 'Momentum Breakout', risk_level: 'high' },
        { id: 4, name: 'Grid Trading Bot', risk_level: 'low' },
        { id: 5, name: 'DCA Dollar Cost Average', risk_level: 'low' }
      ];
      
      setStrategies(mockStrategies);
      // Set default dates (last 6 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      setFormData(prev => ({
        ...prev,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const timeframes = [
    { value: '1m', label: '1 minute' },
    { value: '5m', label: '5 minutes' },
    { value: '15m', label: '15 minutes' },
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '4h', label: '4 hours' },
    { value: '12h', label: '12 hours' },
    { value: '1d', label: '1 day' },
    { value: '1w', label: '1 week' }
  ];

  const symbols = [
    'BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'LINKUSD', 'MATICUSD', 'AVAXUSD'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Backtest name is required';
    }

    if (!formData.strategy_id) {
      newErrors.strategy_id = 'Please select a strategy';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.initial_capital < 100) {
      newErrors.initial_capital = 'Minimum capital is $100';
    }

    if (formData.max_position_size < 1 || formData.max_position_size > 100) {
      newErrors.max_position_size = 'Position size must be between 1% and 100%';
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
      
      const newBacktest = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        strategy_name: selectedStrategy?.name || 'Unknown Strategy',
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        start_date: formData.start_date + 'T00:00:00Z',
        end_date: formData.end_date + 'T23:59:59Z',
        initial_capital: parseFloat(formData.initial_capital),
        status: 'running',
        progress_pct: 0,
        created_at: new Date().toISOString(),
        results: null
      };

      onBacktestCreated(newBacktest);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        strategy_id: '',
        symbol: 'BTCUSD',
        timeframe: '4h',
        start_date: '',
        end_date: '',
        initial_capital: 10000,
        max_position_size: 25,
        stop_loss_pct: '',
        take_profit_pct: '',
        commission: 0.1,
        slippage: 0.1
      });
      setErrors({});

    } catch (error) {
      console.error('Error creating backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const getDurationText = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        return `${Math.floor(diffDays / 30)} months`;
      } else {
        return `${Math.floor(diffDays / 365)} years`;
      }
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Create New Backtest">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-100 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Backtest Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., SMA Crossover - BTC 4H Test"
              error={errors.name}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description of this backtest..."
              rows="3"
              className="w-full p-3 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Strategy *
            </label>
            <select
              name="strategy_id"
              value={formData.strategy_id}
              onChange={handleInputChange}
              className={`w-full p-3 bg-secondary-700 border rounded-lg text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.strategy_id ? 'border-danger-500' : 'border-secondary-600'
              }`}
            >
              <option value="">Select a strategy</option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name} ({strategy.risk_level} risk)
                </option>
              ))}
            </select>
            {errors.strategy_id && (
              <p className="mt-1 text-sm text-danger-400">{errors.strategy_id}</p>
            )}
          </div>
        </div>

        {/* Market Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-100 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Market Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Symbol
              </label>
              <select
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="w-full p-3 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Timeframe
              </label>
              <select
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
                className="w-full p-3 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Time Period */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-100 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Time Period
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                error={errors.start_date}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                End Date *
              </label>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                error={errors.end_date}
                fullWidth
              />
            </div>
          </div>

          {getDurationText() && (
            <div className="flex items-center text-sm text-neutral-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              Duration: {getDurationText()}
            </div>
          )}
        </div>

        {/* Capital & Risk Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-100 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Capital & Risk Management
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Initial Capital ($) *
              </label>
              <Input
                type="number"
                name="initial_capital"
                value={formData.initial_capital}
                onChange={handleInputChange}
                min="100"
                step="100"
                error={errors.initial_capital}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Max Position Size (%)
              </label>
              <Input
                type="number"
                name="max_position_size"
                value={formData.max_position_size}
                onChange={handleInputChange}
                min="1"
                max="100"
                step="1"
                error={errors.max_position_size}
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Stop Loss (%) <span className="text-neutral-500">Optional</span>
              </label>
              <Input
                type="number"
                name="stop_loss_pct"
                value={formData.stop_loss_pct}
                onChange={handleInputChange}
                min="0.1"
                max="50"
                step="0.1"
                placeholder="e.g., 5"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Take Profit (%) <span className="text-neutral-500">Optional</span>
              </label>
              <Input
                type="number"
                name="take_profit_pct"
                value={formData.take_profit_pct}
                onChange={handleInputChange}
                min="0.1"
                max="100"
                step="0.1"
                placeholder="e.g., 10"
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Commission (%)
              </label>
              <Input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Slippage (%)
              </label>
              <Input
                type="number"
                name="slippage"
                value={formData.slippage}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.01"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-info-500/10 border border-info-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-info-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-info-300">
              <p className="font-medium mb-1">Backtest Execution</p>
              <p>
                Your backtest will run in the background and may take several minutes to complete depending on the time period and timeframe selected. 
                You'll be able to monitor progress and view results once it's finished.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-600">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            loading={loading}
          >
            {loading ? 'Creating Backtest...' : 'Start Backtest'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBacktestModal;