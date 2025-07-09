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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Filtering and pagination logic
  const filteredStrategies = strategies.filter(strategy =>
    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.short_description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredStrategies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStrategies = filteredStrategies.slice(startIndex, startIndex + itemsPerPage);

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
        <Card>
          <CardContent className="text-center p-6">
            <div className="text-2xl font-bold text-neutral-100">156</div>
            <div className="text-sm text-neutral-400">Total Strategies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-6">
            <div className="text-2xl font-bold text-neutral-100">4.2</div>
            <div className="text-sm text-neutral-400">Avg Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-6">
            <div className="text-2xl font-bold text-success-400">+23.5%</div>
            <div className="text-sm text-neutral-400">Avg Return</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-6">
            <div className="text-2xl font-bold text-neutral-100">1,247</div>
            <div className="text-sm text-neutral-400">Active Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Tabs & Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-neutral-100">Trading Strategies</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search strategies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-secondary-700 border-secondary-600 text-neutral-100"
                />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 bg-secondary-700 border-secondary-600 text-neutral-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary-700 border-secondary-600">
                    <SelectItem value="created_at">Latest</SelectItem>
                    <SelectItem value="avg_rating">Rating</SelectItem>
                    <SelectItem value="latest_return">Return</SelectItem>
                    <SelectItem value="subscriber_count">Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary-700">
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-primary-600">
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="mystrategies" className="data-[state=active]:bg-primary-600">
                My Strategies
              </TabsTrigger>
              <TabsTrigger value="subscribed" className="data-[state=active]:bg-primary-600">
                Subscribed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-secondary-600">
                    <TableHead className="text-neutral-300">Strategy</TableHead>
                    <TableHead className="text-neutral-300">Performance</TableHead>
                    <TableHead className="text-neutral-300">Risk</TableHead>
                    <TableHead className="text-neutral-300">Rating</TableHead>
                    <TableHead className="text-neutral-300">Subscribers</TableHead>
                    <TableHead className="text-neutral-300">Min Capital</TableHead>
                    <TableHead className="text-neutral-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                          <span className="ml-2 text-neutral-400">Loading strategies...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedStrategies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                        No strategies found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStrategies.map((strategy) => (
                      <TableRow key={strategy.id} className="border-secondary-600 hover:bg-secondary-700/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={strategy.avatar_url} alt={strategy.name} />
                              <AvatarFallback className="bg-primary-600 text-white">
                                {strategy.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-neutral-100">{strategy.name}</div>
                              <div className="text-sm text-neutral-400 capitalize">{strategy.strategy_type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                strategy.latest_return >= 0 ? 'text-success-400' : 'text-danger-400'
                              }`}>
                                {strategy.latest_return >= 0 ? '+' : ''}{strategy.latest_return}%
                              </span>
                              <span className="text-xs text-neutral-400">Total Return</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={strategy.latest_win_rate} 
                                className="w-16 h-2"
                              />
                              <span className="text-xs text-neutral-400">{strategy.latest_win_rate}% Win Rate</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              strategy.risk_level === 'low' ? 'success' : 
                              strategy.risk_level === 'medium' ? 'warning' : 'danger'
                            }
                            size="sm"
                          >
                            {strategy.risk_level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(strategy.avg_rating)
                                    ? 'text-warning-400 fill-current'
                                    : 'text-neutral-600'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-neutral-400 ml-1">
                              ({strategy.total_ratings})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-neutral-300">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {strategy.subscriber_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-neutral-300">
                            ${strategy.min_capital.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStrategy(strategy);
                                setShowStrategyModal(true);
                              }}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="primary">
                              Subscribe
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-neutral-400">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStrategies.length)} of {filteredStrategies.length} strategies
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      {totalPages > 5 && <PaginationEllipsis />}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mystrategies" className="mt-6">
              <div className="text-center py-8 text-neutral-400">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
                <p className="text-lg font-medium mb-2">No strategies created yet</p>
                <p className="mb-4">Create your first trading strategy to get started</p>
                <Button variant="primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Strategy
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subscribed" className="mt-6">
              <div className="text-center py-8 text-neutral-400">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
                <p className="text-lg font-medium mb-2">No subscriptions yet</p>
                <p className="mb-4">Subscribe to strategies to track their performance</p>
                <Button variant="outline">Browse Marketplace</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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