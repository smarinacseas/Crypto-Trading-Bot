import os
from dotenv import load_dotenv
load_dotenv()  # Ensure environment variables are loaded

import eth_account
from eth_account.signers.local import LocalAccount
import json
import time
import logging
import requests  # Added for the new get_tradable_assets method

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
from hyperliquid.utils.types import Meta, SpotMeta

# Example of how to use the HyperLiquid API
# https://github.com/hyperliquid-dex/hyperliquid-python-sdk/tree/4bd17d89695626f6f116dd65854d4de2539a1d7b/examples

class HyperLiquidExecutor:
    """
    Executor for interacting with the HyperLiquid exchange.
    This class mimics the structure of the ccxt Executor, providing methods
    for fetching balances, creating orders, fetching open orders, canceling orders,
    setting leverage, and executing a full trade cycle.
    """
    def __init__(self):
        try:
            hyperliquid_key = os.getenv('HYPERLIQUID_SECRET_KEY')
            if not hyperliquid_key:
                raise EnvironmentError("HYPERLIQUID_SECRET_KEY is not set in your environment variables!")
            self.account = eth_account.Account.from_key(hyperliquid_key)
            self.address = self.account.address
            print(f"Initialized HyperLiquidExecutor for account: {self.address}")
            # Initialize the HyperLiquid exchange instance.
            self.exchange = Exchange(self.account, constants.MAINNET_API_URL)
            logging.info(f"Initialized HyperLiquidExecutor for account: {self.address}")
        except Exception as e:
            logging.error(f"Error during initialization: {e}")
            raise

    def fetch_balance(self, meaningful_only=False, threshold=0.1):
        """
        Fetch the user's state/balance information from HyperLiquid and format it.
        Now adapts to the new SDK where `user_state` returns assetPositions and withdrawable funds.
        """
        try:
            user_state = self.exchange.info.user_state(self.address)
            # Retrieve the withdrawable funds
            withdrawable = user_state.get("withdrawable", "N/A")
            # Retrieve asset positions details
            asset_positions = user_state.get("assetPositions", [])
            balances = {}

            # Iterate over each asset position to extract margin used per coin.
            for ap in asset_positions:
                position = ap.get("position", {})
                coin = position.get("coin", "Unknown")
                margin_used_str = position.get("marginUsed", "0")
                try:
                    margin_used = float(margin_used_str)
                except Exception as e:
                    logging.error(f"Error converting marginUsed for coin {coin}: {e}")
                    margin_used = 0.0
                balances[coin] = margin_used

            # Format the output message based on filtering criteria.
            if meaningful_only:
                filtered = {coin: used for coin, used in balances.items() if used > threshold}
                if filtered:
                    message = f"Meaningful positions (marginUsed > {threshold}): {filtered}. Withdrawable: {withdrawable}"
                else:
                    message = f"No meaningful positions found. Withdrawable: {withdrawable}"
            else:
                message = f"All positions: {balances}. Withdrawable: {withdrawable}"

            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error fetching balance: {e}"
            logging.error(error_message)
            return error_message

    def create_order(self, symbol, order_type, side, amount, price, params=None, reduce_only=False):
        """
        Create an order via the HyperLiquid API and return a formatted result.
        """
        try:
            # Check if the symbol is tradable
            tradable_assets = self.get_tradable_assets()
            if symbol not in tradable_assets:
                error_message = f"Asset '{symbol}' is not tradable on HyperLiquid. Tradable assets: {sorted(tradable_assets)}"
                logging.error(error_message)
                return error_message

            # Example conversion: side "buy" means True, otherwise False.
            is_buy = True if side.lower() == "buy" else False
            # In this example, we assume the API expects similar parameters for a limit order.
            order_type_settings = {'Limit': {'tif': 'GTC'}}
            order_result = self.exchange.order(symbol, is_buy, amount, price, order_type_settings, reduce_only=reduce_only)
            oid = order_result.get("oid", "N/A")
            message = f"Order Created: {oid} for {amount} {symbol} at {price} ({order_type} {side})"
            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error creating order for {symbol}: {e}"
            logging.error(error_message)
            return error_message

    def get_tradable_assets(self):
        """
        Retrieve a set of tradable assets from HyperLiquid's API using the meta endpoint.
        
        This method makes a POST request to 'https://api.hyperliquid.xyz/info' with a JSON payload.
        It then extracts the list of tradable assets from the returned data (using the 'universe' key)
        and builds a set of asset symbols based on the 'name' field.
        
        Returns:
            A set of strings representing the symbols of tradable assets, or an empty set if an error occurs.
        """
        try:
            url = 'https://api.hyperliquid.xyz/info'
            headers = {'Content-Type': 'application/json'}
            data = {'type': 'meta'}
            
            response = requests.post(url, headers=headers, data=json.dumps(data))
            if response.status_code == 200:
                data = response.json()
                symbols = data.get('universe', [])
                # Extract the 'name' from each asset entry in the universe.
                tradable_assets = {asset.get('name') for asset in symbols if asset.get('name')}
                logging.info(f"Tradable assets: {tradable_assets}")
                return tradable_assets
            else:
                logging.error(f"Error retrieving meta info: {response.status_code}")
                return set()
        except Exception as e:
            logging.error(f"Error retrieving tradable assets: {e}")
            return set()

    def fetch_open_orders(self, symbol):
        """
        Retrieve open orders for the user and format them into a readable string.
        
        Uses the tradable asset list from HyperLiquid's API to verify if the symbol exists
        on the platform. If the symbol is not tradable, returns an appropriate message.
        """
        try:
            # Verify if the asset is tradable on the platform.
            tradable_assets = self.get_tradable_assets()
            print(f"Tradable assets: {tradable_assets}")
            if symbol not in tradable_assets:
                message = f"Asset '{symbol}' is not tradable on HyperLiquid. Tradable assets: {sorted(tradable_assets)}"
                logging.info(message)
                return message
            
            # Fetch all open orders.
            orders = self.exchange.info.open_orders(self.address)
            # Filter orders for the given symbol.
            filtered_orders = [order for order in orders if order.get("coin") == symbol]
            
            if not filtered_orders:
                # The asset is tradable but no open orders are found.
                message = f"Asset '{symbol}' is tradable, but there are no open orders for it."
            else:
                # Format each open order for display.
                output = "\n".join(
                    f"Order ID: {order.get('oid', 'N/A')}, "
                    f"Side: {'Buy' if order.get('side') == 'A' else 'Sell'}, "
                    f"Size: {order.get('sz', 'N/A')}, "
                    f"Limit Price: {order.get('limitPx', 'N/A')}, "
                    f"Timestamp: {order.get('timestamp', 'N/A')}"
                    for order in filtered_orders
                )
                message = f"Open Orders for {symbol}:\n{output}"
            
            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error fetching open orders for {symbol}: {e}"
            logging.error(error_message)
            return error_message

    def cancel_all_orders(self, symbol):
        """
        Cancel all open orders for the specified symbol using the HyperLiquid API.
        """
        try:
            # Retrieve raw open orders first
            orders = self.exchange.info.open_orders(self.address)
            # Filter by symbol if required
            filtered = [order for order in orders if order.get("coin") == symbol]
            
            if filtered:
                canceled_orders = []
                for order in filtered:
                    oid = order.get("oid")
                    cancel_result = self.exchange.cancel(symbol, oid)
                    canceled_orders.append(cancel_result)
                    logging.info(f"Canceled order with oid: {oid}")
                message = f"Cancelled orders for {symbol}: {canceled_orders}"
            else:
                message = f"No open orders to cancel for {symbol}."
            
            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error canceling orders for {symbol}: {e}"
            logging.error(error_message)
            return error_message

    def set_leverage(self, leverage, symbol):
        """
        Set the leverage for the specified symbol.
        """
        try:
            result = self.exchange.update_leverage(leverage, symbol)
            message = f"Leverage set to {leverage} for {symbol}. Result: {result}"
            logging.info(message)
            return message
        except Exception as e:
            error_message = f"Error setting leverage for {symbol}: {e}"
            logging.error(error_message)
            return error_message
    
    def spot_to_perp(self):
        """
        Example of spot to perp conversion:
        https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_spot_to_perp.py
        """
        pass

    def execute_trade_cycle(self, symbol='AIXBT', order_type='limit', side='buy', amount=1.0, price=5000, params=None):
        """
        Execute the complete trade cycle:
          1. Fetch balance.
          2. Create an order.
          3. Retrieve open orders.
          4. Wait briefly.
          5. Cancel open orders.
          
        Returns a formatted summary of all actions.
        """
        summary = []
        try:
            # Check if the symbol is tradable before executing the trade cycle
            tradable_assets = self.get_tradable_assets()
            if symbol not in tradable_assets:
                error_message = f"Asset '{symbol}' is not tradable on HyperLiquid. Tradable assets: {sorted(tradable_assets)}"
                logging.error(error_message)
                return error_message

            summary.append(f"Executing trade cycle for {symbol} with order type '{order_type}' and side '{side}'.")
            
            summary.append("Fetching balance...")
            balance = self.fetch_balance()
            summary.append(f"Balance: {balance}")
            
            summary.append("Placing order...")
            order_result = self.create_order(symbol, order_type, side, amount, price, params)
            summary.append(f"Order creation result: {order_result}")
            
            summary.append("Fetching open orders...")
            open_orders = self.fetch_open_orders(symbol)
            summary.append(f"Open Orders: {open_orders}")
            
            time.sleep(10)  # Consider using asynchronous sleep in production
            
            summary.append("Canceling all orders...")
            cancel_result = self.cancel_all_orders(symbol)
            summary.append(f"Cancellation result: {cancel_result}")
            
            summary.append("Trade cycle completed.")
            final_summary = "\n".join(summary)
            logging.info(final_summary)
            return final_summary
        except Exception as e:
            error_message = f"Error executing trade cycle for {symbol}: {e}"
            logging.error(error_message)
            return error_message

    def kill_switch(self):
        """
        Kill switch to cancel all open orders and close all positions.

        This method performs the following actions:
          1. Retrieves the current user state to determine which assets have open positions.
          2. Iterates over each asset in the user state:
               - Cancels all open orders for the asset.
               - Determines if a position exists based on the 'szi' field.
               - If a position exists, sends a market order in the opposite direction
                 to close the position (i.e., sell if long, buy if short).
                  
        Returns:
            str: A summary message that details the actions taken (orders cancelled and positions closed).
        """
        try:
            # Retrieve the current user state
            user_state = self.exchange.info.user_state(self.address)
            asset_positions = user_state.get("assetPositions", [])
            position_closures = {}

            for ap in asset_positions:
                position = ap.get("position", {})
                coin = position.get("coin")
                if not coin:
                    continue  # Skip if asset name is missing.
                
                # Cancel open orders for this asset.
                cancel_response = self.cancel_all_orders(coin)
                logging.info(f"Cancelled open orders for {coin}: {cancel_response}")

                # Get the position size from the user state.
                szi_str = position.get("szi", "0")
                try:
                    position_size = float(szi_str)
                except Exception as e:
                    logging.error(f"Error converting position size for {coin}: {e}")
                    position_size = 0.0

                # If there is no open position, move to the next asset.
                if position_size == 0:
                    position_closures[coin] = "No open position."
                    continue

                # Determine the side for the closing order.
                # For long positions (size > 0), we close by selling.
                # For short positions (size < 0), we close by buying.
                if position_size > 0:
                    closing_side = "sell"
                else:
                    closing_side = "buy"

                # Issue a market order to close the position.
                # Here we assume that self.exchange.trade.create_order exists.
                order_amount = abs(position_size)
                try:
                    order_response = self.exchange.trade.create_order(
                        self.address,
                        coin,
                        order_type="market",
                        side=closing_side,
                        amount=order_amount
                    )
                    position_closures[coin] = f"Closed position of {order_amount} via {closing_side} market order."
                    logging.info(f"{coin}: {position_closures[coin]}")
                except Exception as order_exception:
                    error_msg = f"Failed to close position for {coin}: {order_exception}"
                    position_closures[coin] = error_msg
                    logging.error(error_msg)

            message = f"Kill switch executed. Actions: {position_closures}"
            logging.info(message)
            return message

        except Exception as e:
            error_message = f"Error executing kill switch: {e}"
            logging.error(error_message)
            return error_message


# Updated main execution block.
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logging.info("HyperLiquid Automated Trading Executor")
    executor = HyperLiquidExecutor()
    # Execute a trade cycle. Adjust parameters as needed.
    executor.execute_trade_cycle(symbol='AIXBT', order_type='limit', side='buy', amount=1.0, price=5000)