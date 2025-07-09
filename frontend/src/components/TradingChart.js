import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart.jsx';
import { Card } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { formatCurrency, formatPercentage } from '../lib/utils';

const TradingChart = ({ 
  data = [], 
  type = 'price', 
  height = 400,
  showVolume = true,
  showIndicators = true,
  className = '' 
}) => {
  // Sample data if none provided
  const sampleData = data.length === 0 ? [
    { time: '09:00', price: 43250, volume: 1500000, sma: 43100, rsi: 45 },
    { time: '10:00', price: 43480, volume: 1800000, sma: 43200, rsi: 52 },
    { time: '11:00', price: 43650, volume: 2100000, sma: 43300, rsi: 58 },
    { time: '12:00', price: 43420, volume: 1900000, sma: 43380, rsi: 48 },
    { time: '13:00', price: 43800, volume: 2400000, sma: 43450, rsi: 65 },
    { time: '14:00', price: 44120, volume: 2600000, sma: 43520, rsi: 72 },
    { time: '15:00', price: 43950, volume: 2200000, sma: 43590, rsi: 68 },
    { time: '16:00', price: 44300, volume: 2800000, sma: 43680, rsi: 75 },
  ] : data;

  const chartConfig = {
    price: {
      label: 'Price',
      color: 'hsl(var(--chart-1))',
    },
    volume: {
      label: 'Volume',
      color: 'hsl(var(--chart-2))',
    },
    sma: {
      label: 'SMA',
      color: 'hsl(var(--chart-3))',
    },
    rsi: {
      label: 'RSI',
      color: 'hsl(var(--chart-4))',
    },
  };

  const PriceChart = () => (
    <ChartContainer
      config={chartConfig}
      className="h-full w-full"
    >
      <AreaChart data={sampleData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="time" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
        />
        <ChartTooltip
          content={<ChartTooltipContent 
            formatter={(value, name) => [
              formatCurrency(value),
              name
            ]}
          />}
        />
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--success-500))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--success-500))" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--success-500))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#priceGradient)"
        />
        {showIndicators && (
          <Line
            type="monotone"
            dataKey="sma"
            stroke="hsl(var(--warning-500))"
            strokeWidth={1}
            dot={false}
            strokeDasharray="2 2"
          />
        )}
      </AreaChart>
    </ChartContainer>
  );

  const VolumeChart = () => (
    <ChartContainer
      config={chartConfig}
      className="h-full w-full"
    >
      <BarChart data={sampleData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="time" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
        />
        <ChartTooltip
          content={<ChartTooltipContent 
            formatter={(value, name) => [
              `${(value / 1000000).toFixed(2)}M`,
              name
            ]}
          />}
        />
        <Bar
          dataKey="volume"
          fill="hsl(var(--info-500))"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );

  const RSIChart = () => (
    <ChartContainer
      config={chartConfig}
      className="h-full w-full"
    >
      <LineChart data={sampleData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="time" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          domain={[0, 100]}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
        />
        <ReferenceLine y={70} stroke="hsl(var(--danger-500))" strokeDasharray="2 2" />
        <ReferenceLine y={30} stroke="hsl(var(--success-500))" strokeDasharray="2 2" />
        <Line
          type="monotone"
          dataKey="rsi"
          stroke="hsl(var(--warning-500))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );

  if (type === 'combined') {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Price Chart</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-success-500">
                +2.4%
              </Badge>
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          </div>
          <div style={{ height: height }}>
            <PriceChart />
          </div>
        </Card>
        
        {showVolume && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Volume</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-info-500">
                  Vol: 2.8M
                </Badge>
              </div>
            </div>
            <div style={{ height: height / 2 }}>
              <VolumeChart />
            </div>
          </Card>
        )}
        
        {showIndicators && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">RSI</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-warning-500">
                  RSI: 75
                </Badge>
              </div>
            </div>
            <div style={{ height: height / 2 }}>
              <RSIChart />
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <Tabs defaultValue="price" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="rsi">RSI</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-success-500">
              +2.4%
            </Badge>
            <span className="text-sm text-muted-foreground">24h</span>
          </div>
        </div>
        
        <TabsContent value="price" className="space-y-4">
          <div style={{ height: height }}>
            <PriceChart />
          </div>
        </TabsContent>
        
        <TabsContent value="volume" className="space-y-4">
          <div style={{ height: height }}>
            <VolumeChart />
          </div>
        </TabsContent>
        
        <TabsContent value="rsi" className="space-y-4">
          <div style={{ height: height }}>
            <RSIChart />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradingChart;