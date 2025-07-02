import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Tabs, Spinner } from '../components/ui';
import BacktestDetailModal from '../components/BacktestDetailModal';
import CreateBacktestModal from '../components/CreateBacktestModal';

const Backtesting = () => {
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBacktest, setSelectedBacktest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Mock data for demonstration
  const mockBacktests = [
    {
      id: 1,
      name: "SMA Crossover Test - BTC 4H",
      strategy_name: "SMA Crossover Strategy",
      symbol: "BTCUSD",
      timeframe: "4h",
      start_date: "2024-01-01T00:00:00Z",
      end_date: "2024-06-01T00:00:00Z",
      initial_capital: 10000,
      status: "completed",
      progress_pct: 100,
      created_at: "2024-06-15T10:30:00Z",
      completed_at: "2024-06-15T10:35:00Z",
      results: {
        total_return: 23.5,
        max_drawdown: 12.3,
        sharpe_ratio: 1.8,
        total_trades: 45,
        win_rate: 67.8,
        final_capital: 12350
      }
    },
    {
      id: 2,
      name: "RSI Mean Reversion - ETH 1H",
      strategy_name: "RSI Mean Reversion",
      symbol: "ETHUSD",
      timeframe: "1h",
      start_date: "2024-03-01T00:00:00Z",
      end_date: "2024-05-01T00:00:00Z",
      initial_capital: 5000,
      status: "running",
      progress_pct: 67.5,
      created_at: "2024-06-15T11:00:00Z",
      results: null
    },
    {
      id: 3,
      name: "Momentum Breakout - Multiple Assets",
      strategy_name: "Momentum Breakout",
      symbol: "BTCUSD",
      timeframe: "15m",
      start_date: "2024-05-01T00:00:00Z",
      end_date: "2024-06-01T00:00:00Z",
      initial_capital: 20000,
      status: "failed",
      progress_pct: 0,
      created_at: "2024-06-15T09:15:00Z",
      error_message: "Insufficient market data for the selected period",
      results: null
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBacktests(mockBacktests);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success-400 bg-success-500/20 border-success-500/30';
      case 'running': return 'text-info-400 bg-info-500/20 border-info-500/30';
      case 'failed': return 'text-danger-400 bg-danger-500/20 border-danger-500/30';
      case 'pending': return 'text-warning-400 bg-warning-500/20 border-warning-500/30';
      default: return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'running': return <Spinner size="sm" />;
      case 'failed': return <XCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewBacktest = (backtest) => {
    setSelectedBacktest(backtest);
    setShowDetailModal(true);
  };

  const handleDeleteBacktest = (backtestId) => {
    setBacktests(prev => prev.filter(b => b.id !== backtestId));
  };

  const BacktestCard = ({ backtest }) => (
    <Card hover className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-100 mb-1">{backtest.name}</h3>
            <p className="text-sm text-neutral-400">{backtest.strategy_name}</p>
          </div>
          <div className={`flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(backtest.status)}`}>
            {getStatusIcon(backtest.status)}
            <span className="ml-1 capitalize">{backtest.status}</span>
          </div>
        </div>

        {/* Trading Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-sm font-medium text-neutral-100">{backtest.symbol}</div>
            <div className="text-xs text-neutral-400">{backtest.timeframe}</div>
          </div>
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-sm font-medium text-neutral-100">{formatCurrency(backtest.initial_capital)}</div>
            <div className="text-xs text-neutral-400">Capital</div>
          </div>
        </div>

        {/* Period */}
        <div className="mb-4">
          <div className="text-xs text-neutral-400 mb-1">Period</div>
          <div className="text-sm text-neutral-300">
            {formatDate(backtest.start_date)} - {formatDate(backtest.end_date)}
          </div>
        </div>

        {/* Progress (for running backtests) */}
        {backtest.status === 'running' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Progress</span>
              <span>{backtest.progress_pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary-600 rounded-full h-2">
              <div 
                className="bg-info-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${backtest.progress_pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Results (for completed backtests) */}
        {backtest.status === 'completed' && backtest.results && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
              <div className={`text-lg font-bold ${backtest.results.total_return >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                {backtest.results.total_return >= 0 ? '+' : ''}{backtest.results.total_return}%
              </div>
              <div className="text-xs text-neutral-400">Return</div>
            </div>
            <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
              <div className="text-lg font-bold text-neutral-100">{backtest.results.win_rate}%</div>
              <div className="text-xs text-neutral-400">Win Rate</div>
            </div>
          </div>
        )}

        {/* Error (for failed backtests) */}
        {backtest.status === 'failed' && backtest.error_message && (
          <div className="mb-4 p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-4 w-4 text-danger-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-danger-300">{backtest.error_message}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 mt-auto">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => handleViewBacktest(backtest)}
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Button>
          {backtest.status === 'running' && (
            <Button variant="outline" size="sm">
              <StopIcon className="h-4 w-4" />
            </Button>
          )}
          {(backtest.status === 'failed' || backtest.status === 'completed') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeleteBacktest(backtest.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Created Date */}
        <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-secondary-600">
          Created {formatDate(backtest.created_at)}
        </div>
      </div>
    </Card>
  );

  const filteredBacktests = backtests.filter(backtest => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        backtest.name.toLowerCase().includes(searchLower) ||
        backtest.strategy_name.toLowerCase().includes(searchLower) ||
        backtest.symbol.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const tabs = [
    {
      id: 'all',
      label: 'All Backtests',
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                placeholder="Search backtests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Backtest
              </Button>
            </div>
          </div>

          {/* Backtests Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-96">
                  <Spinner.Overlay show={true}>
                    <div className="h-full" />
                  </Spinner.Overlay>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBacktests.map((backtest) => (
                <BacktestCard key={backtest.id} backtest={backtest} />
              ))}
            </div>
          )}

          {filteredBacktests.length === 0 && !loading && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No backtests found</h3>
              <p className="text-neutral-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first backtest to get started'}
              </p>
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Backtest
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'running',
      label: 'Running',
      icon: <PlayIcon className="h-4 w-4" />,
      badge: backtests.filter(b => b.status === 'running').length.toString(),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backtests
              .filter(b => b.status === 'running')
              .map(backtest => (
                <BacktestCard key={backtest.id} backtest={backtest} />
              ))
            }
          </div>
          {backtests.filter(b => b.status === 'running').length === 0 && (
            <div className="text-center py-12">
              <PlayIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No running backtests</h3>
              <p className="text-neutral-400">All backtests have completed or are in other states</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircleIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backtests
              .filter(b => b.status === 'completed')
              .map(backtest => (
                <BacktestCard key={backtest.id} backtest={backtest} />
              ))
            }
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Backtesting</h1>
          <p className="text-neutral-400 mt-1">Test and validate your trading strategies with historical data</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Backtest
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">{backtests.length}</div>
            <div className="text-sm text-neutral-400">Total Backtests</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-info-400">{backtests.filter(b => b.status === 'running').length}</div>
            <div className="text-sm text-neutral-400">Running</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-success-400">{backtests.filter(b => b.status === 'completed').length}</div>
            <div className="text-sm text-neutral-400">Completed</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">
              {backtests.filter(b => b.status === 'completed' && b.results).length > 0
                ? (backtests
                    .filter(b => b.status === 'completed' && b.results)
                    .reduce((sum, b) => sum + b.results.total_return, 0) / 
                   backtests.filter(b => b.status === 'completed' && b.results).length
                  ).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="text-sm text-neutral-400">Avg Return</div>
          </div>
        </Card>
      </div>

      {/* Backtests Tabs */}
      <Tabs 
        tabs={tabs}
        defaultTab={0}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Modals */}
      <BacktestDetailModal
        backtest={selectedBacktest}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <CreateBacktestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBacktestCreated={(newBacktest) => {
          setBacktests(prev => [newBacktest, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default Backtesting;