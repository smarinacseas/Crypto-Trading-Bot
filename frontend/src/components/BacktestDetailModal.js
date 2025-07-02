import React from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  PlayIcon,
  StopIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { Modal, Button, Badge, Tabs } from './ui';
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
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BacktestDetailModal = ({ backtest, isOpen, onClose }) => {

  if (!backtest) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock equity curve data
  const generateEquityCurve = () => {
    const points = 100;
    const data = [];
    let equity = backtest.initial_capital;
    
    for (let i = 0; i <= points; i++) {
      // Simulate equity curve
      const randomChange = (Math.random() - 0.48) * 0.02; // Slight positive bias
      equity = equity * (1 + randomChange);
      data.push({
        x: i,
        y: equity
      });
    }
    return data;
  };

  const equityCurveData = {
    labels: Array.from({ length: 101 }, (_, i) => i),
    datasets: [
      {
        label: 'Portfolio Value',
        data: generateEquityCurve(),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(23, 41, 59, 0.95)',
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)'
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Mock trades data
  const mockTrades = [
    {
      id: 1,
      side: 'long',
      entry_price: 45250,
      exit_price: 47100,
      quantity: 0.22,
      entry_time: '2024-05-15T10:30:00Z',
      exit_time: '2024-05-15T14:45:00Z',
      pnl: 407,
      pnl_pct: 4.1,
      fees: 20.15
    },
    {
      id: 2,
      side: 'short',
      entry_price: 46800,
      exit_price: 45900,
      quantity: 0.21,
      entry_time: '2024-05-16T09:15:00Z',
      exit_time: '2024-05-16T16:20:00Z',
      pnl: 189,
      pnl_pct: 1.9,
      fees: 19.60
    }
  ];

  const performanceMetrics = backtest.results ? [
    { label: 'Total Return', value: formatPercentage(backtest.results.total_return), positive: backtest.results.total_return > 0 },
    { label: 'Sharpe Ratio', value: backtest.results.sharpe_ratio?.toFixed(2) || 'N/A', positive: (backtest.results.sharpe_ratio || 0) > 1 },
    { label: 'Max Drawdown', value: formatPercentage(-Math.abs(backtest.results.max_drawdown)), positive: false },
    { label: 'Win Rate', value: `${backtest.results.win_rate}%`, positive: backtest.results.win_rate > 50 },
    { label: 'Total Trades', value: backtest.results.total_trades, neutral: true },
    { label: 'Final Capital', value: formatCurrency(backtest.results.final_capital), positive: backtest.results.final_capital > backtest.initial_capital }
  ] : [];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Strategy</div>
                <div className="font-medium text-neutral-100">{backtest.strategy_name}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Symbol</div>
                <div className="font-medium text-neutral-100">{backtest.symbol}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Timeframe</div>
                <div className="font-medium text-neutral-100">{backtest.timeframe}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Initial Capital</div>
                <div className="font-medium text-neutral-100">{formatCurrency(backtest.initial_capital)}</div>
              </div>
            </div>
          </div>

          {/* Time Period */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Time Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-400">Start Date</span>
                </div>
                <div className="font-medium text-neutral-100">{formatDate(backtest.start_date)}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-400">End Date</span>
                </div>
                <div className="font-medium text-neutral-100">{formatDate(backtest.end_date)}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-400">Duration</span>
                </div>
                <div className="font-medium text-neutral-100">
                  {Math.ceil((new Date(backtest.end_date) - new Date(backtest.start_date)) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Status</h3>
            <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge 
                    variant={
                      backtest.status === 'completed' ? 'success' :
                      backtest.status === 'running' ? 'info' :
                      backtest.status === 'failed' ? 'danger' : 'warning'
                    }
                    className="mr-3"
                  >
                    {backtest.status.toUpperCase()}
                  </Badge>
                  <span className="text-neutral-100 capitalize">{backtest.status}</span>
                </div>
                {backtest.status === 'running' && (
                  <div className="text-right">
                    <div className="text-sm text-neutral-400">Progress</div>
                    <div className="font-medium text-neutral-100">{backtest.progress_pct.toFixed(1)}%</div>
                  </div>
                )}
              </div>
              {backtest.status === 'running' && (
                <div className="mt-3">
                  <div className="w-full bg-secondary-600 rounded-full h-2">
                    <div 
                      className="bg-info-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${backtest.progress_pct}%` }}
                    />
                  </div>
                </div>
              )}
              {backtest.status === 'failed' && backtest.error_message && (
                <div className="mt-3 p-3 bg-danger-500/10 border border-danger-500/30 rounded">
                  <p className="text-sm text-danger-300">{backtest.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'performance',
      label: 'Performance',
      content: (
        <div className="space-y-6">
          {backtest.status === 'completed' && backtest.results ? (
            <>
              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.label} className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                      <div className={`text-2xl font-bold ${
                        metric.neutral ? 'text-neutral-100' :
                        metric.positive ? 'text-success-400' : 'text-danger-400'
                      }`}>
                        {metric.value}
                      </div>
                      <div className="text-sm text-neutral-400 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Curve */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Equity Curve</h3>
                <div className="bg-secondary-700 rounded-lg border border-secondary-600 p-4">
                  <div className="h-64">
                    <Line data={equityCurveData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">
                {backtest.status === 'running' ? 'Backtest In Progress' : 'No Performance Data'}
              </h3>
              <p className="text-neutral-400">
                {backtest.status === 'running' 
                  ? 'Performance metrics will be available once the backtest completes'
                  : 'Performance data is only available for completed backtests'
                }
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'trades',
      label: 'Trades',
      badge: backtest.results?.total_trades || 0,
      content: (
        <div className="space-y-6">
          {backtest.status === 'completed' ? (
            <>
              {/* Trade Summary */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Trade Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-neutral-100">{backtest.results?.total_trades || 0}</div>
                    <div className="text-sm text-neutral-400">Total Trades</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-success-400">
                      {Math.round((backtest.results?.total_trades || 0) * (backtest.results?.win_rate || 0) / 100)}
                    </div>
                    <div className="text-sm text-neutral-400">Winning</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-danger-400">
                      {(backtest.results?.total_trades || 0) - Math.round((backtest.results?.total_trades || 0) * (backtest.results?.win_rate || 0) / 100)}
                    </div>
                    <div className="text-sm text-neutral-400">Losing</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-neutral-100">{backtest.results?.win_rate || 0}%</div>
                    <div className="text-sm text-neutral-400">Win Rate</div>
                  </div>
                </div>
              </div>

              {/* Recent Trades Table */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Recent Trades</h3>
                <div className="bg-secondary-700 rounded-lg border border-secondary-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Side</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Entry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Exit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">P&L</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-600">
                        {mockTrades.map((trade) => (
                          <tr key={trade.id} className="hover:bg-secondary-600/50">
                            <td className="px-4 py-3">
                              <Badge variant={trade.side === 'long' ? 'success' : 'danger'} size="sm">
                                {trade.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-100">
                              ${trade.entry_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-100">
                              ${trade.exit_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-100">
                              {trade.quantity} BTC
                            </td>
                            <td className="px-4 py-3">
                              <div className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                                {formatCurrency(trade.pnl)} ({formatPercentage(trade.pnl_pct)})
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-400">
                              {Math.round((new Date(trade.exit_time) - new Date(trade.entry_time)) / (1000 * 60 * 60))}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <TableCellsIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No Trade Data</h3>
              <p className="text-neutral-400">
                Trade data is only available for completed backtests
              </p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">{backtest.name}</h2>
            <p className="text-neutral-400 mb-4">{backtest.strategy_name}</p>
          </div>
          
          <div className="flex space-x-2 ml-4">
            {backtest.status === 'running' && (
              <Button variant="outline" size="sm">
                <StopIcon className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            {(backtest.status === 'failed' || backtest.status === 'completed') && (
              <Button variant="outline" size="sm">
                <PlayIcon className="h-4 w-4 mr-2" />
                Restart
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab={0} />
      </div>
    </Modal>
  );
};

export default BacktestDetailModal;