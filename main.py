import asyncio
from binance.standard_stream import StandardBinanceStream
from binance.aggregated_stream import AggregatedBinanceStream
from binance.funding_rates_stream import FundingRatesStream
import aiohttp

async def get_top_volume_assets(limit=10):
    url = "https://api.binance.com/api/v3/ticker/24hr"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
    # Filter and sort USDT markets
    usdt_markets = [item for item in data if item['symbol'].endswith('USDT')]
    usdt_markets.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
    top_markets = usdt_markets[:limit]
    return [market['symbol'].lower() for market in top_markets]

async def get_user_selected_assets():
    top_markets = await get_top_volume_assets()
    print("Select assets to track trades for:")
    for idx, market in enumerate(top_markets, 1):
        print(f"{idx}. {market.upper()}")
    selection = await asyncio.to_thread(input, "Enter comma-separated numbers (or press ENTER for default top 4): ")
    if not selection.strip():
        return top_markets[:4]
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

async def main():
    # Let the user select which type of stream they'd like to see:
    print("Select stream type:")
    print("  (1) Standard")
    print("  (2) Aggregated")
    print("  (3) Funding Rates")
    stream_type = input("Enter your choice: ")

    selected_assets = await get_user_selected_assets()
    if stream_type.strip() == "1":
        trades_file = "binance_trades.csv"
        min_display = float(input("Enter minimum transaction amount for display (default 10000): ") or "10000")
        bold_amt = float(input("Enter transaction amount threshold for bold formatting (default 20000): ") or "20000")
        color_amt = float(input("Enter transaction amount threshold for different colors (default 100000): ") or "100000")
        streams = [
            StandardBinanceStream(symbol, trades_file, min_display, bold_amt, color_amt, "wss://stream.binance.com:9443")
            for symbol in selected_assets
        ]
    elif stream_type.strip() == "2":
        trades_file = "binance_trades_large.csv"
        aggregation_interval = float(input("Enter aggregation interval in seconds (default 5): ") or "5")
        # Hardcoded thresholds - can prompt
        baseline_threshold = 100000
        bold_threshold = 300000
        color_threshold = 500000
        streams = [
            AggregatedBinanceStream(symbol, trades_file, aggregation_interval, baseline_threshold, bold_threshold, color_threshold, "wss://stream.binance.com:9443")
            for symbol in selected_assets
        ]
    elif stream_type.strip() == "3":
        trades_file = "binance_funding_rates.csv"
        streams = [
            FundingRatesStream(symbol, trades_file, "wss://fstream.binance.com")
            for symbol in selected_assets
        ]
    else:
        print("Invalid option. Exiting.")
        return

    tasks = [asyncio.create_task(stream.run()) for stream in streams]

    # Use an exit listener to gracefully terminate
    exit_task = asyncio.create_task(asyncio.to_thread(input, "Press ENTER to quit...\n"))
    await exit_task

    print("Terminating stream(s)...")
    for t in tasks:
        t.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    print("Disconnected. Exiting.")

if __name__ == '__main__':
    asyncio.run(main()) 