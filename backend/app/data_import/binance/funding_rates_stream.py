import asyncio
from termcolor import cprint
from backend.app.data_import.binance.base_stream import BaseBinanceStream


class FundingRatesStream(BaseBinanceStream):
    def __init__(self, symbol, trades_file, websocket_url):
        # Call BaseBinanceStream with channel set to '@markPrice'
        super().__init__(symbol, trades_file, websocket_url, channel='@markPrice')
        # Initialize a separate queue for funding rate messages
        self.rate_queue = asyncio.Queue()

    async def handle_connection(self, ws):
        # Start two tasks: one for reading funding rate messages from the websocket,
        # and another for processing (formatting, displaying, logging) the messages.
        read_task = asyncio.create_task(self.read_funding_rates(ws))
        process_task = asyncio.create_task(self.process_funding_rates())
        await asyncio.gather(read_task, process_task)

    async def read_funding_rates(self, ws):
        while True:
            try:
                msg = await ws.recv()
                data = self.parse_mark_price_message(msg)
                if not data:
                    print(f"Error parsing message: {msg}")
                    continue
                await self.rate_queue.put(data)
            except Exception as e:
                print(f"Error reading funding rates: {e}")
                await asyncio.sleep(1)

    async def process_funding_rates(self):
        while True:
            try:
                data = await self.rate_queue.get()
                event_time = self.format_time(data.get('event_time', 0))
                display_symbol = data.get('symbol', 'N/A').replace('USDT', '')
                mark_price = data.get('mark_price', 0)
                funding_rate = data.get('funding_rate', 0)
                annualized_rate = funding_rate * 3 * 365 * 100  # Funding rate every 8 hours

                if annualized_rate > 50:
                    text_color, bg_color = 'black', 'on_red'
                elif annualized_rate > 30:
                    text_color, bg_color = 'black', 'on_yellow'
                elif annualized_rate > 5:
                    text_color, bg_color = 'black', 'on_cyan'
                elif annualized_rate < -10:
                    text_color, bg_color = 'black', 'on_green'
                else:
                    text_color, bg_color = 'black', 'on_light_green'

                output_line = f"{event_time:<10} {display_symbol:<4} ${mark_price:>7,.2f} ({funding_rate:>5,.4f}% / {annualized_rate:>6,.2f}%)"
                cprint(output_line, text_color, bg_color)

                output_path = self.get_output_file_path()
                with open(output_path, 'a') as f:
                    f.write(f"{event_time}, {display_symbol}, {mark_price}, {funding_rate}, {annualized_rate}\n")
            except Exception as e:
                print(f"Error processing funding rate: {e}")
                await asyncio.sleep(1)