# Imports
import pandas as pd
import ccxt

# Import get_historical_data from the Coinbase historical data module
from backend.app.data_import.coinbase.cb_historical import get_historical_data

# Run the script with the following commands:
# python -m backend.app.indicators.indicators

def bars_in_day(timeframe):
    """
    Calculate the number of data points (bars) in one day based on the timeframe.
    For example:
      - '30m': (24 * 60) / 30 = 48 bars per day.
      - '6h': 24 / 6 = 4 bars per day.
      - '1d': 1 bar per day.
    """
    if 'm' in timeframe:
        minutes = int(''.join(filter(str.isdigit, timeframe)))
        return (24 * 60) // minutes
    elif 'h' in timeframe:
        hours = int(''.join(filter(str.isdigit, timeframe)))
        return 24 // hours
    elif 'd' in timeframe:
        return 1
    else:
        raise ValueError(f"Unsupported timeframe format: {timeframe}")

# Simple Moving Average
def sma_df(symbol, timeframe, weeks, sma):
    """
    Calculate SMA indicator for a given symbol using historical OHLCV data.

    Parameters:
      symbol (str): Trading pair symbol (e.g., 'BTC/USD').
      timeframe (str): Data timeframe (e.g., '6h').
      weeks (int): Number of weeks of historical data to retrieve.
      sma (int): The window length (in periods) for the simple moving average.

    Returns:
      pandas.DataFrame: The historical DataFrame with additional columns:
          - 'sma{sma}': the simple moving average of the close price,
          - 'sig': trading signal ('BUY' if close < bid, 'SELL' if close > bid),
          - 'support': the minimum close (excluding the last row),
          - 'resis': the maximum close (excluding the last row).
    """
    print('Starting SMA indicator calculation...')
    
    # Retrieve historical OHLCV data using the Coinbase module
    df = get_historical_data(symbol, timeframe, weeks)

    # Ensure the DataFrame has the expected 'close' column
    if 'close' not in df.columns:
        raise ValueError('Historical data must contain a "close" column.')
    
    # Calculate the number of bars in one day based on the timeframe
    bars_per_day = bars_in_day(timeframe)
    # Calculate the number of days in the SMA window
    window = sma * bars_per_day


    # Add the SMA column, named as 'sma{sma}'
    sma_column = f'sma{sma}'
    df[sma_column] = df['close'].rolling(window=window).mean()

    # Fetch the current bid price using ccxt (public data)
    try:
        exchange = ccxt.coinbase({
            'enableRateLimit': True
        })
        order_book = exchange.fetch_order_book(symbol)
        bid = order_book['bids'][0][0] if order_book.get('bids') and len(order_book['bids']) > 0 else None
    except Exception as e:
        print(f"Error fetching order book for {symbol}: {e}")
        bid = None

    # Generate a trading signal based on current bid versus SMA
    if bid is None:
        print("No valid bid price available; assigning NO SIGNAL.")
        df['sig'] = 'NO SIGNAL'
    else:
        # If the SMA is above the bid, it's bearish (SELL). If below, bullish (BUY).
        df.loc[df[sma_column] > bid, 'sig'] = 'SELL'
        df.loc[df[sma_column] < bid, 'sig'] = 'BUY'

    # Calculate support and resistance as min and max of close (excluding the last row) to mimic reference logic
    if len(df) > 1:
        support = df['close'][:-1].min()
        resis = df['close'][:-1].max()
    else:
        support = None
        resis = None
    df['support'] = support
    df['resis'] = resis

    print(df.head())
    return df

# Relative Strength Index


if __name__ == "__main__":
    # Simple Moving Average
    # Provide the desired parameters here.
    symbol = 'BTC/USD'
    timeframe = '6h'
    weeks = 10
    
    # Call the sma_df function with the parameters.
    df = sma_df(symbol, timeframe, weeks, 20)
    print(df)

    

