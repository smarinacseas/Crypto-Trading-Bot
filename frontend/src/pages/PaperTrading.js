import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Badge, Tabs, Spinner } from '../components/ui';
import PaperTradingDetailModal from '../components/PaperTradingDetailModal';
import CreatePaperTradingModal from '../components/CreatePaperTradingModal';

const PaperTrading = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);


  useEffect(() => {
    // Mock data for demonstration
    const mockSessions = [
      {
        id: 1,
        name: "SMA Crossover Live Test",
        strategy_name: "SMA Crossover Strategy",
        symbol: "BTCUSD",
        initial_capital: 10000,
        current_capital: 11250,
        status: "active",
        start_time: "2024-06-15T09:00:00Z",
        last_activity: "2024-06-15T14:30:00Z",
        total_pnl: 1250,
        total_trades: 8,
        winning_trades: 6,
        losing_trades: 2,
        open_positions: 1,
        data_source: "binance",
        current_positions: [
          {
            symbol: "BTCUSD",
            side: "long",
            quantity: 0.18,
            entry_price: 67500,
            current_price: 68200,
            unrealized_pnl: 126,
            unrealized_pnl_pct: 1.04
          }
        ]
      },
      {
        id: 2,
        name: "RSI Scalping Bot",
        strategy_name: "RSI Mean Reversion",
        symbol: "ETHUSD",
        initial_capital: 5000,
        current_capital: 4850,
        status: "paused",
        start_time: "2024-06-14T12:00:00Z",
        last_activity: "2024-06-15T11:20:00Z",
        total_pnl: -150,
        total_trades: 15,
        winning_trades: 8,
        losing_trades: 7,
        open_positions: 0,
        data_source: "binance"
      },
      {
        id: 3,
        name: "Momentum Strategy Test",
        strategy_name: "Momentum Breakout",
        symbol: "SOLUSD",
        initial_capital: 2000,
        current_capital: 2450,
        status: "stopped",
        start_time: "2024-06-10T08:00:00Z",
        end_time: "2024-06-14T16:00:00Z",
        total_pnl: 450,
        total_trades: 12,
        winning_trades: 9,
        losing_trades: 3,
        open_positions: 0,
        data_source: "binance"
      }
    ];
    
    // Simulate API call
    setTimeout(() => {
      setSessions(mockSessions);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success-400 bg-success-500/20 border-success-500/30';
      case 'paused': return 'text-warning-400 bg-warning-500/20 border-warning-500/30';
      case 'stopped': return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30';
      default: return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <BoltIcon className="h-4 w-4 text-success-400" />;
      case 'paused': return <PauseIcon className="h-4 w-4 text-warning-400" />;
      case 'stopped': return <StopIcon className="h-4 w-4 text-neutral-400" />;
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

  const formatPnL = (pnl) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${formatCurrency(pnl)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateWinRate = (winning, total) => {
    return total > 0 ? ((winning / total) * 100).toFixed(1) : '0.0';
  };

  const calculateReturnPct = (current, initial) => {
    return (((current - initial) / initial) * 100).toFixed(2);
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleToggleSession = async (sessionId, currentStatus) => {
    // Simulate API call to toggle session status
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            status: currentStatus === 'active' ? 'paused' : 'active',
            last_activity: new Date().toISOString()
          }
        : session
    ));
  };

  const handleStopSession = async (sessionId) => {
    // Simulate API call to stop session
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            status: 'stopped',
            end_time: new Date().toISOString()
          }
        : session
    ));
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const PaperTradingCard = ({ session }) => (
    <Card hover className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-100 mb-1">{session.name}</h3>
            <p className="text-sm text-neutral-400">{session.strategy_name}</p>
          </div>
          <div className={`flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(session.status)}`}>
            {getStatusIcon(session.status)}
            <span className="ml-1 capitalize">{session.status}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className={`text-lg font-bold ${session.total_pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {formatPnL(session.total_pnl)}
            </div>
            <div className="text-xs text-neutral-400">Total P&L</div>
          </div>
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className={`text-lg font-bold ${session.total_pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {session.total_pnl >= 0 ? '+' : ''}{calculateReturnPct(session.current_capital, session.initial_capital)}%
            </div>
            <div className="text-xs text-neutral-400">Return</div>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-secondary-700 rounded border border-secondary-600">
            <div className="text-sm font-medium text-neutral-100">{session.total_trades}</div>
            <div className="text-xs text-neutral-400">Trades</div>
          </div>
          <div className="text-center p-2 bg-secondary-700 rounded border border-secondary-600">
            <div className="text-sm font-medium text-neutral-100">{calculateWinRate(session.winning_trades, session.total_trades)}%</div>
            <div className="text-xs text-neutral-400">Win Rate</div>
          </div>
          <div className="text-center p-2 bg-secondary-700 rounded border border-secondary-600">
            <div className="text-sm font-medium text-neutral-100">{session.open_positions}</div>
            <div className="text-xs text-neutral-400">Open</div>
          </div>
        </div>

        {/* Capital Info */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-400">Current Capital</span>
            <span className="text-neutral-100 font-medium">{formatCurrency(session.current_capital)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Symbol</span>
            <span className="text-neutral-100 font-medium">{session.symbol}</span>
          </div>
        </div>

        {/* Current Position (if any) */}
        {session.current_positions && session.current_positions.length > 0 && (
          <div className="mb-4 p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-xs text-neutral-400 mb-2">Current Position</div>
            {session.current_positions.map((position, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <Badge variant={position.side === 'long' ? 'success' : 'danger'} size="sm">
                    {position.side.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-neutral-300 ml-2">{position.quantity}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${position.unrealized_pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {formatPnL(position.unrealized_pnl)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {position.unrealized_pnl >= 0 ? '+' : ''}{position.unrealized_pnl_pct.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Activity */}
        <div className="text-xs text-neutral-500 mb-4">
          Last activity: {formatDate(session.last_activity)}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-auto">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => handleViewSession(session)}
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Button>
          
          {session.status === 'active' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleToggleSession(session.id, session.status)}
            >
              <PauseIcon className="h-4 w-4" />
            </Button>
          )}
          
          {session.status === 'paused' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleToggleSession(session.id, session.status)}
            >
              <PlayIcon className="h-4 w-4" />
            </Button>
          )}
          
          {(session.status === 'active' || session.status === 'paused') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStopSession(session.id)}
            >
              <StopIcon className="h-4 w-4" />
            </Button>
          )}
          
          {session.status === 'stopped' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeleteSession(session.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        session.name.toLowerCase().includes(searchLower) ||
        session.strategy_name.toLowerCase().includes(searchLower) ||
        session.symbol.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const tabs = [
    {
      id: 'all',
      label: 'All Sessions',
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                placeholder="Search sessions..."
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
                New Session
              </Button>
            </div>
          </div>

          {/* Sessions Grid */}
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
              {filteredSessions.map((session) => (
                <PaperTradingCard key={session.id} session={session} />
              ))}
            </div>
          )}

          {filteredSessions.length === 0 && !loading && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No sessions found</h3>
              <p className="text-neutral-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start your first paper trading session'}
              </p>
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'active',
      label: 'Active',
      icon: <BoltIcon className="h-4 w-4" />,
      badge: sessions.filter(s => s.status === 'active').length.toString(),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions
              .filter(s => s.status === 'active')
              .map(session => (
                <PaperTradingCard key={session.id} session={session} />
              ))
            }
          </div>
          {sessions.filter(s => s.status === 'active').length === 0 && (
            <div className="text-center py-12">
              <BoltIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No active sessions</h3>
              <p className="text-neutral-400">Start a new paper trading session to begin testing strategies</p>
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
            {sessions
              .filter(s => s.status === 'stopped')
              .map(session => (
                <PaperTradingCard key={session.id} session={session} />
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
          <h1 className="text-3xl font-bold text-neutral-100">Paper Trading</h1>
          <p className="text-neutral-400 mt-1">Test strategies in real-time without risking capital</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">{sessions.length}</div>
            <div className="text-sm text-neutral-400">Total Sessions</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-success-400">{sessions.filter(s => s.status === 'active').length}</div>
            <div className="text-sm text-neutral-400">Active</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">
              {sessions.length > 0 
                ? formatCurrency(sessions.reduce((sum, s) => sum + s.total_pnl, 0))
                : '$0'
              }
            </div>
            <div className="text-sm text-neutral-400">Total P&L</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">
              {sessions.reduce((sum, s) => sum + s.total_trades, 0)}
            </div>
            <div className="text-sm text-neutral-400">Total Trades</div>
          </div>
        </Card>
      </div>

      {/* Sessions Tabs */}
      <Tabs 
        tabs={tabs}
        defaultTab={0}
        variant="pills"
      />

      {/* Modals */}
      <PaperTradingDetailModal
        session={selectedSession}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <CreatePaperTradingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={(newSession) => {
          setSessions(prev => [newSession, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default PaperTrading;