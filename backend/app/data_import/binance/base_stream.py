from abc import ABC, abstractmethod
import asyncio
import json
from websockets import connect
from datetime import datetime
import pytz
import os

class BaseBinanceStream(ABC):
    def __init__(self, symbol, trades_file, websocket_url, channel='@aggTrade'):
        self.symbol = symbol
        self.trades_file = trades_file
        self.websocket_url = websocket_url
        self.uri = f'{websocket_url}/ws/{symbol}{channel}'

    def get_display_symbol(self):
        """
        Returns a display-friendly symbol by converting it to uppercase and
        stripping the 'USDT' substring.
        """
        return self.symbol.upper().replace('USDT', '')

    def format_time(self, timestamp_ms=None):
        """
        Returns a formatted time string in the US/Central timezone.
        If a timestamp in milliseconds is provided it converts that value;
        otherwise, it returns the current time.
        """
        cent = pytz.timezone('US/Central')
        if timestamp_ms is not None:
            return datetime.fromtimestamp(timestamp_ms / 1000, cent).strftime('%I:%M:%S%p')
        else:
            return datetime.now(cent).strftime('%I:%M:%S%p')

    def parse_trade_message(self, msg):
        """
        Parses a JSON string from the Binance WebSocket and returns a dictionary
        with common trade fields.
        """
        try:
            data = json.loads(msg)
            return {
                'event_time': int(data['E']),
                'symbol': data['s'],
                'agg_trade_id': int(data.get('a', 0)),
                'price': float(data['p']),
                'quantity': float(data['q']),
                'first_trade_id': int(data.get('f', 0)),
                'trade_time': int(data.get('T', 0)),
                'is_buyer_maker': data['m']
            }
        except Exception as e:
            print("Error parsing message:", e)
            return None

    def parse_mark_price_message(self, msg):
        """
        Parses a JSON string from Binance's mark price WebSocket and returns a dictionary
        with the relevant mark price and funding rate fields.
        """
        try:
            if isinstance(msg, dict):
                data = msg
            else:
                data = json.loads(msg)
            return {
                'event_time': int(data['E']),
                'symbol': data['s'],
                'mark_price': float(data['p']),
                'funding_rate': float(data['r'])
            }
        except Exception as e:
            print("Error parsing mark price message:", e)
            return None

    async def run(self):
        async with connect(self.uri) as ws:
            await self.handle_connection(ws)

    @abstractmethod
    async def handle_connection(self, ws):
        """Override this in subclasses to process incoming trades."""
        pass

    def get_output_file_path(self):
        # Define the output folder relative to the project root (adjust if needed)
        output_dir = os.path.join(os.getcwd(), 'binance', 'output files')
        os.makedirs(output_dir, exist_ok=True)
        return os.path.join(output_dir, self.trades_file) 