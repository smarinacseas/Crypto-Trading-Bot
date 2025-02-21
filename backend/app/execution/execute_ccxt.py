import ccxt
import os
import schedule  # Optional for scheduled execution
import time
import logging

# This skeleton demonstrates some important trading actions via the CCXT library using the MEXC exchange as an example.
# For more details, see the CCXT Private API documentation:
# https://docs.ccxt.com/#/README?id=private-api

# Example symbol (MEXC): SOLUSDT


class Executor:
    def __init__(self, exchange_name):
        """Initialize the Executor with the given exchange name and its API credentials.
        
        The API key and secret are obtained from environment variables using the pattern:
            {EXCHANGE_NAME}_API_KEY
            {EXCHANGE_NAME}_SECRET_KEY
        For example, for 'MEXC', it will look for MEXC_API_KEY and MEXC_SECRET_KEY.
        """
        self.exchange_name = exchange_name.upper()
        self.api_key = os.getenv(f"{self.exchange_name}_API_KEY")
        self.secret = os.getenv(f"{self.exchange_name}_SECRET_KEY")
        if not self.api_key or not self.secret:
            raise EnvironmentError(f"{self.exchange_name} API credentials not set in environment variables.")
        self.initialize_exchange()

    def initialize_exchange(self):
        """Initialize the ccxt exchange instance based on the exchange name."""
        try:
            # ccxt exchange classes are typically named in lower-case (e.g., ccxt.mexc)
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
            message = f"Exchange initialization error: {e}"
            print(message)
            raise

    def fetch_balance(self, meaningful_only=False, threshold=0.1):
        """
        Fetch the wallet balance from the exchange.
        If meaningful_only is True, only assets with a balance greater than threshold are displayed.
        Returns a formatted message of the balances.
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
        Create an order for the specified symbol with variable settings.
        
        order_type: str - Type of order ('limit', 'market', 'stop', etc.)
        side: str - 'buy' or 'sell'
        amount: float - Order amount
        price: float or None - Order price (may be omitted for market orders)
        params: dict or None - Additional parameters (e.g., triggerPrice for stop orders)
        
        Returns a formatted string with order status.
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
        Retrieve open orders for the user and format them into a readable string.
        """
        try:
            orders = self.exchange.info.open_orders(self.address)
            if orders:
                # Format each order into a readable string
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
        Cancel all orders for the specified symbol.
        Returns a formatted confirmation message.
        """
        try:
            cancelled_orders = self.exchange.cancel_all_orders(symbol)
            if cancelled_orders:
                # Build a human-readable summary for each cancelled order.
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
        Set the leverage for the given symbol.
        
        leverage: int or float - desired leverage
        symbol: str - trading pair symbol
        params: dict or None - additional parameters
        
        Returns a formatted message indicating success or failure.
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
        Create a perpetual futures order for the specified symbol.
        
        order_type: str - Type of order ('limit', 'market', 'stop', etc.)
        side: str - 'buy' or 'sell'
        amount: float - Order amount
        price: float or None - Order price (if omitted for market orders)
        params: dict or None - Additional parameters for the order; defaults to {'contractType': 'perpetual'}
        leverage: int or float or None - Optional leverage setting
        
        Returns a formatted string with the order details.
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

    def kill_switch(self, symbol=None):
        """
        Kill switch to cancel all open orders and close all positions. Iterates until all positions are closed.

        If 'symbol' is provided, the method operates on that symbol only.
        Otherwise, it attempts to fetch positions (if supported) and applies the kill switch for
        each position with a nonzero size.

        The process involves:
          1. Canceling all open orders for the symbol.
          2. Fetching positions (if the exchange supports fetch_positions).
          3. For each position with a nonzero amount:
               - Determining the closing side (sell for long positions, buy for short positions).
               - Issuing a market order to close the position using the full position size.
          4. Waiting briefly and re-checking until no open positions remain.
        
        Returns:
            A string confirmation message if all positions have been closed,
            or an error message if something fails.
        """
        result = {}
        try:
            while True:
                all_closed = True

                if symbol:
                    # Process for a specific symbol.
                    cancel_result = self.cancel_all_orders(symbol)
                    result[symbol] = {"cancel": cancel_result}
                    if hasattr(self.exchange, 'fetch_positions'):
                        positions = self.exchange.fetch_positions()
                        position_found = False
                        for pos in positions:
                            if pos.get("symbol") == symbol:
                                position_found = True
                                # Determine the position amount using 'contracts' or 'positionAmt'.
                                if "contracts" in pos:
                                    position_amount = float(pos.get("contracts", 0))
                                elif "positionAmt" in pos:
                                    position_amount = float(pos.get("positionAmt", 0))
                                else:
                                    position_amount = 0.0

                                if position_amount != 0:
                                    all_closed = False
                                    closing_side = "sell" if position_amount > 0 else "buy"
                                    order_amount = abs(position_amount)
                                    create_order_response = self.create_order(
                                        symbol, 
                                        order_type="market", 
                                        side=closing_side, 
                                        amount=order_amount
                                    )
                                    result[symbol]["close_position"] = create_order_response
                        if not position_found:
                            result[symbol]["close_position"] = "No open position for symbol."
                    else:
                        result[symbol]["close_position"] = "Exchange does not support fetch_positions."
                else:
                    # Process for all symbols.
                    if hasattr(self.exchange, 'fetch_positions'):
                        positions = self.exchange.fetch_positions()
                        for pos in positions:
                            s = pos.get("symbol")
                            if "contracts" in pos:
                                position_amount = float(pos.get("contracts", 0))
                            elif "positionAmt" in pos:
                                position_amount = float(pos.get("positionAmt", 0))
                            else:
                                position_amount = 0.0

                            if position_amount != 0:
                                all_closed = False
                                cancel_result = self.cancel_all_orders(s)
                                closing_side = "sell" if position_amount > 0 else "buy"
                                order_amount = abs(position_amount)
                                create_order_response = self.create_order(
                                    s, 
                                    order_type="market", 
                                    side=closing_side, 
                                    amount=order_amount
                                )
                                result[s] = {"cancel": cancel_result, "close_position": create_order_response}
                            else:
                                result[s] = {"cancel": "No open orders", "close_position": "No open position."}
                    else:
                        result["error"] = "Exchange does not support fetch_positions."
                        logging.info(result["error"])
                        return result["error"]

                logging.info(f"Kill switch iteration result: {result}")
                if all_closed:
                    break
                else:
                    time.sleep(5)  # Brief delay before rechecking positions.
            
            final_message = "Kill switch executed. All positions have been closed."
            logging.info(final_message)
            return final_message

        except Exception as e:
            error_msg = f"Error executing kill switch: {e}"
            logging.error(error_msg)
            return error_msg


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