import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ChartBarIcon,
  FireIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  EyeIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Card, Button, Input, Badge, Tabs, Spinner } from '../components/ui';
import StrategyDetailModal from '../components/StrategyDetailModal';

const Strategies = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // Mock data for demonstration
  const mockStrategies = [
    {
      id: 1,
      name: "SMA Crossover Strategy",
      description: "A classic technical analysis strategy using Simple Moving Average crossovers. When the short-term SMA crosses above the long-term SMA, it generates a buy signal. When it crosses below, it generates a sell signal. This strategy works best in trending markets and includes built-in risk management with stop-loss and take-profit levels.",
      short_description: "Classic SMA crossover strategy for trend following",
      strategy_type: "technical",
      risk_level: "medium",
      min_capital: 500,
      recommended_capital: 2000,
      target_return: 25.0,
      avg_rating: 4.2,
      total_ratings: 127,
      subscriber_count: 45,
      latest_return: 20.5,
      latest_sharpe: 1.8,
      latest_win_rate: 65.2,
      is_public: true,
      created_at: "2024-01-15",
      tags: ["sma", "crossover", "trend-following", "beginner-friendly"]
    },
    {
      id: 2,
      name: "RSI Mean Reversion",
      description: "A mean reversion strategy based on the Relative Strength Index (RSI). Buys when RSI is oversold (below 30) and sells when RSI is overbought (above 70). Best suited for sideways markets with clear support and resistance levels.",
      short_description: "RSI-based mean reversion strategy for range-bound markets",
      strategy_type: "technical",
      risk_level: "medium",
      min_capital: 1000,
      recommended_capital: 3000,
      target_return: 20.0,
      avg_rating: 3.9,
      total_ratings: 89,
      subscriber_count: 32,
      latest_return: 18.3,
      latest_sharpe: 1.5,
      latest_win_rate: 58.7,
      is_public: true,
      created_at: "2024-01-10",
      tags: ["rsi", "mean-reversion", "scalping", "intermediate"]
    },
    {
      id: 3,
      name: "Momentum Breakout",
      description: "A momentum-based strategy that identifies breakouts from consolidation patterns. Uses volume confirmation and multiple timeframe analysis to reduce false signals. High reward potential but requires strict risk management and is best suited for experienced traders.",
      short_description: "High-momentum breakout strategy with volume confirmation",
      strategy_type: "momentum",
      risk_level: "high",
      min_capital: 2000,
      recommended_capital: 5000,
      target_return: 45.0,
      avg_rating: 4.5,
      total_ratings: 203,
      subscriber_count: 78,
      latest_return: 35.8,
      latest_sharpe: 2.1,
      latest_win_rate: 45.3,
      is_public: true,
      created_at: "2024-01-05",
      tags: ["momentum", "breakout", "volume", "advanced"]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStrategies(mockStrategies);
      setLoading(false);
    }, 1000);
  }, []);



  const getStrategyTypeIcon = (type) => {
    switch (type) {
      case 'technical': return <ChartBarIcon className="h-5 w-5" />;
      case 'momentum': return <BoltIcon className="h-5 w-5" />;
      case 'quantitative': return <FireIcon className="h-5 w-5" />;
      case 'arbitrage': return <ArrowTrendingUpIcon className="h-5 w-5" />;
      default: return <ShieldCheckIcon className="h-5 w-5" />;
    }
  };

  const renderStars = (rating, totalRatings) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-warning-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-warning-400 opacity-50" />);
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-neutral-400" />);
      }
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-neutral-400">({totalRatings})</span>
      </div>
    );
  };

  const handleViewStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setShowStrategyModal(true);
  };

  const StrategyCard = ({ strategy }) => (
    <Card hover className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary-600/20 rounded-lg border border-primary-600/30">
              {getStrategyTypeIcon(strategy.strategy_type)}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100">{strategy.name}</h3>
              <p className="text-sm text-neutral-400 capitalize">{strategy.strategy_type}</p>
            </div>
          </div>
          <button className="text-neutral-400 hover:text-danger-400 transition-colors">
            <HeartIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-300 mb-4 flex-grow">{strategy.short_description}</p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-lg font-bold text-neutral-100">{strategy.latest_return}%</div>
            <div className="text-xs text-neutral-400">Total Return</div>
          </div>
          <div className="text-center p-3 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-lg font-bold text-neutral-100">{strategy.latest_win_rate}%</div>
            <div className="text-xs text-neutral-400">Win Rate</div>
          </div>
        </div>

        {/* Risk & Capital */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant={strategy.risk_level === 'low' ? 'success' : strategy.risk_level === 'medium' ? 'warning' : 'danger'}
            size="sm"
          >
            {strategy.risk_level.toUpperCase()} RISK
          </Badge>
          <div className="text-sm text-neutral-300">
            Min: ${strategy.min_capital.toLocaleString()}
          </div>
        </div>

        {/* Rating & Subscribers */}
        <div className="flex items-center justify-between mb-4">
          {renderStars(strategy.avg_rating, strategy.total_ratings)}
          <div className="flex items-center text-sm text-neutral-400">
            <UsersIcon className="h-4 w-4 mr-1" />
            {strategy.subscriber_count}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {strategy.tags?.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 text-xs bg-accent-500/20 text-neutral-300 rounded border border-accent-500/30"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-auto">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => handleViewStrategy(strategy)}
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button variant="outline" size="sm">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const filteredStrategies = strategies.filter(strategy => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        strategy.name.toLowerCase().includes(searchLower) ||
        strategy.short_description.toLowerCase().includes(searchLower) ||
        strategy.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const tabs = [
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: <FireIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                placeholder="Search strategies, tags, or descriptions..."
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
              <select 
                className="px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-lg text-neutral-100 text-sm"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="created_at-desc">Newest First</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="return-desc">Best Performance</option>
                <option value="subscribers-desc">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Strategy Grid */}
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
              {filteredStrategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}

          {filteredStrategies.length === 0 && !loading && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-100 mb-2">No strategies found</h3>
              <p className="text-neutral-400 mb-4">Try adjusting your search terms or filters</p>
              <Button variant="primary">Browse All Strategies</Button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'my-strategies',
      label: 'My Strategies',
      icon: <UserIcon className="h-4 w-4" />,
      content: (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-100 mb-2">No strategies created yet</h3>
          <p className="text-neutral-400 mb-4">Create your first trading strategy to get started</p>
          <Button variant="primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Strategy
          </Button>
        </div>
      )
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: <HeartIconSolid className="h-4 w-4" />,
      badge: '3',
      content: (
        <div className="text-center py-12">
          <HeartIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-100 mb-2">No subscriptions yet</h3>
          <p className="text-neutral-400 mb-4">Subscribe to strategies to track their performance</p>
          <Button variant="outline">Browse Marketplace</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Strategy Marketplace</h1>
          <p className="text-neutral-400 mt-1">Discover, analyze, and subscribe to proven trading strategies</p>
        </div>
        <Button variant="primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">156</div>
            <div className="text-sm text-neutral-400">Total Strategies</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">4.2</div>
            <div className="text-sm text-neutral-400">Avg Rating</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-success-400">+23.5%</div>
            <div className="text-sm text-neutral-400">Avg Return</div>
          </div>
        </Card>
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-neutral-100">1,247</div>
            <div className="text-sm text-neutral-400">Active Users</div>
          </div>
        </Card>
      </div>

      {/* Strategy Tabs */}
      <Tabs 
        tabs={tabs}
        defaultTab={0}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Strategy Detail Modal */}
      <StrategyDetailModal
        strategy={selectedStrategy}
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
      />
    </div>
  );
};

export default Strategies;