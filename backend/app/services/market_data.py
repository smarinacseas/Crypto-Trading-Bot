"""
Real-time market data service for paper trading
"""

import asyncio
import json
import websockets
import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from sqlalchemy.orm import Session
import aiohttp

from backend.app.core.database import SessionLocal
from backend.app.models.paper_trading import MarketDataSnapshot


logger = logging.getLogger(__name__)


@dataclass
class MarketTick:
    """Market data tick representation"""
    symbol: str
    timestamp: datetime
    price: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    volume: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    change_24h: Optional[float] = None
    change_24h_pct: Optional[float] = None


@dataclass
class OrderBookLevel:
    """Order book level"""
    price: float
    size: float


@dataclass
class OrderBook:
    """Order book data"""
    symbol: str
    timestamp: datetime
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]
    
    @property
    def best_bid(self) -> Optional[OrderBookLevel]:
        return self.bids[0] if self.bids else None
    
    @property
    def best_ask(self) -> Optional[OrderBookLevel]:
        return self.asks[0] if self.asks else None
    
    @property
    def spread(self) -> Optional[float]:
        if self.best_bid and self.best_ask:
            return self.best_ask.price - self.best_bid.price
        return None


class MarketDataService:
    """Real-time market data service"""
    
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}
        self.current_prices: Dict[str, MarketTick] = {}
        self.order_books: Dict[str, OrderBook] = {}
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.running = False
        
    async def start(self):
        """Start the market data service"""
        self.running = True
        logger.info("Starting market data service")
        
        # Start data feeds concurrently
        tasks = [
            self.start_binance_websocket(),
            self.start_price_simulator(),  # Fallback simulator
            self.start_data_persistence()
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def stop(self):
        """Stop the market data service"""
        self.running = False
        logger.info("Stopping market data service")
        
        # Close all websocket connections
        for ws in self.websocket_connections.values():
            if not ws.closed:
                await ws.close()
    
    def subscribe(self, symbol: str, callback: Callable[[MarketTick], None]):
        """Subscribe to market data for a symbol"""
        if symbol not in self.subscribers:
            self.subscribers[symbol] = []
        self.subscribers[symbol].append(callback)
        
        # Send current price if available
        if symbol in self.current_prices:
            callback(self.current_prices[symbol])
    
    def unsubscribe(self, symbol: str, callback: Callable[[MarketTick], None]):
        """Unsubscribe from market data"""
        if symbol in self.subscribers:
            self.subscribers[symbol].remove(callback)
            if not self.subscribers[symbol]:
                del self.subscribers[symbol]
    
    def get_current_price(self, symbol: str) -> Optional[MarketTick]:
        """Get current price for a symbol"""
        return self.current_prices.get(symbol)
    
    def get_order_book(self, symbol: str) -> Optional[OrderBook]:
        """Get current order book for a symbol"""
        return self.order_books.get(symbol)
    
    async def start_binance_websocket(self):
        """Start Binance WebSocket connection for real-time data"""
        symbols = ["btcusdt", "ethusdt", "adausdt", "solusdt"]  # Common symbols
        
        # Create WebSocket URL for multiple symbols
        streams = [f"{symbol}@ticker" for symbol in symbols]
        streams.extend([f"{symbol}@bookTicker" for symbol in symbols])
        url = f"wss://stream.binance.com:9443/ws/{'/'.join(streams)}"
        
        while self.running:
            try:
                logger.info("Connecting to Binance WebSocket...")
                async with websockets.connect(url) as websocket:
                    self.websocket_connections["binance"] = websocket
                    logger.info("Connected to Binance WebSocket")
                    
                    async for message in websocket:
                        if not self.running:
                            break
                        
                        try:
                            data = json.loads(message)
                            await self.process_binance_message(data)
                        except Exception as e:
                            logger.error(f"Error processing Binance message: {e}")
                            
            except Exception as e:
                logger.error(f"Binance WebSocket error: {e}")
                if self.running:
                    await asyncio.sleep(5)  # Retry after 5 seconds
    
    async def process_binance_message(self, data: dict):
        """Process incoming Binance WebSocket message"""
        try:
            if 'stream' in data:
                stream = data['stream']
                stream_data = data['data']
                
                if '@ticker' in stream:
                    # 24hr ticker data
                    symbol = stream_data['s'].replace('USDT', '/USD')
                    
                    tick = MarketTick(
                        symbol=symbol,
                        timestamp=datetime.utcnow(),
                        price=float(stream_data['c']),  # Current price
                        volume=float(stream_data['v']),  # 24h volume
                        high_24h=float(stream_data['h']),
                        low_24h=float(stream_data['l']),
                        change_24h=float(stream_data['P']),  # 24h change %
                        change_24h_pct=float(stream_data['P'])
                    )
                    
                    await self.update_price(symbol, tick)
                    
                elif '@bookTicker' in stream:
                    # Best bid/ask data
                    symbol = stream_data['s'].replace('USDT', '/USD')
                    
                    if symbol in self.current_prices:
                        # Update existing tick with bid/ask
                        tick = self.current_prices[symbol]
                        tick.bid = float(stream_data['b'])
                        tick.ask = float(stream_data['a'])
                        await self.update_price(symbol, tick)
                    
        except Exception as e:
            logger.error(f"Error processing Binance message: {e}")
    
    async def start_price_simulator(self):
        """Fallback price simulator for development/testing"""
        symbols = ["BTC/USD", "ETH/USD", "ADA/USD", "SOL/USD"]
        base_prices = {
            "BTC/USD": 50000.0,
            "ETH/USD": 3000.0,
            "ADA/USD": 0.5,
            "SOL/USD": 100.0
        }
        
        while self.running:
            try:
                for symbol in symbols:
                    if symbol not in self.current_prices:
                        # Initialize with base price
                        base_price = base_prices.get(symbol, 100.0)
                        
                        tick = MarketTick(
                            symbol=symbol,
                            timestamp=datetime.utcnow(),
                            price=base_price,
                            bid=base_price * 0.999,
                            ask=base_price * 1.001,
                            volume=1000.0,
                            high_24h=base_price * 1.05,
                            low_24h=base_price * 0.95,
                            change_24h=base_price * 0.02,
                            change_24h_pct=2.0
                        )
                        
                        await self.update_price(symbol, tick)
                    else:
                        # Simulate price movement
                        current_tick = self.current_prices[symbol]
                        price_change = (asyncio.get_event_loop().time() % 1 - 0.5) * 0.001  # ±0.1%
                        new_price = current_tick.price * (1 + price_change)
                        
                        updated_tick = MarketTick(
                            symbol=symbol,
                            timestamp=datetime.utcnow(),
                            price=new_price,
                            bid=new_price * 0.999,
                            ask=new_price * 1.001,
                            volume=current_tick.volume,
                            high_24h=max(current_tick.high_24h or 0, new_price),
                            low_24h=min(current_tick.low_24h or float('inf'), new_price),
                            change_24h=new_price - base_prices.get(symbol, new_price),
                            change_24h_pct=((new_price - base_prices.get(symbol, new_price)) / base_prices.get(symbol, new_price)) * 100
                        )
                        
                        await self.update_price(symbol, updated_tick)
                
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Price simulator error: {e}")
                await asyncio.sleep(5)
    
    async def update_price(self, symbol: str, tick: MarketTick):
        """Update price and notify subscribers"""
        self.current_prices[symbol] = tick
        
        # Notify subscribers
        if symbol in self.subscribers:
            for callback in self.subscribers[symbol]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(tick)
                    else:
                        callback(tick)
                except Exception as e:
                    logger.error(f"Error notifying subscriber: {e}")
    
    async def start_data_persistence(self):
        """Persist market data to database"""
        while self.running:
            try:
                # Save current market data snapshots
                db = SessionLocal()
                
                for symbol, tick in self.current_prices.items():
                    snapshot = MarketDataSnapshot(
                        symbol=symbol,
                        exchange="binance",
                        timestamp=tick.timestamp,
                        close_price=tick.price,
                        bid_price=tick.bid,
                        ask_price=tick.ask,
                        volume=tick.volume,
                        high_price=tick.high_24h,
                        low_price=tick.low_24h,
                        spread=tick.ask - tick.bid if tick.ask and tick.bid else None,
                        data_source="websocket"
                    )
                    
                    db.add(snapshot)
                
                db.commit()
                db.close()
                
                # Save every 10 seconds
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"Data persistence error: {e}")
                await asyncio.sleep(30)


