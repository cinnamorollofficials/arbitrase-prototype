import { useState } from 'react';
import { DEFAULT_EXCHANGE_BALANCES } from '../constants/balances';

export default function useBalances() {
  const [exchangeBalances, setExchangeBalances] = useState(() => {
    const saved = localStorage.getItem('arbitrage_balances');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_EXCHANGE_BALANCES, ...parsed };
    }
    return DEFAULT_EXCHANGE_BALANCES;
  });

  return { exchangeBalances, setExchangeBalances };
}
