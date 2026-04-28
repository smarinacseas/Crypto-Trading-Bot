import React from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useBasket } from '../contexts/BasketContext';

/** Toggle button: + when not in basket, ✓ when in basket. */
export default function BasketButton({ ticker, size = 'sm' }) {
  const { tickers, add, remove } = useBasket();
  const inBasket = tickers.has(ticker);

  const sizeClass = size === 'xs' ? 'h-6 w-6 p-0.5' : 'h-7 w-7 p-1';

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (inBasket) await remove(ticker);
      else await add(ticker);
    } catch (err) {
      console.error('basket toggle failed', err);
    }
  };

  return (
    <button
      onClick={onClick}
      title={inBasket ? `Remove ${ticker} from basket` : `Add ${ticker} to basket`}
      className={`${sizeClass} rounded transition-colors flex items-center justify-center ${
        inBasket
          ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
          : 'bg-secondary-700 text-neutral-400 hover:bg-primary-600/40 hover:text-primary-200'
      }`}
    >
      {inBasket ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
    </button>
  );
}
