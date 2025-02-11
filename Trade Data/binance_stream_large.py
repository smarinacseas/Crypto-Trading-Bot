import asyncio
import json
import os
from datetime import datetime
import pytz
import aiohttp  # for REST API calls to Binance
from websockets import connect
from termcolor import cprint


class BinanceLargeTradeStream:
    """
    Aggregates trades for a given asset over a specified time interval.
    
    Continously receives aggregated trade data from Binance’s WebSocket and
    groups trades into buckets (e.g., every 5 seconds) to provide an overview
    of the aggregated BUY/SELL volume.
    """

    def __init__(self, symbol, trades_file, aggregation_interval,
                 baseline_threshold, bold_threshold, color_threshold, websocket_url):
        self.symbol = symbol
        self.trades_file = trades_file
        self.aggregation_interval = aggregation_interval  # in seconds
        self.baseline_threshold = baseline_threshold  # standard threshold (USD)
        self.bold_threshold = bold_threshold          # threshold for bold formatting (USD)
        self.color_threshold = color_threshold        # threshold for alternate color (USD)
        self.websocket_url = websocket_url
        self.uri = f'{self.websocket_url}/ws/{self.symbol}@aggTrade'
        self.trade_queue = asyncio.Queue()

    async def read_trades(self):
        """
        Connects to the Binance WebSocket and enqueues each trade message
        into self.trade_queue.
        """
        async with connect(self.uri) as ws:
            while True:
                try:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    # Extract and process trade data
                    event_time = int(data['E'])
                    price = float(data['p'])
                    quantity = float(data['q'])
                    is_buyer_maker = data['m']
                    # Determine trade type: if is_buyer_maker is True then it's a SELL, else BUY.
                    trade_type = 'SELL' if is_buyer_maker else 'BUY'
                    volume = price * quantity

                    # Enqueue a simplified trade dict with the needed info.
                    trade = {
                        'time': event_time,
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
        """
        Groups trades arriving in the queue over self.aggregation_interval seconds.
        
        For each bucket, if the aggregated volume for BUY or SELL trades exceeds 
        the baseline threshold, output a summary line with fixed-column formatting.
        """
        while True:
            bucket_start = asyncio.get_event_loop().time()
            # Initialize accumulators for BUY and SELL trades
            agg_data = {
                'BUY': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
                'SELL': {'volume': 0.0, 'quantity': 0.0, 'count': 0},
            }
            # Collect trades for the duration of the aggregation interval
            while True:
                try:
                    now = asyncio.get_event_loop().time()
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
                    break

            # Determine the bucket end time (using Central Time)
            bucket_end_time = datetime.now(pytz.timezone('US/Central')).strftime('%I:%M:%S%p')
            
            # Process aggregated data for each side
            for ttype in ['BUY', 'SELL']:
                vol = agg_data[ttype]['volume']
                if vol >= self.baseline_threshold:
                    qty = agg_data[ttype]['quantity']
                    count = agg_data[ttype]['count']
                    # Calculate average price if quantity > 0
                    avg_price = vol / qty if qty else 0
                    
                    # Determine formatting based on thresholds
                    attrs = []
                    if vol >= self.bold_threshold:
                        attrs.append("bold")
                    if vol >= self.color_threshold:
                        # Alternate color for massive volumes: blue for BUY, magenta for SELL
                        color = "blue" if ttype == "BUY" else "magenta"
                    else:
                        # Baseline colors: green for BUY, red for SELL
                        color = "green" if ttype == "BUY" else "red"
                    
                    # Fixed-width output: Time (10 chars), Symbol (4 chars), TradeType (5 chars),
                    # Aggregated Quantity (4 chars), Average Price (12 chars), Total Volume (10 chars),
                    # and count of trades.
                    output = (f"{bucket_end_time:<10} "
                              f"{self.symbol.upper():<4} "
                              f"{ttype:<5} "
                              f"{qty:>4.0f} "
                              f"@${avg_price:>12,.2f} "
                              f"(${vol:>10,.0f}) "
                              f"({count} trades)")
                    
                    cprint(output, "white", "on_" + color, attrs=attrs)
                    
                    # Log the aggregated data to the file
                    with open(self.trades_file, 'a') as f:
                        f.write(f"{bucket_end_time}, {self.symbol.upper()}, {ttype}, {qty}, {avg_price}, {vol}, {count}\n")
            # End of bucket; then loop and start a new bucket

    async def start(self):
        """
        Runs the trade reader and aggregator concurrently.
        """
        read_task = asyncio.create_task(self.read_trades())
        aggregate_task = asyncio.create_task(self.aggregate_trades())
        await asyncio.gather(read_task, aggregate_task)


class BinanceLargeStreamManager:
    """
    Orchestrates aggregated trade streaming for multiple assets.
    
    It prompts the user for asset selection and an aggregation interval,
    then creates a BinanceLargeTradeStream for each asset and manages
    graceful shutdown.
    """

    def __init__(self, trades_file='binance_trades_large.csv', websocket_url='wss://stream.binance.com:9443'):
        self.trades_file = trades_file
        self.websocket_url = websocket_url
        # Ensure log file exists
        if not os.path.exists(self.trades_file):
            with open(self.trades_file, 'w') as f:
                f.write('Bucket End Time, Symbol, Trade Type, Aggregated Quantity, Average Price, Total Volume, Trade Count\n')

    async def get_top_volume_assets(self, limit=10):
        """
        Retrieve the top USDT market symbols sorted by 24hr quote volume.
        """
        url = "https://api.binance.com/api/v3/ticker/24hr"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
        # Filter symbols ending with USDT and sort them
        usdt_markets = [item for item in data if item['symbol'].endswith('USDT')]
        usdt_markets.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
        top_markets = usdt_markets[:limit]
        return [market['symbol'].lower() for market in top_markets]

    async def get_user_selected_assets(self):
        """
        Prompts the user to select assets from the top volume list.
        """
        top_markets = await self.get_top_volume_assets()
        print("Select assets for aggregated large trade stream:")
        for idx, market in enumerate(top_markets, 1):
            print(f"{idx}. {market.upper()}")
        selection = await asyncio.to_thread(input,
                                              "Enter comma-separated numbers (or press ENTER for default top 4): ")
        if not selection.strip():
            return top_markets[:4]
        try:
            indices = [int(i.strip()) - 1 for i in selection.split(",") if i.strip().isdigit()]
            selected = [top_markets[i] for i in indices if 0 <= i < len(top_markets)]
            if not selected:
                print("No valid selection, using default top 4.")
                return top_markets[:4]
            return selected
        except Exception as e:
            print(f"Selection error: {e}, using default top 4.")
            return top_markets[:4]

    async def get_aggregation_interval(self):
        """
        Prompts the user to enter an aggregation interval in seconds.
        Default is 5 seconds.
        """
        interval_input = await asyncio.to_thread(input,
                                                   "Enter aggregation interval in seconds (default 5): ")
        try:
            interval = float(interval_input) if interval_input.strip() else 5.0
        except ValueError:
            print("Invalid input. Using default aggregation interval of 5 seconds.")
            interval = 5.0
        return interval

    async def run(self):
        """
        Main orchestration for the aggregated trade streams.
        """
        selected_assets = await self.get_user_selected_assets()
        print("Aggregating trades for assets:", ", ".join(asset.upper() for asset in selected_assets))

        aggregation_interval = await self.get_aggregation_interval()
        print(f"Using aggregation interval: {aggregation_interval} seconds")

        # Set aggregated volume thresholds (in USD)
        baseline_threshold = 100_000  # minimum volume to display summary
        bold_threshold = 300_000      # added bold formatting if exceeded
        color_threshold = 500_000     # alternate color if exceeded

        # Create aggregator streams for each selected asset
        streams = [
            BinanceLargeTradeStream(symbol, self.trades_file, aggregation_interval,
                                    baseline_threshold, bold_threshold, color_threshold,
                                    self.websocket_url)
            for symbol in selected_assets
        ]
        tasks = [asyncio.create_task(stream.start()) for stream in streams]

        # Wait for an exit signal (ENTER)
        exit_task = asyncio.create_task(asyncio.to_thread(input, "Press ENTER to quit aggregated stream...\n"))
        await exit_task

        print("Terminating aggregated trade streams...")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        print("Disconnected from Binance WebSocket aggregation. Exiting.")


if __name__ == '__main__':
    manager = BinanceLargeStreamManager()
    try:
        asyncio.run(manager.run())
    except KeyboardInterrupt:
        print("Interrupted by user. Goodbye.")