import React, { useState, useEffect } from 'react';
import TradingChart from '../components/TradingChart';
import TradingDataTable from '../components/TradingDataTable';
import TradingForm from '../components/TradingForm';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  Wallet,
  AlertTriangle,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '../lib/utils';

const ModernDashboard = () => {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 125680.45,
    dayChange: 2847.32,
    dayChangePercent: 2.31,
    availableBalance: 15420.80,
  });

  const [marketData, setMarketData] = useState([
    { symbol: 'BTC/USD', price: 44250, change: 2.31, volume: '2.8B' },
    { symbol: 'ETH/USD', price: 2620, change: -1.45, volume: '1.2B' },
    { symbol: 'SOL/USD', price: 98.20, change: 4.67, volume: '350M' },
    { symbol: 'ADA/USD', price: 0.438, change: -0.82, volume: '180M' },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'info', message: 'BTC price target of $45,000 reached', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'High volatility detected in ETH/USD', time: '5 min ago' },
    { id: 3, type: 'success', message: 'Stop loss order executed for SOL/USD', time: '8 min ago' },
  ]);

  const handleOrderSubmit = (orderData) => {
    console.log('Order submitted:', orderData);
    // Handle order submission logic here
  };

  const StatCard = ({ title, value, change, changePercent, icon: Icon, trend }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-success-500' : 'text-danger-500'
              }`}>
                {change} ({changePercent})
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );

  const AlertCard = ({ alert }) => {
    const getAlertIcon = (type) => {
      switch (type) {
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-warning-500" />;
        case 'success':
          return <TrendingUp className="h-4 w-4 text-success-500" />;
        default:
          return <Activity className="h-4 w-4 text-info-500" />;
      }
    };

    const getAlertBorder = (type) => {
      switch (type) {
        case 'warning':
          return 'border-l-4 border-warning-500';
        case 'success':
          return 'border-l-4 border-success-500';
        default:
          return 'border-l-4 border-info-500';
      }
    };

    return (
      <div className={`p-3 bg-card rounded-lg ${getAlertBorder(alert.type)}`}>
        <div className="flex items-start space-x-3">
          {getAlertIcon(alert.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{alert.message}</p>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {alert.time}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
          <p className="text-muted-foreground">Monitor your portfolio and execute trades</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse"></div>
            <span>Live Market Data</span>
          </Badge>
          <Button variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(portfolioData.totalValue)}
          change={`+${formatCurrency(portfolioData.dayChange)}`}
          changePercent={`+${portfolioData.dayChangePercent}%`}
          icon={Wallet}
          trend="up"
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(portfolioData.availableBalance)}
          icon={DollarSign}
        />
        <StatCard
          title="Active Positions"
          value="12"
          change="+3"
          changePercent="+25%"
          icon={BarChart3}
          trend="up"
        />
        <StatCard
          title="24h Volume"
          value="$2.8M"
          change="+$450K"
          changePercent="+18.7%"
          icon={Activity}
          trend="up"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <TradingChart 
            type="combined" 
            height={400}
            showVolume={true}
            showIndicators={true}
          />

          {/* Market Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Market Overview</h3>
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {marketData.map((market) => (
                <div key={market.symbol} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{market.symbol}</p>
                    <p className="text-sm text-muted-foreground">Vol: {market.volume}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(market.price)}</p>
                    <p className={`text-sm ${market.change >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                      {market.change >= 0 ? '+' : ''}{market.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Trading Form */}
          <TradingForm
            onSubmit={handleOrderSubmit}
            balance={portfolioData.availableBalance}
            currentPrice={44250}
            symbol="BTC/USD"
          />

          {/* Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Alerts</h3>
              <Badge variant="outline">{alerts.length}</Badge>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Win Rate</span>
                  <span className="font-medium">74%</span>
                </div>
                <Progress value={74} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Profit Factor</span>
                  <span className="font-medium">1.85</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Risk Score</span>
                  <span className="font-medium">3.2/10</span>
                </div>
                <Progress value={32} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orderbook">Order Book</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orderbook" className="space-y-4">
          <TradingDataTable type="orderbook" />
        </TabsContent>
        
        <TabsContent value="trades" className="space-y-4">
          <TradingDataTable type="trades" />
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <TradingDataTable type="positions" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModernDashboard;