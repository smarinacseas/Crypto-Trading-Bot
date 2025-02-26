import ccxt
import os
import schedule  # Optional: schedule tasks if needed
import time
import logging

# This skeleton demonstrates some important trading actions via the CCXT library using the MEXC exchange as an example.
# For more details, see the CCXT Private API documentation:
# https://docs.ccxt.com/#/README?id=private-api

# Example symbol (MEXC): SOLUSDT

class Executor:
    def __init__(self, exchange_name):
        """
        Initialize the Executor.
        - Fetch API credentials from environment variables using the pattern:
          {EXCHANGE_NAME}_API_KEY and {EXCHANGE_NAME}_SECRET_KEY.
        - Sets up the exchange instance via initialize_exchange().
        """
        self.exchange_name = exchange_name.upper()
        self.api_key = os.getenv(f"{self.exchange_name}_API_KEY")
        self.secret = os.getenv(f"{self.exchange_name}_SECRET_KEY")
        if not self.api_key or not self.secret:
            raise EnvironmentError(f"{self.exchange_name} API credentials not set in environment variables.")
        self.initialize_exchange()

    def initialize_exchange(self):
        """
        Dynamically initialize the ccxt exchange instance.
        - For example, for MEXC we use ccxt.mexc.
        - Relies on CCXT's dynamic loading of exchange modules.
        """
        try:
            # ccxt uses lowercase exchange ids.
            exchange_id = self.exchange_name.lower()
            if not hasattr(ccxt, exchange_id):
                raise ValueError(f"Exchange '{exchange_id}' is not supported by ccxt.")
            ExchangeClass = getattr(ccxt, exchange_id)
            self.exchange = ExchangeClass({
                'enableRateLimit': True,
                'apiKey': self.api_key,
                'secret': self.secret,
            })
        except Exception as e:
            print(f"Exchange initialization error: {e}")
            raise

    def fetch_balance(self, meaningful_only=False, threshold=0.1):
        """
        Fetch wallet balance using ccxt.fetch_balance().
        - Optionally filter only assets with a balance > threshold.
        - Note: MEXC returns a dictionary with keys like 'total' and 'free'.
        """
        try:
            balance = self.exchange.fetch_balance()
            totals = balance.get('total', {})
            if meaningful_only:
                filtered = {asset: amt for asset, amt in totals.items() if amt > threshold}
                output = "\n".join(f"{asset}: {amt}" for asset, amt in filtered.items()) if filtered else "No meaningful balances found."
                message = f"Meaningful balances (>{threshold}):\n{output}"
            else:
                output = "\n".join(f"{asset}: {amt}" for asset, amt in totals.items()) if totals else "No balances found."
                message = f"All balances:\n{output}"
            print(message)
            return message
        except Exception as e:
            error_message = f"Error fetching balance: {e}"
            print(error_message)
            return error_message

    def create_order(self, symbol, order_type, side, amount, price=None, params=None):
        """
        Create an order via ccxt.create_order().
        - Wraps the MEXC API call; relies on CCXT to sign and handle errors.
        - Supports both market and limit orders.
        """
        try:
            if params is None:
                params = {}
            order = self.exchange.create_order(
                symbol=symbol,
                type=order_type,
                side=side,
                amount=amount,
                price=price,
                params=params
            )
            order_id = order.get('id', 'N/A')
            message = f"Order Created: {order_id} for {amount} {symbol} at {price} ({order_type} {side})"
            print(message)
            return message
        except Exception as e:
            error_message = f"Error creating order for {symbol}: {e}"
            print(error_message)
            return error_message

    def fetch_open_orders(self, symbol):
        """
        Retrieve open orders for the specified symbol.
        - Uses the exchange's API (MEXC supports this with fetchOpenOrders).
        - Formats the orders into a human-readable string.
        """
        try:
            orders = self.exchange.info.open_orders(self.address)
            if orders:
                output = "\n".join(
                    f"Order ID: {order.get('oid', 'N/A')}, "
                    f"Coin: {order.get('coin', 'N/A')}, "
                    f"Side: {'Buy' if order.get('side') == 'A' else 'Sell'}, "
                    f"Size: {order.get('sz', 'N/A')}, "
                    f"Limit Price: {order.get('limitPx', 'N/A')}, "
                    f"Timestamp: {order.get('timestamp', 'N/A')}"
                    for order in orders if order.get('coin') == symbol
                )
                message = f"Open Orders for {symbol}:\n{output}"
            else:
                message = f"No open orders for {symbol}."
            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error fetching open orders: {e}"
            logging.error(error_message)
            return error_message

    def cancel_all_orders(self, symbol):
        """
        Cancel all orders for the given symbol.
        - Leverages ccxt.cancel_all_orders(), which MEXC supports.
        - Builds a summary string from the response.
        """
        try:
            cancelled_orders = self.exchange.cancel_all_orders(symbol)
            if cancelled_orders:
                order_details = []
                for order in cancelled_orders:
                    order_info = (
                        f"ID: {order.get('id', 'N/A')}, "
                        f"Symbol: {order.get('symbol', 'N/A')}, "
                        f"Amount: {order.get('amount', 'N/A')}, "
                        f"Price: {order.get('price', 'N/A')}, "
                        f"{order.get('type', 'N/A')} {order.get('side', 'N/A')}"
                    )
                    order_details.append(order_info)
                message = f"Cancelled orders for {symbol}:\n" + "\n".join(order_details)
            else:
                message = f"No open orders to cancel for {symbol}."
            print(message)
            return message
        except Exception as e:
            error_message = f"Error canceling orders for {symbol}: {e}"
            print(error_message)
            return error_message

    def set_leverage(self, leverage, symbol, params=None):
        """
        Set the leverage for the specified symbol.
        - Uses ccxt.set_leverage if available (MEXC supports this).
        - Returns the result or a message if unsupported.
        """
        try:
            if params is None:
                params = {}
            if hasattr(self.exchange, 'set_leverage'):
                result = self.exchange.set_leverage(leverage, symbol, params)
                message = f"Leverage set to {leverage} for {symbol}. Result: {result}"
            else:
                message = f"set_leverage method not supported by {self.exchange_name}."
            print(message)
            return message
        except Exception as e:
            error_message = f"Error setting leverage for {symbol}: {e}"
            print(error_message)
            return error_message

    def create_perpetual_futures_order(self, symbol, order_type, side, amount, price=None, params=None, leverage=None):
        """
        Create a perpetual futures order.
        - Sets leverage if provided.
        - Uses additional parameters (like 'contractType': 'perpetual') required by MEXC for derivatives.
        """
        try:
            if leverage is not None:
                self.set_leverage(leverage, symbol, params)
            if params is None:
                params = {'contractType': 'perpetual'}
            else:
                params.setdefault('contractType', 'perpetual')
            order = self.exchange.create_order(
                symbol=symbol,
                type=order_type,
                side=side,
                amount=amount,
                price=price,
                params=params
            )
            order_id = order.get('id', 'N/A')
            message = (f"Perpetual Futures Order Created: ID {order_id} for {symbol} at {price} "
                       f"(Type: {order_type}, Side: {side}, Leverage: {leverage if leverage is not None else 'Default'})")
            print(message)
            return message
        except Exception as e:
            error_message = f"Error creating perpetual futures order for {symbol}: {e}"
            print(error_message)
            return error_message

    def execute_trade_cycle(self, symbol='SOL/USDT', order_type='limit', side='sell', amount=0.01, price=5000, params=None):
        """
        Execute a full cycle of trade operations for the given symbol.
        
        The cycle includes:
          1. Fetching account balance.
          2. Placing an order of the specified type.
          3. Retrieving open orders.
          4. Waiting for a brief period.
          5. Canceling all orders for the symbol.
        
        Returns a formatted summary of the actions taken.
        """
        summary = [f"Executing trade cycle for {symbol} with order type '{order_type}'."]
        summary.append(self.fetch_balance())
        if params is None:
            params = {'triggerPrice': 1000}
        summary.append(self.create_order(symbol, order_type, side, amount, price, params))
        summary.append(self.fetch_open_orders(symbol))
        time.sleep(10)
        summary.append(self.cancel_all_orders(symbol))
        final_summary = "\n".join(summary)
        print(final_summary)
        return final_summary

    def open_positions(self, symbol):
        """
        Retrieve open position details for a given symbol.
        - Uses ccxt.fetch_positions() which MEXC supports.
        - Parses the response and returns a tuple:
          (positions, openpos_bool, position_size, is_long, index).
        - Assumes one position per symbol.
        """
        try:
            # For futures positions, additional parameters may be required (e.g., 'type': 'swap', 'code': 'USD').
            params = {'type': 'swap', 'code': 'USD'}
            positions = self.exchange.fetch_positions([symbol], params)
            if positions and len(positions) > 0:
                position = positions[0]  # Assumes one position per symbol.
                if "contracts" in position:
                    pos_size = float(position.get("contracts", 0))
                elif "positionAmt" in position:
                    pos_size = float(position.get("positionAmt", 0))
                else:
                    pos_size = 0.0
                openpos_bool = pos_size != 0
                side_field = position.get("side", "").lower()
                if side_field in ['buy', 'long']:
                    is_long = True
                elif side_field in ['sell', 'short']:
                    is_long = False
                else:
                    is_long = None
                return (positions, openpos_bool, abs(pos_size), is_long, 0)
            else:
                return ([], False, 0, None, None)
        except Exception as e:
            logging.error(f"Error fetching open positions for {symbol}: {e}")
            return (None, False, 0, None, None)

    def ask_bid(self, symbol):
        """
        Helper method to retrieve the current ask and bid from the order book.
        - Uses ccxt.fetch_order_book(), which MEXC supports.
        - Returns ask and bid prices as floats.
        """
        try:
            order_book = self.exchange.fetch_order_book(symbol)
            ask = order_book['asks'][0][0] if order_book.get('asks') and len(order_book['asks']) > 0 else None
            bid = order_book['bids'][0][0] if order_book.get('bids') and len(order_book['bids']) > 0 else None
            return ask, bid
        except Exception as e:
            print(f"Error fetching ask/bid for {symbol}: {e}")
            return None, None

    def kill_switch(self, symbol):
        """
        Kill switch to cancel all open orders and close the open position for the given symbol.
        - Handles futures positions via fetch_positions and spot positions via fetch_balance.
        - For spot positions, obtains the base currency from market info.
        - Uses ask_bid() to obtain order book prices, then creates an order to exit the position.
        - Loops until the position is closed.
        """
        try:
            print(f"Starting the kill switch for {symbol}")
            # Check futures positions first.
            positions, openpos, kill_size, is_long, _ = self.open_positions(symbol)
            is_futures = openpos and kill_size > 0
            if not is_futures:
                # For spot, determine the base currency and current free balance.
                try:
                    market = self.exchange.market(symbol)
                    if not isinstance(market, dict):
                        raise ValueError(f"Market info for {symbol} is not a dict: {market}")
                    base_currency = market['base']
                except Exception as e:
                    print(f"Error fetching market info for {symbol}: {e}")
                    base_currency = symbol.split('/')[0]
                balance = self.exchange.fetch_balance()
                if not isinstance(balance, dict):
                    raise ValueError(f"Balance info is not a dict: {balance}")
                spot_balance = balance.get('free', {}).get(base_currency, 0)
                if spot_balance > 0:
                    openpos = True
                    kill_size = spot_balance
                    is_long = True  # Spot positions assume holding the asset.
                    is_futures = False
                    print(f"Detected spot position for {symbol}: {base_currency} balance = {spot_balance}")
                else:
                    openpos = False

            print(f"Initial position state: openpos={openpos}, kill_size={kill_size}, is_long={is_long}, is_futures={is_futures}")

            while openpos:
                print("Kill switch loop initiated...")
                
                # Cancel open orders before proceeding.
                cancel_response = self.cancel_all_orders(symbol)
                print(f"Cancelled orders for {symbol}. Response: {cancel_response}")

                # Refresh position state.
                if is_futures:
                    _, openpos, kill_size, is_long, _ = self.open_positions(symbol)
                    kill_size = float(kill_size)
                else:
                    balance = self.exchange.fetch_balance()
                    if not isinstance(balance, dict):
                        raise ValueError(f"Balance info is not a dict: {balance}")
                    try:
                        market = self.exchange.market(symbol)
                        if not isinstance(market, dict):
                            raise ValueError(f"Market info for {symbol} is not a dict: {market}")
                        base_currency = market['base']
                    except Exception as e:
                        print(f"Error fetching market info for {symbol}: {e}")
                        base_currency = symbol.split('/')[0]
                    spot_balance = balance.get('free', {}).get(base_currency, 0)
                    openpos = spot_balance > 0
                    kill_size = spot_balance
                    is_long = True  # Spot positions considered as long.
                    print(f"Updated spot position state: openpos={openpos}, kill_size={kill_size}")

                if not openpos:
                    break

                # Retrieve current ask and bid prices from the order book.
                ask, bid = self.ask_bid(symbol)
                if ask is None or bid is None:
                    raise ValueError(f"Invalid order book prices for {symbol}: ask={ask}, bid={bid}")
                print(f"For {symbol}: ask={ask}, bid={bid}")

                try:
                    if is_futures:
                        # For futures, choose side based on whether position is long or short.
                        if is_long:
                            order = self.exchange.create_order(
                                symbol=symbol,
                                type="limit",
                                side="sell",
                                amount=kill_size,
                                price=ask,
                                params={}
                            )
                            print(f"Placed LIMIT SELL order to close long futures position: {order}")
                        else:
                            order = self.exchange.create_order(
                                symbol=symbol,
                                type="limit",
                                side="buy",
                                amount=kill_size,
                                price=bid,
                                params={}
                            )
                            print(f"Placed LIMIT BUY order to close short futures position: {order}")
                    else:
                        # For spot, use our create_order() wrapper to ensure proper parsing.
                        result_message = self.create_order(symbol, "limit", "sell", kill_size, ask, params={})
                        print(f"Placed LIMIT SELL spot order: {result_message}")
                except Exception as e:
                    print(f"Error placing order for {symbol}: {e}")
                    break

                print("Sleeping for 30 seconds to allow order execution...")
                time.sleep(30)

                # Update position state after sleep.
                if is_futures:
                    _, openpos, kill_size, is_long, _ = self.open_positions(symbol)
                    print(f"Updated futures position state: openpos={openpos}, kill_size={kill_size}, is_long={is_long}")
                else:
                    balance = self.exchange.fetch_balance()
                    if not isinstance(balance, dict):
                        raise ValueError(f"Balance info is not a dict: {balance}")
                    try:
                        market = self.exchange.market(symbol)
                        if not isinstance(market, dict):
                            raise ValueError(f"Market info for {symbol} is not a dict: {market}")
                        base_currency = market['base']
                    except Exception as e:
                        print(f"Error fetching market info for {symbol}: {e}")
                        base_currency = symbol.split('/')[0]
                    spot_balance = balance.get('free', {}).get(base_currency, 0)
                    openpos = spot_balance > 0
                    kill_size = spot_balance
                    print(f"Updated spot position state: openpos={openpos}, kill_size={kill_size}")

            print(f"Kill switch executed successfully. Position for {symbol} is closed.")
            return f"Kill switch executed successfully. Position for {symbol} is closed."
        except Exception as e:
            error_msg = f"Error executing kill switch for {symbol}: {e}"
            print(error_msg)
            return error_msg

    def pnl_close(self, symbol, target, max_loss):
        """
        Evaluate the profit or loss (PnL) for the open position on the given symbol and 
        trigger the kill switch if a profit target or maximum loss threshold is reached.
        
        For exit price determination:
          - For a long position, use the bid (i.e. selling at bid).
          - For a short position, use the ask (i.e. buying at ask).
        
        Parameters:
          symbol (str): Trading pair symbol (e.g., 'SOL/USDT').
          target (float): Profit target percentage threshold (e.g., 5 for 5% profit).
          max_loss (float): Maximum loss percentage threshold (e.g., -2 for -2% loss).
        
        Returns a tuple: (pnl_trigger, in_position, position_size, is_long)
        """
        try:
            print(f"Checking to see if it's time to exit for {symbol}...")
            # Retrieve open position details using our helper.
            positions, openpos, pos_size, position_side, index = self.open_positions(symbol)
            if not openpos:
                logging.info(f"No open position found for {symbol}.")
                return (False, False, 0, None)
            position = positions[index]
            entry_price = float(position.get("entryPrice", 0))
            leverage = float(position.get("leverage", 1))
            
            # Retrieve orders book prices.
            ask, bid = self.ask_bid(symbol)
            
            # Determine the effective exit price.
            if position_side is True:
                # For a long position, selling at bid.
                current_price = bid
                is_long = True
            elif position_side is False:
                # For a short position, buying to close at ask.
                current_price = ask
                is_long = False
            else:
                logging.error(f"Unknown position side for {symbol}.")
                return (False, True, pos_size, None)
            
            # Calculate the profit/loss percentage.
            diff = (current_price - entry_price) if is_long else (entry_price - current_price)
            pnl_perc = (diff / entry_price) * leverage * 100.0
            pnl_perc = round(pnl_perc, 2)
            logging.info(f"For {symbol}, current PnL is: {pnl_perc}% (Entry: {entry_price}, Exit: {current_price})")
            
            pnl_trigger = False
            # Trigger kill switch if profit or loss conditions are met.
            if pnl_perc >= target:
                logging.info(f"Profit target reached for {symbol}: {pnl_perc}% ≥ {target}%. Initiating kill switch.")
                pnl_trigger = True
                self.kill_switch(symbol)
            elif pnl_perc <= max_loss:
                logging.info(f"Maximum loss threshold reached for {symbol}: {pnl_perc}% ≤ {max_loss}%. Initiating kill switch.")
                pnl_trigger = True
                self.kill_switch(symbol)
            else:
                logging.info(f"No exit condition met for {symbol}: PnL at {pnl_perc}% (Target: {target}%, Max Loss: {max_loss}%).")
            
            return (pnl_trigger, True, pos_size, is_long)
        except Exception as e:
            logging.error(f"Error in pnl_close for {symbol}: {e}")
            return (False, False, 0, None)


if __name__ == '__main__':
    print("CCXT Automated Trading Skeleton")
    executor = Executor('MEXC')
    executor.execute_trade_cycle()

    # Optional: schedule the trade cycle periodically
    # schedule.every(1).minute.do(lambda: executor.execute_trade_cycle(symbol='SOL/USDT', order_type='limit', side='sell', amount=0.01, price=5000, params={'triggerPrice': 1000}))
    # while True:
    #     try:
    #         schedule.run_pending()
    #         time.sleep(1)
    #     except Exception as e:
    #         print("Error during scheduled execution:", e)
    #         time.sleep(30)


    mexc = ccxt.mexc()