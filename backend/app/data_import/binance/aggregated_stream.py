import asyncio
import json
from datetime import datetime
import pytz
from termcolor import cprint
from backend.app.data_import.binance.base_stream import BaseBinanceStream

class AggregatedBinanceStream(BaseBinanceStream):
    def __init__(self, symbol, trades_file, aggregation_interval, baseline_threshold, bold_threshold, color_threshold, websocket_url):
        super().__init__(symbol, trades_file, websocket_url, channel='@aggTrade')
        self.aggregation_interval = aggregation_interval
        self.baseline_threshold = baseline_threshold
        self.bold_threshold = bold_threshold
        self.color_threshold = color_threshold
        self.trade_queue = asyncio.Queue()

    async def handle_connection(self, ws):
        # Start two tasks: one to continuously read trades into a queue,
        # the other to process (aggregate) the queued trades.
        read_task = asyncio.create_task(self.read_trades(ws))
        aggregate_task = asyncio.create_task(self.aggregate_trades())
        await asyncio.gather(read_task, aggregate_task)

    async def read_trades(self, ws):
        while True:
            try:
                msg = await ws.recv()
                # Use the base class helper to parse the message.
                data = self.parse_trade_message(msg)
                if not data:
                    continue
                price = data['price']
                quantity = data['quantity']
                is_buyer_maker = data['is_buyer_maker']
                trade_type = 'SELL' if is_buyer_maker else 'BUY'
                volume = price * quantity
                trade = {
                    'time': data['event_time'],
                    'trade_type': trade_type,
                    'price': price,
                    'quantity': quantity,
                    'volume': volume
                }
                await self.trade_queue.put(trade)
            except Exception as e:
                print(f'Error in read_trades: {e}')
                await asyncio.sleep(1)

    async def aggregate_trades(self):
        bucket_start = asyncio.get_running_loop().time()
        agg_data = {
            'BUY': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
            'SELL': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
        }
        while True:
            try:
                now = asyncio.get_running_loop().time()
                timeout = self.aggregation_interval - (now - bucket_start)
                if timeout <= 0:
                    break
                trade = await asyncio.wait_for(self.trade_queue.get(), timeout=timeout)
                ttype = trade['trade_type']
                agg_data[ttype]['volume'] += trade['volume']
                agg_data[ttype]['quantity'] += trade['quantity']
                agg_data[ttype]['count'] += 1
            except asyncio.TimeoutError:
                break
            except Exception as e:
                print(f'Error in aggregation: {e}')
                continue

        # Use the base class helper to format the current time.
        bucket_end_time = self.format_time()
        for ttype in ['BUY', 'SELL']:
            vol = agg_data[ttype]['volume']
            if vol >= self.baseline_threshold:
                qty = agg_data[ttype]['quantity']
                count = agg_data[ttype]['count']
                avg_price = vol / qty if qty else 0
                attrs = []
                if vol >= self.bold_threshold:
                    attrs.append("bold")
                if vol >= self.color_threshold:
                    color = "blue" if ttype == "BUY" else "magenta"
                else:
                    color = "green" if ttype == "BUY" else "red"
                output = (f"{bucket_end_time:<10} "
                          f"{self.get_display_symbol():<4} "
                          f"{ttype:<5} "
                          f"{qty:>4.0f} "
                          f"@${avg_price:>12,.2f} "
                          f"(${vol:>10,.0f}) "
                          f"({count} trades)")
                cprint(output, "white", "on_" + color, attrs=attrs)
                output_path = self.get_output_file_path()
                with open(output_path, 'a') as f:
                    f.write(f"{bucket_end_time}, {self.get_display_symbol()}, {ttype}, {qty}, {avg_price}, {vol}, {count}\n") 