# Coinbase Historical Data Import

import os
import pandas as pd
import ccxt
import datetime
from math import ceil
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('COINBASE_API_KEY')
API_SECRET = os.getenv('COINBASE_API_SECRET')

def timeframe_to_secs(timeframe):
    """
    Convert a timeframe string (e.g., '6h', '1d') to the number of seconds.
    """
    if 'm' in timeframe:
        return int(''.join([c for c in timeframe if c.isdigit()])) * 60
    elif 'h' in timeframe:
        return int(''.join([c for c in timeframe if c.isdigit()])) * 60 * 60
    elif 'd' in timeframe:
        return int(''.join([c for c in timeframe if c.isdigit()])) * 60 * 60 * 24
    else:
        raise ValueError(f"Invalid timeframe: {timeframe}")

def save_dataframe_to_csv(dataframe, symbol, timeframe, weeks):
    """
    Save the dataframe to a CSV file in the output_files folder.
    The filename is built dynamically from the symbol, timeframe, and number of weeks.
    """
    # Get the directory of the current file and create the output folder.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_dir, "output_files")
    os.makedirs(output_dir, exist_ok=True)
    
    # Sanitize symbol to avoid problematic characters (e.g., '/' replaced with '_' ).
    safe_symbol = symbol.replace("/", "_")
    file_path = os.path.join(output_dir, f"{safe_symbol}_{timeframe}_{weeks}w.csv")
    
    try:
        dataframe.to_csv(file_path, index=True)
        print(f"Data saved to {file_path}")
    except Exception as e:
        print(f"Error saving DataFrame to CSV: {e}")
    
    return dataframe

def get_historical_data(symbol, timeframe, weeks):
    """
    Fetch historical OHLCV data from Coinbase for the given symbol and timeframe over a number of weeks.
    
    Parameters:
      symbol (str): Trading pair symbol (e.g., 'BTC/USD').
      timeframe (str): Timeframe for data (e.g., '6h').
      weeks (int): The number of weeks of historical data to retrieve.
      
    Returns:
      pandas.DataFrame: A DataFrame of historical OHLCV data.
    """
    # Create a file path cache based on the input parameters.
    # (Alternatively you may want to append the "output_files" directory as done in save_dataframe_to_csv.)
    safe_symbol = symbol.replace("/", "_")
    file_path = f"{safe_symbol}_{timeframe}_{weeks}.csv"
    if os.path.exists(file_path):
        return pd.read_csv(file_path)
    
    now = datetime.datetime.now()
    coinbase = ccxt.coinbase({
        'apiKey': API_KEY,
        'secret': API_SECRET,
        'enableRateLimit': True,
    })

    # Ensure Coinbase has the fetchOHLCV method.
    if not coinbase.has['fetchOHLCV']:
        raise Exception('Coinbase does not support fetchOHLCV')

    # Convert timeframe to seconds.
    timeframe_secs = timeframe_to_secs(timeframe)
    
    # Calculate total seconds for the number of weeks.
    total_time = weeks * 7 * 24 * 60 * 60
    # Each API call fetches 200 bars so adjust the number of required calls.
    run_times = ceil(total_time / (timeframe_secs * 200))

    dataframe = pd.DataFrame()

    # Fetch data in chunks.
    for i in range(run_times):
        since = now - datetime.timedelta(seconds=timeframe_secs * 200 * (i + 1))
        since_timestamp = int(since.timestamp() * 1000)  # Convert to milliseconds.
        try:
            data = coinbase.fetch_ohlcv(symbol, timeframe, since=since_timestamp, limit=200)
            if data:
                df = pd.DataFrame(data, columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
                # Convert timestamp to datetime.
                df['datetime'] = pd.to_datetime(df['datetime'], unit='ms')
                # Concatenate new data with previous chunks.
                if dataframe.empty:
                    dataframe = df
                else:
                    dataframe = pd.concat([df, dataframe], ignore_index=True)
        except Exception as e:
            print(f"Error fetching data for {symbol} {timeframe} since {since}: {e}")
            break
    
    # Set the datetime as index and select the required columns.
    dataframe = dataframe.set_index('datetime')
    dataframe = dataframe[['open', 'high', 'low', 'close', 'volume']]
    # Save data to CSV, using the dynamic file naming.
    return save_dataframe_to_csv(dataframe, symbol, timeframe, weeks)

if __name__ == "__main__":
    # Provide the desired parameters here.
    symbol = 'BTC/USD'
    timeframe = '6h'
    weeks = 10
    
    # Now call get_historical_data with the parameters.
    df = get_historical_data(symbol, timeframe, weeks)
    print(df)
