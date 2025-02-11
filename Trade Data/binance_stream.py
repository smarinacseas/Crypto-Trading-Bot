import asyncio
import json
import os
from datetime import datetime
import pytz
import aiohttp  # for REST API calls to Binance
from websockets import connect
from termcolor import cprint


class BinanceTradeStream:
    """
    Encapsulates the websocket connection and stream processing for a single Binance asset.
    """

    def __init__(self, symbol, trades_file, min_display, bold_amt, color_amt, websocket_url):
        self.symbol = symbol
        self.trades_file = trades_file
        self.min_display = min_display
        self.bold_amt = bold_amt
        self.color_amt = color_amt
        self.websocket_url = websocket_url
        self.uri = f'{self.websocket_url}/ws/{self.symbol}@aggTrade'

    async def start(self):
        """
        Connects to the Binance WebSocket for this asset and processes the trade stream.
        """
        async with connect(self.uri) as ws:
            while True:
                try:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    event_time = int(data['E'])
                    asset_symbol = data['s']
                    agg_trade_id = int(data['a'])
                    price = float(data['p'])
                    quantity = float(data['q'])
                    first_trade_id = int(data['f'])
                    trade_time = int(data['T'])
                    is_buyer_maker = data['m']
                    cent = pytz.timezone('US/Central')
                    readable_time = datetime.fromtimestamp(event_time / 1000, cent).strftime('%I:%M:%S%p')
                    usd_size = price * quantity
                    display_symbol = asset_symbol.upper().replace('USDT', '')

                    if usd_size >= self.min_display:
                        trade_type = 'SELL' if is_buyer_maker else 'BUY'

                        # Bold formatting if total exceeds bold threshold
                        attrs = []
                        if usd_size >= self.bold_amt:
                            attrs.append("bold")

                        # Use alternate colors if above the color threshold; else default colors
                        if usd_size >= self.color_amt:
                            color = "magenta" if trade_type == "SELL" else "blue"
                        else:
                            color = "red" if trade_type == "SELL" else "green"

                        # Fixed-width output formatting:
                        # Time (10 chars), Symbol (4 chars), TradeType (5 chars),
                        # Price (12 chars) and Total (10 chars)
                        price_str = f"@${price:,.2f}"
                        total_str = f"({usd_size:,.0f})"
                        output = (f"{readable_time:<10} "
                                  f"{display_symbol:<4} "
                                  f"{trade_type:<5} "
                                  f"{price_str:>12} "
                                  f"{total_str:>10}")
                        cprint(output, "white", "on_" + color, attrs=attrs)

                        with open(self.trades_file, 'a') as f:
                            f.write(f'{readable_time}, {asset_symbol.upper()}, {agg_trade_id}, '
                                    f'{price}, {first_trade_id}, {trade_time}, {is_buyer_maker}\n')
                except Exception as e:
                    print(f'Error: {e}')
                    await asyncio.sleep(1)


class BinanceStreamManager:
    """
    Orchestrates the entire process:
      - Retrieves high-volume assets and prompts user for asset selection.
      - Prompts for threshold values for formatting.
      - Starts multiple BinanceTradeStream tasks.
      - Handles graceful termination.
    """

    def __init__(self, trades_file='binance_trades.csv', websocket_url='wss://stream.binance.com:9443'):
        self.trades_file = trades_file
        self.websocket_url = websocket_url
        # Ensure the CSV file exists for logging
        if not os.path.exists(self.trades_file):
            with open(self.trades_file, 'w') as f:
                f.write('Event Time, Symbol, Aggregate Trade ID, Price, Quantity, First Trade ID, Trade Time, Is Buyer Maker\n')

    async def get_top_volume_assets(self, limit=10):
        """
        Retrieve the top USDT market symbols sorted by 24hr quote volume from Binance API.
        """
        url = "https://api.binance.com/api/v3/ticker/24hr"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
        # Filter symbols that end with 'USDT'
        usdt_markets = [item for item in data if item['symbol'].endswith('USDT')]
        # Sort by quoteVolume (descending)
        usdt_markets.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
        top_markets = usdt_markets[:limit]
        return [market['symbol'].lower() for market in top_markets]

    async def get_user_selected_assets(self):
        """
        Present top market assets and allow the user to select which assets to track.
        """
        top_markets = await self.get_top_volume_assets()
        print("Select assets to track trades for:")
        for idx, market in enumerate(top_markets, 1):
            print(f"{idx}. {market.upper()}")

        selection = await asyncio.to_thread(input,
                                              "Enter comma-separated numbers (or press ENTER for default top 4): ")
        if not selection.strip():
            return top_markets[:4]
        else:
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

    async def get_thresholds(self):
        """
        Prompt the user to enter threshold amounts for trade display formatting.
        Returns:
            tuple: (min_display, bold_amt, color_amt)
        """
        default_min = 10000    # Minimum transaction amount for display
        default_bold = 20000   # Threshold for bold formatting
        default_color = 100000 # Threshold for alternate colors

        min_input = await asyncio.to_thread(input,
                                              "Enter minimum transaction amount for display (default 10000): ")
        try:
            min_display = float(min_input) if min_input.strip() else default_min
        except ValueError:
            print("Invalid input. Using default value for display threshold.")
            min_display = default_min

        bold_input = await asyncio.to_thread(input,
                                               "Enter transaction amount threshold for bold formatting (default 20000): ")
        try:
            bold_amt = float(bold_input) if bold_input.strip() else default_bold
        except ValueError:
            print("Invalid input. Using default value for bold threshold.")
            bold_amt = default_bold

        color_input = await asyncio.to_thread(input,
                                                "Enter transaction amount threshold for different colors (default 100000): ")
        try:
            color_amt = float(color_input) if color_input.strip() else default_color
        except ValueError:
            print("Invalid input. Using default value for color threshold.")
            color_amt = default_color

        return min_display, bold_amt, color_amt

    async def exit_listener(self):
        """
        Waits for user input to signal graceful termination.
        """
        await asyncio.to_thread(input, "Press ENTER to quit...\n")

    async def run(self):
        """
        Main orchestration:
          - Asset selection and threshold input.
          - Create and start trade stream tasks.
          - Handle graceful shutdown on user signal.
        """
        selected_assets = await self.get_user_selected_assets()
        print("Tracking assets:", ", ".join(asset.upper() for asset in selected_assets))

        min_display, bold_amt, color_amt = await self.get_thresholds()
        print(f"Using thresholds - Display: {min_display}, Bold: {bold_amt}, Color: {color_amt}")

        # Create stream objects for each selected asset
        streams = [BinanceTradeStream(symbol, self.trades_file, min_display, bold_amt, color_amt, self.websocket_url)
                   for symbol in selected_assets]
        # Create tasks for each stream
        tasks = [asyncio.create_task(stream.start()) for stream in streams]

        # Listen for exit signal
        exit_task = asyncio.create_task(self.exit_listener())
        await exit_task

        print("Terminating trade streams...")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        print("Disconnected from Binance WebSocket. Exiting.")


if __name__ == '__main__':
    manager = BinanceStreamManager()
    try:
        asyncio.run(manager.run())
    except KeyboardInterrupt:
        print("Interrupted by user. Goodbye.") 