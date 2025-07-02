import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

function DataStreams() {
  const [streams, setStreams] = useState([
    {
      id: 1,
      name: 'Binance Standard Trades',
      symbol: 'BTCUSDT',
      status: 'RUNNING',
      endpoint: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
      messagesReceived: 1247,
      lastMessage: new Date().toLocaleTimeString(),
    },
    {
      id: 2,
      name: 'Binance Aggregated Trades',
      symbol: 'BTCUSDT',
      status: 'RUNNING',
      endpoint: 'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
      messagesReceived: 892,
      lastMessage: new Date().toLocaleTimeString(),
    },
    {
      id: 3,
      name: 'Funding Rates',
      symbol: 'BTCUSDT',
      status: 'PAUSED',
      endpoint: 'wss://fstream.binance.com/ws/btcusdt@markPrice',
      messagesReceived: 156,
      lastMessage: '5 min ago',
    },
    {
      id: 4,
      name: 'Liquidations',
      symbol: 'BTCUSDT',
      status: 'STOPPED',
      endpoint: 'wss://fstream.binance.com/ws/!forceOrder@arr',
      messagesReceived: 23,
      lastMessage: '1 hour ago',
    },
  ]);

  const [liveMessages, setLiveMessages] = useState([]);

  useEffect(() => {
    // Connect to WebSocket for live data
    const ws = new WebSocket('ws://localhost:8000/ws/ws');
    
    ws.onopen = () => {
      console.log('DataStreams WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'standard_trade' || message.type === 'aggregated_trade' || 
          message.type === 'funding_rate' || message.type === 'liquidation') {
        const newMessage = {
          id: Date.now(),
          timestamp: message.timestamp,
          stream: message.type.replace('_', ' ').toUpperCase(),
          symbol: message.symbol,
          price: message.price || message.mark_price || 0,
          quantity: message.quantity || 0,
          side: message.side || (message.type === 'funding_rate' ? 'FUNDING' : 'N/A'),
          tradeId: message.trade_id || Math.floor(Math.random() * 1000000),
          extra: message.type === 'funding_rate' ? `${(message.funding_rate * 100).toFixed(4)}%` : 
                 message.type === 'liquidation' ? `$${message.usd_size?.toFixed(0)}` : '',
        };

        setLiveMessages(prev => [newMessage, ...prev.slice(0, 99)]);
      }
    };

    ws.onclose = () => {
      console.log('DataStreams WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const toggleStream = async (streamId, action) => {
    // Find the stream
    const stream = streams.find(s => s.id === streamId);
    if (!stream) return;

    // Map stream names to backend stream types
    const streamTypeMap = {
      'Binance Standard Trades': 'standard',
      'Binance Aggregated Trades': 'aggregated',
      'Funding Rates': 'funding_rates',
      'Liquidations': 'liquidations',
    };

    const streamType = streamTypeMap[stream.name];
    
    try {
      if (action === 'RUNNING') {
        const response = await fetch(`/ws/streams/start/${streamType}?symbol=btcusdt`, {
          method: 'POST',
        });
        if (response.ok) {
          setStreams(streams =>
            streams.map(s =>
              s.id === streamId
                ? { ...s, status: 'RUNNING', lastMessage: new Date().toLocaleTimeString() }
                : s
            )
          );
        }
      } else if (action === 'STOPPED') {
        const response = await fetch(`/ws/streams/stop/${streamType}?symbol=btcusdt`, {
          method: 'POST',
        });
        if (response.ok) {
          setStreams(streams =>
            streams.map(s =>
              s.id === streamId
                ? { ...s, status: 'STOPPED' }
                : s
            )
          );
        }
      } else {
        // PAUSED - just update UI
        setStreams(streams =>
          streams.map(s =>
            s.id === streamId
              ? { ...s, status: action }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error toggling stream:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-success-500/20 text-success-300 border border-success-500/30';
      case 'PAUSED':
        return 'bg-warning-500/20 text-warning-300 border border-warning-500/30';
      case 'STOPPED':
        return 'bg-danger-500/20 text-danger-300 border border-danger-500/30';
      default:
        return 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stream Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">Data Stream Management</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {streams.map((stream) => (
            <div key={stream.id} className="border border-secondary-600 rounded-lg p-4 bg-secondary-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-neutral-100">{stream.name}</h4>
                  <p className="text-sm text-neutral-400">{stream.symbol}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(stream.status)}`}>
                  {stream.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-neutral-400">Endpoint:</span>
                  <span className="ml-2 font-mono text-xs break-all text-neutral-300">{stream.endpoint}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-400">Messages:</span>
                  <span className="ml-2 font-semibold text-neutral-100">{stream.messagesReceived.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-400">Last Update:</span>
                  <span className="ml-2 text-neutral-300">{stream.lastMessage}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {stream.status === 'RUNNING' ? (
                  <button
                    onClick={() => toggleStream(stream.id, 'PAUSED')}
                    className="flex items-center px-3 py-1 bg-warning-500/20 text-warning-300 border border-warning-500/30 rounded-md hover:bg-warning-500/30"
                  >
                    <PauseIcon className="w-4 h-4 mr-1" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => toggleStream(stream.id, 'RUNNING')}
                    className="flex items-center px-3 py-1 bg-success-500/20 text-success-300 border border-success-500/30 rounded-md hover:bg-success-500/30"
                  >
                    <PlayIcon className="w-4 h-4 mr-1" />
                    Start
                  </button>
                )}
                <button
                  onClick={() => toggleStream(stream.id, 'STOPPED')}
                  className="flex items-center px-3 py-1 bg-danger-500/20 text-danger-300 border border-danger-500/30 rounded-md hover:bg-danger-500/30"
                >
                  <StopIcon className="w-4 h-4 mr-1" />
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Message Feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SignalIcon className="w-5 h-5 text-primary-400 mr-2" />
            <h3 className="text-lg font-semibold text-neutral-100">Live Message Feed</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-success-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-neutral-300">Live</span>
          </div>
        </div>

        <div className="h-96 overflow-y-auto bg-secondary-700 rounded-lg p-4 border border-secondary-600 custom-scrollbar">
          <div className="space-y-1">
            {liveMessages.map((message) => (
              <div key={message.id} className="flex items-center px-4 py-2 hover:bg-secondary-600 text-sm font-mono rounded">
                <span className="text-neutral-400 w-20">{message.timestamp}</span>
                <span className="text-primary-400 w-32 truncate">{message.stream}</span>
                <span className="text-neutral-300 w-20">{message.symbol}</span>
                <span className="text-neutral-100 w-24 text-right">${message.price}</span>
                <span className="text-neutral-300 w-20 text-right">{message.quantity}</span>
                <span className={`w-16 text-center ${
                  message.side === 'BUY' ? 'text-success-400' : 'text-danger-400'
                }`}>
                  {message.side === 'BUY' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 inline" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 inline" />
                  )}
                  {message.side}
                </span>
                <span className="text-neutral-400 text-right flex-1">#{message.tradeId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stream Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Messages</p>
              <p className="text-2xl font-bold text-neutral-100">
                {streams.reduce((sum, stream) => sum + stream.messagesReceived, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-600/20 rounded-lg border border-primary-600/30">
              <SignalIcon className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">Active Streams</p>
              <p className="text-2xl font-bold text-neutral-100">
                {streams.filter(stream => stream.status === 'RUNNING').length}
              </p>
            </div>
            <div className="p-3 bg-success-500/20 rounded-lg border border-success-500/30">
              <PlayIcon className="w-6 h-6 text-success-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">Data Rate</p>
              <p className="text-2xl font-bold text-neutral-100">~2.4/sec</p>
            </div>
            <div className="p-3 bg-accent-500/20 rounded-lg border border-accent-500/30">
              <ArrowTrendingUpIcon className="w-6 h-6 text-accent-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataStreams;