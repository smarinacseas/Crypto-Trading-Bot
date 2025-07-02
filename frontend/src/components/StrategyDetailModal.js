import React, { useState } from 'react';
import {
  StarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  TagIcon,
  PlayIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Modal, Button, Badge, Tabs } from './ui';

const StrategyDetailModal = ({ strategy, isOpen, onClose }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);

  if (!strategy) return null;

  const performanceMetrics = [
    { label: 'Total Return', value: `${strategy.latest_return}%`, positive: strategy.latest_return > 0 },
    { label: 'Sharpe Ratio', value: strategy.latest_sharpe, positive: strategy.latest_sharpe > 1 },
    { label: 'Win Rate', value: `${strategy.latest_win_rate}%`, positive: strategy.latest_win_rate > 50 },
    { label: 'Max Drawdown', value: '12.5%', positive: false },
    { label: 'Total Trades', value: '234', neutral: true },
    { label: 'Avg Trade', value: '2.3%', positive: true }
  ];

  const riskMetrics = [
    { label: 'Risk Level', value: strategy.risk_level.toUpperCase(), color: strategy.risk_level },
    { label: 'Volatility', value: '18.5%' },
    { label: 'Beta', value: '0.85' },
    { label: 'VaR (95%)', value: '-4.2%' }
  ];

  const capitalRequirements = [
    { label: 'Minimum Capital', value: `$${strategy.min_capital.toLocaleString()}` },
    { label: 'Recommended', value: `$${strategy.recommended_capital.toLocaleString()}` },
    { label: 'Max Position Size', value: '25%' },
    { label: 'Leverage', value: '1:1' }
  ];

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (interactive ? userRating : rating);
      const StarComponent = isFilled ? StarIconSolid : StarIcon;
      stars.push(
        <StarComponent
          key={i}
          className={`h-5 w-5 cursor-pointer transition-colors ${
            isFilled ? 'text-warning-400' : 'text-neutral-400 hover:text-warning-400'
          }`}
          onClick={interactive ? () => setUserRating(i) : undefined}
        />
      );
    }
    return <div className="flex space-x-1">{stars}</div>;
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Strategy Description</h3>
            <p className="text-neutral-300 leading-relaxed">
              {strategy.description || strategy.short_description}
            </p>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-secondary-700 rounded-lg border border-secondary-600">
                <ChartBarIcon className="h-5 w-5 text-primary-400" />
                <div>
                  <div className="font-medium text-neutral-100">Technical Analysis</div>
                  <div className="text-sm text-neutral-400">Advanced indicators</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-secondary-700 rounded-lg border border-secondary-600">
                <ShieldCheckIcon className="h-5 w-5 text-success-400" />
                <div>
                  <div className="font-medium text-neutral-100">Risk Management</div>
                  <div className="text-sm text-neutral-400">Built-in stop losses</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-secondary-700 rounded-lg border border-secondary-600">
                <ClockIcon className="h-5 w-5 text-warning-400" />
                <div>
                  <div className="font-medium text-neutral-100">Automated</div>
                  <div className="text-sm text-neutral-400">24/7 execution</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-secondary-700 rounded-lg border border-secondary-600">
                <ArrowTrendingUpIcon className="h-5 w-5 text-info-400" />
                <div>
                  <div className="font-medium text-neutral-100">Backtested</div>
                  <div className="text-sm text-neutral-400">Proven results</div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Strategy Parameters</h3>
            <div className="bg-secondary-700 rounded-lg border border-secondary-600 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-neutral-400">Timeframe:</span>
                  <span className="ml-2 text-neutral-100">4 hours</span>
                </div>
                <div>
                  <span className="text-neutral-400">Market Type:</span>
                  <span className="ml-2 text-neutral-100">Trending</span>
                </div>
                <div>
                  <span className="text-neutral-400">Assets:</span>
                  <span className="ml-2 text-neutral-100">BTC, ETH, Major Alts</span>
                </div>
                <div>
                  <span className="text-neutral-400">Frequency:</span>
                  <span className="ml-2 text-neutral-100">2-3 trades/week</span>
                </div>
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

          {/* Risk Analysis */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Risk Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {riskMetrics.map((metric) => (
                <div key={metric.label} className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                  <div className="text-lg font-bold text-neutral-100">{metric.value}</div>
                  <div className="text-sm text-neutral-400 mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Capital Requirements */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-4">Capital Requirements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capitalRequirements.map((metric) => (
                <div key={metric.label} className="p-4 bg-secondary-700 rounded-lg border border-secondary-600 text-center">
                  <div className="text-lg font-bold text-neutral-100">{metric.value}</div>
                  <div className="text-sm text-neutral-400 mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reviews',
      label: 'Reviews',
      badge: strategy.total_ratings,
      content: (
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="flex items-center justify-between p-6 bg-secondary-700 rounded-lg border border-secondary-600">
            <div className="text-center">
              <div className="text-4xl font-bold text-neutral-100">{strategy.avg_rating}</div>
              <div className="text-sm text-neutral-400">out of 5</div>
              {renderStars(strategy.avg_rating)}
              <div className="text-sm text-neutral-400 mt-1">{strategy.total_ratings} reviews</div>
            </div>
            <div className="flex-1 ml-8">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-neutral-400 w-8">{stars}★</span>
                  <div className="flex-1 bg-secondary-600 rounded-full h-2">
                    <div 
                      className="bg-warning-400 h-2 rounded-full" 
                      style={{ width: `${Math.random() * 80 + 10}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-400 w-8">
                    {Math.floor(Math.random() * 50 + 5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Review */}
          <div className="p-6 bg-secondary-700 rounded-lg border border-secondary-600">
            <h4 className="font-semibold text-neutral-100 mb-3">Rate this strategy</h4>
            <div className="flex items-center space-x-4 mb-4">
              {renderStars(userRating, true)}
              <span className="text-neutral-400">Click to rate</span>
            </div>
            <textarea
              className="w-full p-3 bg-secondary-600 border border-secondary-500 rounded-lg text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="3"
              placeholder="Share your experience with this strategy..."
            />
            <Button className="mt-3" size="sm">Submit Review</Button>
          </div>

          {/* Sample Reviews */}
          <div className="space-y-4">
            {[
              { name: 'John D.', rating: 5, date: '2 days ago', review: 'Excellent strategy! Consistent returns and great risk management.' },
              { name: 'Sarah M.', rating: 4, date: '1 week ago', review: 'Good performance overall, though it struggles in sideways markets.' },
              { name: 'Mike R.', rating: 5, date: '2 weeks ago', review: 'Been using this for 3 months. Very happy with the results!' }
            ].map((review, index) => (
              <div key={index} className="p-4 bg-secondary-700 rounded-lg border border-secondary-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {review.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-100">{review.name}</div>
                      <div className="text-sm text-neutral-400">{review.date}</div>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className="text-neutral-300">{review.review}</p>
              </div>
            ))}
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
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">{strategy.name}</h2>
            <p className="text-neutral-400 mb-4">{strategy.short_description}</p>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                {renderStars(strategy.avg_rating)}
                <span className="text-sm text-neutral-400">({strategy.total_ratings})</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-neutral-400">
                <UsersIcon className="h-4 w-4" />
                <span>{strategy.subscriber_count} subscribers</span>
              </div>
              <Badge 
                variant={strategy.risk_level === 'low' ? 'success' : strategy.risk_level === 'medium' ? 'warning' : 'danger'}
              >
                {strategy.risk_level.toUpperCase()} RISK
              </Badge>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {strategy.tags?.map((tag) => (
                <span 
                  key={tag}
                  className="flex items-center px-3 py-1 text-sm bg-accent-500/20 text-neutral-300 rounded border border-accent-500/30"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => setIsFavorited(!isFavorited)}>
              {isFavorited ? 
                <HeartIconSolid className="h-5 w-5 text-danger-400" /> : 
                <HeartIcon className="h-5 w-5" />
              }
            </Button>
            <Button variant="ghost" size="sm">
              <ShareIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab={0} />

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-secondary-600">
          <div className="text-sm text-neutral-400">
            <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
            Min capital: ${strategy.min_capital.toLocaleString()}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Paper Trading
            </Button>
            <Button variant="primary">
              Subscribe to Strategy
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StrategyDetailModal;