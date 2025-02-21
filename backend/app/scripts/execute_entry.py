import os
import argparse

# Import trading logic modules
from backend.app.execution.execute_ccxt import Executor
from backend.app.execution.execute_hyperliquid import ask_bid, limit_order, LocalAccount

# CLI entry point - examples:
# python -m backend.app.scripts.execute_entry balance --exchange MEXC
# python -m backend.app.scripts.execute_entry create_order --exchange MEXC --symbol SOL/USDT --order_type limit --side buy --amount 0.01 --price 5000

def main():
    parser = argparse.ArgumentParser(description="Solana Trading Bot CLI")
    subparsers = parser.add_subparsers(dest="command", required=True, help="Trading commands")

    # Subcommand: Fetch Balance
    parser_balance = subparsers.add_parser('balance', help='Fetch account balance')
    parser_balance.add_argument('--exchange', required=True, help='Exchange name')

    # Subcommand: Create Order
    parser_order = subparsers.add_parser('create_order', help='Create an order')
    parser_order.add_argument('--exchange', required=True, help='Exchange name')
    parser_order.add_argument('--symbol', required=True, help='Trading symbol (e.g., SOL/USDT)')
    parser_order.add_argument('--order_type', required=True, choices=['limit', 'market', 'stop'], help='Order type')
    parser_order.add_argument('--side', required=True, choices=['buy', 'sell'], help='Order side')
    parser_order.add_argument('--amount', required=True, type=float, help='Order amount')
    parser_order.add_argument('--price', type=float, default=0.0, help='Order price (use 0 for market order)')

    # Subcommand: Create Perpetual Futures Order
    parser_perpetual = subparsers.add_parser('create_perpetual', help='Create perpetual futures order')
    parser_perpetual.add_argument('--exchange', required=True, help='Exchange name')
    parser_perpetual.add_argument('--symbol', required=True, help='Trading symbol (e.g., SOL/USDT)')
    parser_perpetual.add_argument('--order_type', required=True, choices=['limit', 'market', 'stop'], help='Order type')
    parser_perpetual.add_argument('--side', required=True, choices=['buy', 'sell'], help='Order side')
    parser_perpetual.add_argument('--amount', required=True, type=float, help='Order amount')
    parser_perpetual.add_argument('--price', type=float, default=0.0, help='Order price (use 0 for market order)')
    parser_perpetual.add_argument('--leverage', type=float, default=None, help='Leverage for futures order')

    # Subcommand: Fetch Open Orders
    parser_open = subparsers.add_parser('open_orders', help='Fetch open orders')
    parser_open.add_argument('--exchange', required=True, help='Exchange name')
    parser_open.add_argument('--symbol', required=True, help='Trading symbol (e.g., SOL/USDT)')

    # Subcommand: Cancel Orders
    parser_cancel = subparsers.add_parser('cancel_orders', help='Cancel all orders')
    parser_cancel.add_argument('--exchange', required=True, help='Exchange name')
    parser_cancel.add_argument('--symbol', required=True, help='Trading symbol (e.g., SOL/USDT)')

    # Subcommand: Execute Trade Cycle
    parser_cycle = subparsers.add_parser('trade_cycle', help='Execute full trade cycle')
    parser_cycle.add_argument('--exchange', required=True, help='Exchange name')
    parser_cycle.add_argument('--symbol', default='SOL/USDT', help='Trading symbol')
    parser_cycle.add_argument('--order_type', default='limit', choices=['limit', 'market', 'stop'], help='Order type')
    parser_cycle.add_argument('--side', default='sell', choices=['buy', 'sell'], help='Order side')
    parser_cycle.add_argument('--amount', type=float, default=0.01, help='Order amount')
    parser_cycle.add_argument('--price', type=float, default=5000, help='Order price')

    args = parser.parse_args()

    exchange = args.exchange.upper()

    try:
        if args.command == 'balance':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid balance fetching not supported via CLI.")
            else:
                executor = Executor(exchange)
                print(executor.fetch_balance())

        elif args.command == 'create_order':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid order creation via CLI not supported; use API endpoint.")
            else:
                executor = Executor(exchange)
                price_val = args.price if args.price > 0 else None
                print(executor.create_order(args.symbol, args.order_type, args.side, args.amount, price_val))

        elif args.command == 'create_perpetual':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid perpetual futures order via CLI not supported; use API endpoint.")
            else:
                executor = Executor(exchange)
                price_val = args.price if args.price > 0 else None
                print(executor.create_perpetual_futures_order(args.symbol, args.order_type, args.side, args.amount, price_val, leverage=args.leverage))

        elif args.command == 'open_orders':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid open orders fetching not supported via CLI.")
            else:
                executor = Executor(exchange)
                print(executor.fetch_open_orders(args.symbol))

        elif args.command == 'cancel_orders':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid cancel orders not supported via CLI.")
            else:
                executor = Executor(exchange)
                print(executor.cancel_all_orders(args.symbol))

        elif args.command == 'trade_cycle':
            if exchange == 'HYPERLIQUID':
                print("HyperLiquid trade cycle not supported via CLI.")
            else:
                executor = Executor(exchange)
                print(executor.execute_trade_cycle(args.symbol, args.order_type, args.side, args.amount, args.price))

    except Exception as e:
        print("Error executing command:", e)


if __name__ == '__main__':
    main()