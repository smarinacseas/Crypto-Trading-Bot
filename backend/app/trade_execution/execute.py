import ccxt
import os
import schedule
import time

# This skeleton demonstrates some important trading actions via the CCXT library using the MEXC exchange as an example.
# For more details, see the CCXT Private API documentation:
# https://docs.ccxt.com/#/README?id=private-api


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
            message = f"Order Created: ID {order_id} for {symbol} at {price} (Type: {order_type}, Side: {side})"
            print(message)
            return message
        except Exception as e:
            error_message = f"Error creating order for {symbol}: {e}"
            print(error_message)
            return error_message

    def fetch_open_orders(self, symbol):
        """
        Retrieve the list of open orders for the given symbol.
        Returns a formatted string with order details.
        """
        try:
            orders = self.exchange.fetch_open_orders(symbol)
            if orders:
                output = "\n".join(
                    f"ID {order.get('id', 'N/A')}: {order.get('type')} {order.get('side')} order for {order.get('symbol')} at {order.get('price')}"
                    for order in orders
                )
                message = f"Open Orders for {symbol}:\n{output}"
            else:
                message = f"No open orders for {symbol}."
            print(message)
            return message
        except Exception as e:
            error_message = f"Error fetching open orders for {symbol}: {e}"
            print(error_message)
            return error_message

    def cancel_all_orders(self, symbol):
        """
        Cancel all orders for the specified symbol.
        Returns a formatted confirmation message.
        """
        try:
            result = self.exchange.cancel_all_orders(symbol)
            message = f"Canceled all orders for {symbol}. Result: {result}"
            print(message)
            return message
        except Exception as e:
            error_message = f"Error canceling orders for {symbol}: {e}"
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