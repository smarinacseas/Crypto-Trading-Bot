import os
from backend.app.trade_execution.execute import Executor

# Run the script with the following commands:
# cd /Users/stefanmarinac/VSCode_Projects/Solana-Trading-Bot
# python -m backend.app.scripts.execute_entry

def main():
    # Define a list of potential exchanges you support
    potential_exchanges = ["MEXC", "BINANCE", "COINBASE", "KRAKEN"]
    available_exchanges = []
    for exchange in potential_exchanges:
        if os.getenv(f"{exchange}_API_KEY") and os.getenv(f"{exchange}_SECRET_KEY"):
            available_exchanges.append(exchange)

    if not available_exchanges:
        print("No available exchange APIs found in environment variables.")
        return

    # Prompt the user to select an exchange
    print("Available exchanges:")
    for idx, exchange in enumerate(available_exchanges, 1):
        print(f"{idx}. {exchange}")
    choice = input("Select an exchange by number: ").strip()
    
    try:
        index = int(choice) - 1
        if index < 0 or index >= len(available_exchanges):
            print("Invalid selection. Exiting.")
            return
        selected_exchange = available_exchanges[index]
        print(f"Selected exchange: {selected_exchange}")
    except Exception as e:
        print("Invalid input. Exiting.")
        return

    # Initialize the Executor with the selected exchange
    executor = Executor(selected_exchange)

    while True:
        print("\nSelect an action:")
        print("1. Fetch Balance")
        print("2. Create Order")
        print("3. Create Perpetual Futures Order With Leverage")
        print("4. Fetch Open Orders")
        print("5. Cancel All Orders")
        print("6. Execute Trade Cycle")
        print("7. Exit")
        
        
        user_choice = input("Enter your choice (1-7): ").strip()
        
        if user_choice == '1':
            executor.fetch_balance()
        elif user_choice == '2':
            symbol = input("Enter symbol (e.g., SOL/USDT): ").strip()
            order_type = input("Enter order type (limit/market/stop, etc.): ").strip()
            side = input("Enter side (buy/sell): ").strip()
            amount = float(input("Enter amount: ").strip())
            price = float(input("Enter price (or 0 for market order): ").strip())
            executor.create_order(symbol, order_type, side, amount, price if price > 0 else None)
        elif user_choice == '3':
            symbol = input("Enter symbol (e.g., SOL/USDT): ").strip()
            order_type = input("Enter order type for perpetual futures (limit/market/stop, etc.): ").strip()
            side = input("Enter side (buy/sell): ").strip()
            amount = float(input("Enter amount: ").strip())
            price = float(input("Enter price (or 0 for market order): ").strip())
            lev_input = input("Enter leverage (or leave blank for default): ").strip()
            leverage = float(lev_input) if lev_input else None
            executor.create_perpetual_futures_order(symbol, order_type, side, amount, price if price > 0 else None, leverage=leverage)
        elif user_choice == '4':
            symbol = input("Enter symbol (e.g., SOL/USDT): ").strip()
            executor.fetch_open_orders(symbol.upper())
        elif user_choice == '5':
            symbol = input("Enter symbol (e.g., SOL/USDT): ").strip()
            executor.cancel_all_orders(symbol.upper())
        elif user_choice == '6':
            executor.execute_trade_cycle()
        elif user_choice == '7':
            print("Exiting...")
            break
        
        else:
            print("Invalid choice. Please try again.")

if __name__ == '__main__':
    main()