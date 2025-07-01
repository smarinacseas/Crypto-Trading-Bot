import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
from .data_import.binance.standard_stream import StandardBinanceStream
from .data_import.binance.aggregated_stream import AggregatedBinanceStream
from .data_import.binance.funding_rates_stream import FundingRatesStream
from .data_import.binance.liquidations_stream import LiquidationsStream

class WebSocketManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()
        self.streams: Dict[str, any] = {}
        self.stream_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.connections.discard(websocket)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if self.connections:
            disconnected = set()
            for connection in self.connections:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected.add(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.connections.discard(conn)

    async def start_binance_stream(self, stream_type: str, symbol: str = "btcusdt"):
        """Start a specific Binance stream"""
        stream_key = f"{stream_type}_{symbol}"
        
        if stream_key in self.stream_tasks:
            return  # Stream already running

        websocket_url = "wss://stream.binance.com:9443"
        futures_ws_url = "wss://fstream.binance.com"

        if stream_type == "standard":
            stream = StandardBinanceStream(
                symbol=symbol,
                trades_file=f"binance_trades_{symbol}.csv",
                min_display=100,
                bold_amt=10000,
                color_amt=50000,
                websocket_url=websocket_url
            )
        elif stream_type == "aggregated":
            stream = AggregatedBinanceStream(
                symbol=symbol,
                trades_file=f"binance_aggregated_{symbol}.csv",
                aggregation_interval=2.0,
                baseline_threshold=1000,
                bold_threshold=10000,
                color_threshold=50000,
                websocket_url=websocket_url
            )
        elif stream_type == "funding_rates":
            stream = FundingRatesStream(
                symbol=symbol,
                trades_file=f"binance_funding_{symbol}.csv",
                websocket_url=futures_ws_url
            )
        elif stream_type == "liquidations":
            stream = LiquidationsStream(
                symbol=symbol,
                trades_file=f"binance_liquidations_{symbol}.csv",
                websocket_url=futures_ws_url
            )
        else:
            return

        self.streams[stream_key] = stream
        
        # Create a modified stream class that broadcasts to WebSocket
        modified_stream = BroadcastingStream(stream, self, stream_type)
        task = asyncio.create_task(modified_stream.run())
        self.stream_tasks[stream_key] = task

    async def stop_binance_stream(self, stream_type: str, symbol: str = "btcusdt"):
        """Stop a specific Binance stream"""
        stream_key = f"{stream_type}_{symbol}"
        
        if stream_key in self.stream_tasks:
            self.stream_tasks[stream_key].cancel()
            del self.stream_tasks[stream_key]
            
        if stream_key in self.streams:
            del self.streams[stream_key]

    def get_active_streams(self):
        """Get list of currently active streams"""
        return list(self.streams.keys())

class BroadcastingStream:
    """Wrapper class that intercepts stream data and broadcasts via WebSocket"""
    
    def __init__(self, original_stream, websocket_manager: WebSocketManager, stream_type: str):
        self.original_stream = original_stream
        self.websocket_manager = websocket_manager
        self.stream_type = stream_type

    async def run(self):
        """Run the original stream but intercept and broadcast data"""
        # Monkey patch the original stream to capture data
        original_handle = self.original_stream.handle_connection
        
        async def broadcasting_handle(ws):
            if self.stream_type == "standard":
                await self._handle_standard_stream(ws)
            elif self.stream_type == "aggregated":
                await self._handle_aggregated_stream(ws)
            elif self.stream_type == "funding_rates":
                await self._handle_funding_rates_stream(ws)
            elif self.stream_type == "liquidations":
                await self._handle_liquidations_stream(ws)
        
        self.original_stream.handle_connection = broadcasting_handle
        await self.original_stream.run()

    async def _handle_standard_stream(self, ws):
        """Handle standard trade stream with WebSocket broadcasting"""
        while True:
            try:
                msg = await ws.recv()
                data = self.original_stream.parse_trade_message(msg)
                if not data:
                    continue

                # Format data for frontend
                formatted_data = {
                    "type": "standard_trade",
                    "timestamp": self.original_stream.format_time(data.get('event_time', 0)),
                    "symbol": data.get('symbol', 'N/A').replace('USDT', ''),
                    "price": data.get('price', 0),
                    "quantity": data.get('quantity', 0),
                    "side": 'SELL' if data.get('is_buyer_maker', False) else 'BUY',
                    "trade_id": data.get('agg_trade_id', 0),
                    "usd_size": data.get('price', 0) * data.get('quantity', 0)
                }

                # Broadcast to WebSocket clients
                await self.websocket_manager.broadcast(formatted_data)

            except Exception as e:
                print(f'Error in standard stream: {e}')
                await asyncio.sleep(1)

    async def _handle_aggregated_stream(self, ws):
        """Handle aggregated trade stream with WebSocket broadcasting"""
        # This is more complex as it involves aggregation
        read_task = asyncio.create_task(self._read_aggregated_trades(ws))
        process_task = asyncio.create_task(self._process_aggregated_trades())
        await asyncio.gather(read_task, process_task)

    async def _read_aggregated_trades(self, ws):
        """Read trades for aggregation"""
        while True:
            try:
                msg = await ws.recv()
                data = self.original_stream.parse_trade_message(msg)
                if not data:
                    continue
                
                price = data.get('price', 0)
                quantity = data.get('quantity', 0)
                is_buyer_maker = data.get('is_buyer_maker', False)
                trade_type = 'SELL' if is_buyer_maker else 'BUY'
                volume = price * quantity
                
                trade = {
                    'time': data.get('event_time', 0),
                    'trade_type': trade_type,
                    'price': price,
                    'quantity': quantity,
                    'volume': volume
                }
                await self.original_stream.trade_queue.put(trade)
            except Exception as e:
                print(f'Error in aggregated read: {e}')
                await asyncio.sleep(1)

    async def _process_aggregated_trades(self):
        """Process aggregated trades and broadcast"""
        bucket_start = asyncio.get_running_loop().time()
        agg_data = {
            'BUY': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
            'SELL': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
        }
        
        while True:
            try:
                now = asyncio.get_running_loop().time()
                timeout = self.original_stream.aggregation_interval - (now - bucket_start)
                
                if timeout <= 0:
                    # Process aggregated data and broadcast
                    bucket_end_time = self.original_stream.format_time()
                    
                    for ttype in ['BUY', 'SELL']:
                        vol = agg_data[ttype]['volume']
                        if vol >= self.original_stream.baseline_threshold:
                            qty = agg_data[ttype]['quantity']
                            count = agg_data[ttype]['count']
                            avg_price = vol / qty if qty else 0
                            
                            formatted_data = {
                                "type": "aggregated_trade",
                                "timestamp": bucket_end_time,
                                "symbol": self.original_stream.get_display_symbol(),
                                "side": ttype,
                                "avg_price": avg_price,
                                "quantity": qty,
                                "volume": vol,
                                "trade_count": count
                            }
                            
                            await self.websocket_manager.broadcast(formatted_data)
                    
                    # Reset for next bucket
                    bucket_start = now
                    agg_data = {
                        'BUY': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
                        'SELL': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
                    }
                    continue
                
                trade = await asyncio.wait_for(self.original_stream.trade_queue.get(), timeout=timeout)
                ttype = trade['trade_type']
                agg_data[ttype]['volume'] += trade['volume']
                agg_data[ttype]['quantity'] += trade['quantity']
                agg_data[ttype]['count'] += 1
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f'Error in aggregation: {e}')
                continue

    async def _handle_funding_rates_stream(self, ws):
        """Handle funding rates stream with WebSocket broadcasting"""
        while True:
            try:
                msg = await ws.recv()
                data = self.original_stream.parse_mark_price_message(msg)
                if not data:
                    continue

                formatted_data = {
                    "type": "funding_rate",
                    "timestamp": self.original_stream.format_time(data.get('event_time', 0)),
                    "symbol": data.get('symbol', 'N/A').replace('USDT', ''),
                    "mark_price": data.get('mark_price', 0),
                    "funding_rate": data.get('funding_rate', 0),
                    "annualized_rate": data.get('funding_rate', 0) * 3 * 365 * 100
                }

                await self.websocket_manager.broadcast(formatted_data)

            except Exception as e:
                print(f'Error in funding rates stream: {e}')
                await asyncio.sleep(1)

    async def _handle_liquidations_stream(self, ws):
        """Handle liquidations stream with WebSocket broadcasting"""
        while True:
            try:
                msg = await ws.recv()
                data = self.original_stream.parse_liquidation_message(msg)
                if not data:
                    continue

                usd_size = data.get('price', 0) * data.get('filled_quantity', 0)
                
                formatted_data = {
                    "type": "liquidation",
                    "timestamp": self.original_stream.format_time(data.get('trade_time', 0)),
                    "symbol": data.get('symbol', 'N/A').replace('USDT', ''),
                    "side": data.get('side', 'N/A'),
                    "price": data.get('price', 0),
                    "quantity": data.get('filled_quantity', 0),
                    "usd_size": usd_size,
                    "order_status": data.get('order_status', 'N/A')
                }

                await self.websocket_manager.broadcast(formatted_data)

            except Exception as e:
                print(f'Error in liquidations stream: {e}')
                await asyncio.sleep(1)

# Global WebSocket manager instance
websocket_manager = WebSocketManager()