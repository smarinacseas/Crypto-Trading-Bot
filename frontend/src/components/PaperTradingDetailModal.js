import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarIcon,
  BoltIcon,
  TableCellsIcon,
  BellIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';
import { Modal, Card, Button, Badge, Tabs } from './ui';
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

const PaperTradingDetailModal = ({ session, isOpen, onClose }) => {
  const [realTimeData, setRealTimeData] = useState({
    currentPrice: 68200,
    priceChange: 450,
    priceChangePct: 0.66
  });

  if (!session) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPnL = (pnl) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${formatCurrency(pnl)}`;
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

  const calculateReturnPct = (current, initial) => {
    return (((current - initial) / initial) * 100).toFixed(2);
  };

  const calculateWinRate = (winning, total) => {
    return total > 0 ? ((winning / total) * 100).toFixed(1) : '0.0';
  };

  // Generate mock equity curve data
  const generateEquityCurve = () => {
    const points = 50;
    const data = [];
    let equity = session.initial_capital;
    
    for (let i = 0; i <= points; i++) {
      // Simulate equity progression
      const randomChange = (Math.random() - 0.48) * 0.02;
      equity = equity * (1 + randomChange);
      data.push({
        x: i,
        y: equity
      });
    }
    return data;
  };

  const equityCurveData = {
    labels: Array.from({ length: 51 }, (_, i) => i),
    datasets: [
      {
        label: 'Portfolio Value',
        data: generateEquityCurve(),
        borderColor: session.total_pnl >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: session.total_pnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
    }
  };

  // Mock trades data
  const mockTrades = [
    {
      id: 1,
      side: 'long',
      entry_price: 67200,
      exit_price: 67800,
      quantity: 0.15,
      entry_time: '2024-06-15T09:30:00Z',
      exit_time: '2024-06-15T11:15:00Z',
      pnl: 90,
      pnl_pct: 0.89,
      fees: 6.78,
      exit_reason: 'take_profit'
    },
    {
      id: 2,
      side: 'short',
      entry_price: 68500,
      exit_price: 68200,
      quantity: 0.12,
      entry_time: '2024-06-15T12:00:00Z',
      exit_time: '2024-06-15T13:45:00Z',
      pnl: 36,
      pnl_pct: 0.44,
      fees: 8.22,
      exit_reason: 'signal'
    }
  ];

  // Mock recent alerts
  const mockAlerts = [
    {
      id: 1,
      type: 'trade_opened',
      title: 'Position Opened',
      message: 'Long position opened: 0.18 BTC at $67,500',
      severity: 'info',
      timestamp: '2024-06-15T14:20:00Z',
      is_read: false
    },
    {
      id: 2,
      type: 'trade_closed',
      title: 'Position Closed',
      message: 'Short position closed with +$36 profit',
      severity: 'success',
      timestamp: '2024-06-15T13:45:00Z',
      is_read: true
    },
    {
      id: 3,
      type: 'stop_loss',
      title: 'Stop Loss Triggered',
      message: 'Position closed due to stop loss: -$25',
      severity: 'warning',
      timestamp: '2024-06-15T10:30:00Z',
      is_read: true
    }
  ];

  const performanceMetrics = [
    { label: 'Total Return', value: formatPnL(session.total_pnl), positive: session.total_pnl > 0 },
    { label: 'Return %', value: `${session.total_pnl >= 0 ? '+' : ''}${calculateReturnPct(session.current_capital, session.initial_capital)}%`, positive: session.total_pnl > 0 },
    { label: 'Current Capital', value: formatCurrency(session.current_capital), neutral: true },
    { label: 'Total Trades', value: session.total_trades, neutral: true },
    { label: 'Win Rate', value: `${calculateWinRate(session.winning_trades, session.total_trades)}%`, positive: parseFloat(calculateWinRate(session.winning_trades, session.total_trades)) > 50 },
    { label: 'Open Positions', value: session.open_positions, neutral: true }
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Session Info */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Session Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Strategy</div>
                <div className="font-medium text-neutral-100">{session.strategy_name}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Symbol</div>
                <div className="font-medium text-neutral-100">{session.symbol}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Data Source</div>
                <div className="font-medium text-neutral-100 capitalize">{session.data_source}</div>
              </div>
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="text-sm text-neutral-400 mb-1">Status</div>
                <Badge 
                  variant={
                    session.status === 'active' ? 'success' :
                    session.status === 'paused' ? 'warning' : 'neutral'
                  }
                >
                  {session.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Real-time Market Data */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Market Data</h3>
            <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-neutral-400">{session.symbol} Price</div>
                  <div className="text-2xl font-bold text-neutral-100">
                    ${realTimeData.currentPrice.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${realTimeData.priceChange >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {realTimeData.priceChange >= 0 ? '+' : ''}${realTimeData.priceChange}
                  </div>
                  <div className={`text-sm ${realTimeData.priceChangePct >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {realTimeData.priceChangePct >= 0 ? '+' : ''}{realTimeData.priceChangePct}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Positions */}
          {session.current_positions && session.current_positions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-100 mb-4">Current Positions</h3>
              <div className="space-y-3">
                {session.current_positions.map((position, idx) => (
                  <div key={idx} className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={position.side === 'long' ? 'success' : 'danger'}>
                          {position.side.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium text-neutral-100">{position.quantity} {position.symbol}</div>
                          <div className="text-sm text-neutral-400">Entry: ${position.entry_price.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${position.unrealized_pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                          {formatPnL(position.unrealized_pnl)}
                        </div>
                        <div className={`text-sm ${position.unrealized_pnl_pct >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                          {position.unrealized_pnl_pct >= 0 ? '+' : ''}{position.unrealized_pnl_pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Timing */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Timing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-400">Started</span>
                </div>
                <div className="font-medium text-neutral-100">{formatDate(session.start_time)}</div>
              </div>
              {session.end_time && (
                <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="text-sm text-neutral-400">Ended</span>
                  </div>
                  <div className="font-medium text-neutral-100">{formatDate(session.end_time)}</div>
                </div>
              )}
              <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-400">Last Activity</span>
                </div>
                <div className="font-medium text-neutral-100">{formatDate(session.last_activity)}</div>
              </div>
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
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Portfolio Value</h3>
            <div className="bg-secondary-700 rounded-lg border border-secondary-600 p-4">
              <div className="h-64">
                <Line data={equityCurveData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'trades',
      label: 'Trades',
      badge: session.total_trades,
      content: (
        <div className="space-y-6">
          {session.total_trades > 0 ? (
            <>
              {/* Trade Summary */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Trade Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-neutral-100">{session.total_trades}</div>
                    <div className="text-sm text-neutral-400">Total</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-success-400">{session.winning_trades}</div>
                    <div className="text-sm text-neutral-400">Winning</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-danger-400">{session.losing_trades}</div>
                    <div className="text-sm text-neutral-400">Losing</div>
                  </div>
                  <div className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                    <div className="text-2xl font-bold text-neutral-100">{calculateWinRate(session.winning_trades, session.total_trades)}%</div>
                    <div className="text-sm text-neutral-400">Win Rate</div>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-100 mb-4">Recent Trades</h3>
                <div className="bg-secondary-700 rounded-lg border border-secondary-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Side</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Entry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Exit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">P&L</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Exit Reason</th>
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
                              {trade.quantity}
                            </td>
                            <td className="px-4 py-3">
                              <div className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                                {formatPnL(trade.pnl)}
                              </div>
                              <div className={`text-xs ${trade.pnl_pct >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                                {trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct}%
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-400 capitalize">
                              {trade.exit_reason.replace('_', ' ')}
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
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No Trades Yet</h3>
              <p className="text-neutral-400">
                Trades will appear here once the strategy starts executing
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'alerts',
      label: 'Alerts',
      badge: mockAlerts.filter(a => !a.is_read).length,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.is_read 
                    ? 'bg-secondary-700 border-secondary-600' 
                    : 'bg-secondary-600 border-secondary-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant={
                            alert.severity === 'success' ? 'success' :
                            alert.severity === 'warning' ? 'warning' :
                            alert.severity === 'error' ? 'danger' : 'info'
                          }
                          size="sm"
                        >
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {!alert.is_read && (
                          <div className="w-2 h-2 bg-info-400 rounded-full"></div>
                        )}
                      </div>
                      <div className="font-medium text-neutral-100 mb-1">{alert.title}</div>
                      <div className="text-sm text-neutral-300">{alert.message}</div>
                    </div>
                    <div className="text-xs text-neutral-400 ml-4">
                      {formatDate(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">{session.name}</h2>
            <p className="text-neutral-400 mb-4">{session.strategy_name}</p>
          </div>
          
          <div className="flex space-x-2 ml-4">
            {session.status === 'active' && (
              <Button variant="outline" size="sm">
                <PauseIcon className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {session.status === 'paused' && (
              <Button variant="outline" size="sm">
                <PlayIcon className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            {(session.status === 'active' || session.status === 'paused') && (
              <Button variant="outline" size="sm">
                <StopIcon className="h-4 w-4 mr-2" />
                Stop
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

export default PaperTradingDetailModal;