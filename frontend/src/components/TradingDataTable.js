import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import { Card } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { Progress } from './ui/progress.jsx';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';

const TradingDataTable = ({ 
  type = 'orderbook', 
  data = [], 
  loading = false,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample data for different table types
  const sampleOrderBook = [
    { id: 1, price: 44250, amount: 0.5432, total: 24038.40, side: 'buy' },
    { id: 2, price: 44240, amount: 0.3214, total: 14223.14, side: 'buy' },
    { id: 3, price: 44230, amount: 0.7651, total: 33843.59, side: 'buy' },
    { id: 4, price: 44220, amount: 0.1892, total: 8363.22, side: 'buy' },
    { id: 5, price: 44210, amount: 0.9123, total: 40326.83, side: 'buy' },
    { id: 6, price: 44260, amount: 0.4321, total: 19128.91, side: 'sell' },
    { id: 7, price: 44270, amount: 0.6543, total: 28952.78, side: 'sell' },
    { id: 8, price: 44280, amount: 0.2341, total: 10372.65, side: 'sell' },
    { id: 9, price: 44290, amount: 0.8765, total: 38831.59, side: 'sell' },
    { id: 10, price: 44300, amount: 0.5432, total: 24058.76, side: 'sell' },
  ];

  const sampleTrades = [
    { id: 1, time: '14:32:45', price: 44250, amount: 0.5432, value: 24038.40, side: 'buy' },
    { id: 2, time: '14:32:44', price: 44240, amount: 0.3214, value: 14223.14, side: 'sell' },
    { id: 3, time: '14:32:43', price: 44230, amount: 0.7651, value: 33843.59, side: 'buy' },
    { id: 4, time: '14:32:42', price: 44220, amount: 0.1892, value: 8363.22, side: 'sell' },
    { id: 5, time: '14:32:41', price: 44210, amount: 0.9123, value: 40326.83, side: 'buy' },
    { id: 6, time: '14:32:40', price: 44260, amount: 0.4321, value: 19128.91, side: 'buy' },
    { id: 7, time: '14:32:39', price: 44270, amount: 0.6543, value: 28952.78, side: 'sell' },
    { id: 8, time: '14:32:38', price: 44280, amount: 0.2341, value: 10372.65, side: 'buy' },
  ];

  const samplePositions = [
    { id: 1, symbol: 'BTC/USD', side: 'long', size: 0.5432, entry: 43500, current: 44250, pnl: 407.40, pnlPercent: 1.72, status: 'open' },
    { id: 2, symbol: 'ETH/USD', side: 'short', size: 2.1234, entry: 2650, current: 2620, pnl: 63.70, pnlPercent: 1.13, status: 'open' },
    { id: 3, symbol: 'SOL/USD', side: 'long', size: 10.5, entry: 95.50, current: 98.20, pnl: 28.35, pnlPercent: 2.83, status: 'open' },
    { id: 4, symbol: 'ADA/USD', side: 'long', size: 1000, entry: 0.4520, current: 0.4380, pnl: -14.00, pnlPercent: -3.10, status: 'closed' },
  ];

  const getCurrentData = () => {
    switch (type) {
      case 'orderbook':
        return data.length > 0 ? data : sampleOrderBook;
      case 'trades':
        return data.length > 0 ? data : sampleTrades;
      case 'positions':
        return data.length > 0 ? data : samplePositions;
      default:
        return [];
    }
  };

  const filteredData = useMemo(() => {
    let filtered = getCurrentData();
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus || item.side === filterStatus);
    }
    
    // Sort
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        return aVal < bVal ? -modifier : aVal > bVal ? modifier : 0;
      });
    }
    
    return filtered;
  }, [searchTerm, sortField, sortDirection, filterStatus, data, type]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpIcon className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="w-4 h-4 text-primary" /> : 
      <ArrowDownIcon className="w-4 h-4 text-primary" />;
  };

  const OrderBookTable = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Buy Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-success-500">Buy Orders</h3>
          <Badge variant="outline" className="text-success-500">
            {filteredData.filter(item => item.side === 'buy').length} orders
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                Price <SortIcon field="price" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                Amount <SortIcon field="amount" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('total')}>
                Total <SortIcon field="total" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.filter(item => item.side === 'buy').map((order) => (
              <TableRow key={order.id} className="hover:bg-success-500/10">
                <TableCell className="font-medium text-success-500">
                  {formatCurrency(order.price)}
                </TableCell>
                <TableCell>{formatNumber(order.amount, 4)}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Sell Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-danger-500">Sell Orders</h3>
          <Badge variant="outline" className="text-danger-500">
            {filteredData.filter(item => item.side === 'sell').length} orders
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                Price <SortIcon field="price" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                Amount <SortIcon field="amount" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('total')}>
                Total <SortIcon field="total" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.filter(item => item.side === 'sell').map((order) => (
              <TableRow key={order.id} className="hover:bg-danger-500/10">
                <TableCell className="font-medium text-danger-500">
                  {formatCurrency(order.price)}
                </TableCell>
                <TableCell>{formatNumber(order.amount, 4)}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const TradesTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer" onClick={() => handleSort('time')}>
            Time <SortIcon field="time" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
            Price <SortIcon field="price" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
            Amount <SortIcon field="amount" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('value')}>
            Value <SortIcon field="value" />
          </TableHead>
          <TableHead>Side</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((trade) => (
          <TableRow key={trade.id} className="hover:bg-muted/50">
            <TableCell className="font-mono text-sm">
              {trade.time}
            </TableCell>
            <TableCell className={`font-medium ${trade.side === 'buy' ? 'text-success-500' : 'text-danger-500'}`}>
              {formatCurrency(trade.price)}
            </TableCell>
            <TableCell>{formatNumber(trade.amount, 4)}</TableCell>
            <TableCell>{formatCurrency(trade.value)}</TableCell>
            <TableCell>
              <Badge variant={trade.side === 'buy' ? 'success' : 'destructive'}>
                {trade.side.toUpperCase()}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const PositionsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer" onClick={() => handleSort('symbol')}>
            Symbol <SortIcon field="symbol" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('side')}>
            Side <SortIcon field="side" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('size')}>
            Size <SortIcon field="size" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('entry')}>
            Entry <SortIcon field="entry" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('current')}>
            Current <SortIcon field="current" />
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('pnl')}>
            P&L <SortIcon field="pnl" />
          </TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((position) => (
          <TableRow key={position.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              {position.symbol}
            </TableCell>
            <TableCell>
              <Badge variant={position.side === 'long' ? 'success' : 'destructive'}>
                {position.side.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>{formatNumber(position.size, 4)}</TableCell>
            <TableCell>{formatCurrency(position.entry)}</TableCell>
            <TableCell>{formatCurrency(position.current)}</TableCell>
            <TableCell>
              <div className="flex flex-col space-y-1">
                <span className={`font-medium ${position.pnl >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                </span>
                <span className={`text-sm ${position.pnlPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={position.status === 'open' ? 'secondary' : 'outline'}>
                {position.status.toUpperCase()}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderTable = () => {
    switch (type) {
      case 'orderbook':
        return <OrderBookTable />;
      case 'trades':
        return <TradesTable />;
      case 'positions':
        return <PositionsTable />;
      default:
        return <div>Unknown table type</div>;
    }
  };

  return (
    <Card className={`${className}`}>
      <div className="p-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {type === 'orderbook' && 'Order Book'}
              {type === 'trades' && 'Recent Trades'}
              {type === 'positions' && 'Positions'}
            </h3>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {type === 'orderbook' && (
                  <>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </>
                )}
                {type === 'trades' && (
                  <>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </>
                )}
                {type === 'positions' && (
                  <>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Table content */}
        {!loading && (
          <div className="overflow-x-auto">
            {renderTable()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TradingDataTable;