class MarketDataManager:
    """Singleton market data manager"""
    
    _instance: Optional['MarketDataManager'] = None
    _service: Optional[MarketDataService] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    async def get_service(cls) -> MarketDataService:
        """Get or create market data service"""
        if cls._service is None:
            cls._service = MarketDataService()
            # Start service in background task
            asyncio.create_task(cls._service.start())
        return cls._service
    
    @classmethod
    async def stop_service(cls):
        """Stop market data service"""
        if cls._service:
            await cls._service.stop()
            cls._service = None


# Global market data service instance
market_data_service = MarketDataService()


async def get_market_data_service() -> MarketDataService:
    """Dependency injection for market data service"""
    return await MarketDataManager.get_service()


async def get_real_time_price(symbol: str) -> Optional[float]:
    """Get real-time price for a symbol"""
    service = await get_market_data_service()
    tick = service.get_current_price(symbol)
    return tick.price if tick else None


async def get_order_book_data(symbol: str) -> Optional[Dict[str, Any]]:
    """Get order book data for a symbol"""
    service = await get_market_data_service()
    order_book = service.get_order_book(symbol)
    
    if order_book:
        return {
            "symbol": order_book.symbol,
            "timestamp": order_book.timestamp.isoformat(),
            "best_bid": order_book.best_bid.price if order_book.best_bid else None,
            "best_ask": order_book.best_ask.price if order_book.best_ask else None,
            "spread": order_book.spread,
            "bids": [(level.price, level.size) for level in order_book.bids[:10]],  # Top 10
            "asks": [(level.price, level.size) for level in order_book.asks[:10]]   # Top 10
        }
    
    return None