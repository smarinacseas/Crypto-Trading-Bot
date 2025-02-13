import asyncio
from termcolor import cprint
from backend.app.data_import.binance.base_stream import BaseBinanceStream

class LiquidationsStream(BaseBinanceStream):
    def __init__(self, symbol, trades_file, websocket_url):
        # Call BaseBinanceStream with channel set to '@forceOrder'
        super().__init__(symbol, trades_file, websocket_url, channel='@forceOrder')
        # Initialize a separate queue for liquidation messages
        self.liquidation_queue = asyncio.Queue()

    async def handle_connection(self, ws):
        # Start two tasks: one for reading liquidation messages from the websocket,
        # and another for processing (formatting, displaying, logging) the messages.
        read_task = asyncio.create_task(self.read_liquidations(ws))
        process_task = asyncio.create_task(self.process_liquidations())
        await asyncio.gather(read_task, process_task)

    async def read_liquidations(self, ws):
        while True:
            try:
                msg = await ws.recv()
                data = self.parse_liquidation_message(msg)
                if not data:
                    print(f"Error parsing message: {msg}")
                    continue
                await self.liquidation_queue.put(data)
            except Exception as e:
                print(f"Error reading liquidations: {e}")
                await asyncio.sleep(1)

    async def process_liquidations(self):
        while True:
            try:
                data = await self.liquidation_queue.get()
                if not data:
                    continue
                display_symbol = data.get('symbol', 'N/A').replace('USDT', '')
                side = data.get('side', 'N/A')
                order_type = data.get('order_type', 'N/A')
                time_in_force = data.get('time_in_force', 'N/A')
                og_quantity = data.get('og_quantity', 0)
                price = data.get('price', 0)
                avg_price = data.get('avg_price', price)
                order_status = data.get('order_status', 'N/A')
                last_filled_quantity = data.get('last_filled_quantity', 0)
                quantity = data.get('filled_quantity', 0)
                trade_time = self.format_time(data.get('trade_time', 'N/A'))
                
                usd_size = price * quantity

                output_line = f"{trade_time:<10} {display_symbol:<4} {side:<5} ${price:>7,.2f} {quantity:>7,.2f}"
                if usd_size > 1:
                    liq_type = 'L_LIQ' if side == 'SELL' else 'S_LIQ'
                    color = 'green' if side == 'SELL' else 'red'
                    attrs = ['bold'] if usd_size > 10000 else []
                    if usd_size > 100000:
                        attrs.append('blink')
                else:
                    liq_type = ''
                    color = 'white'
                    attrs = []

                output_line = f"{trade_time:<10} {liq_type:<5} {display_symbol:<4} {side:<5} Price: ${price:>7,.2f} USD Size: {usd_size:>8,.2f}"
                cprint(output_line, 'white', f'on_{color}', attrs=attrs)

                output_path = self.get_output_file_path()

                with open(output_path, 'a') as f:
                    f.write(f"{display_symbol}, {side}, {order_type}, {time_in_force}, {og_quantity}, {avg_price}, {order_status}, {last_filled_quantity}/{quantity}, {trade_time}\n")
            except Exception as e:
                print(f"Error processing liquidation: {e}")
                await asyncio.sleep(1)