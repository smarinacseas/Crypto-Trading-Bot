import os
import eth_account
from eth_account.signers import LocalAccount
import json
import time
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
import ccxt
import pandas as pd
import datetime as dt
import schedule
import requests

symbol = 'AIXBT'
timeframe = '4h'
LocalAccount = eth_account.Account.from_key(os.getenv('HYPERLIQUID_PRIVATE_KEY'))

def ask_bid(symbol):
    """Get ask and bid for any symbol passed in

    Args:
        Symbol (str): Symbol to get ask and bid for

    Returns:
        tuple: Ask, bid, and l2_data
    """
    url = 'https://api.hyperliquid.xyz/info'
    headers = {'Content-Type': 'application/json'}
    data = {
        'type': 'l2Book',
        'symbol': symbol,
    }

    response = requests.post(url, headers=headers, json=json.dumps(data))
    l2_data = response.json()
    l2_data = l2_data['levels']

    # Get ask and bid
    ask = float(l2_data[1][0]['px'])
    bid = float(l2_data[0][0]['px'])

    return ask, bid, l2_data

def get_sz_px_decimals(coin):
    """Return size and price decimal precision for a coin

    Args:
        coin (str): Coin symbol

    Returns:
        tuple: Size and price decimal precision
    """
    url = 'https://api.hyperliquid.xyz/info'
    headers = {'Content-Type': 'application/json'}
    data = {'type': 'meta'}

    response = requests.post(url, headers=headers, json=json.dumps(data))

    if response.status_code == 200:
        data = response.json()
        symbols = data['universe']
        symbol_info = next((item for item in symbols if item['name'] == coin), None)
        if symbol_info:
            sz_decimals = symbol_info['szDecimals']
        else:
            print('Symbol not found in HyperLiquid')
    else:
        print('Error:', response.status_code)
    
    ask = ask_bid(coin)[0]
    ask_str = str(ask)

    if '.' in ask_str:
        px_decimals = len(ask_str.split('.')[1])
    else:
        px_decimals = 0

    print(f'{coin}: Price: {sz_decimals}')

    return sz_decimals, px_decimals

def limit_order(coin, is_buy, limit_pc, reduce_only, account):
    exchange = Exchange(account, constants.MAINNET_API_URL)
    rounding = get_sz_px_decimals(coin)[0]
    sz = round(sz, rounding)
    print(f'Coin: {coin}, Type: {type(coin)}')
    print(f'Is Buy: {is_buy}, Type: {type(is_buy)}')
    print(f'SZ: {sz}, Type: {type(sz)}')
    print(f'Limit %: {limit_pc}, Type: {type(limit_pc)}')
    print(f'Reduce Only: {reduce_only}, Type: {type(reduce_only)}')
    print(f'Placing limit order for {coin} {sz} @ {limit_pc}')
    order_result = exchange.order(coin, is_buy, sz, limit_pc, {'Limit' : {'tif': 'GTC'}}, reduce_only = reduce_only)

    if is_buy == True:
        print(f'Buy order placed: {order_result['response']['data']['statuses'][0]}')
    else:
        print(f'Sell order placed: {order_result['response']['data']['statuses'][0]}')

    return order_result

# Example usage
coin = symbol
is_buy = True  # True for buy, False for sell
bid = ask_bid(coin)[0]
reduce_only = False
account = LocalAccount

print(limit_order(coin, is_buy, bid, reduce_only, account))