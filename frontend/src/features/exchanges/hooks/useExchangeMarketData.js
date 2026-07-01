import { useCallback, useEffect, useState } from 'react';
import { getExchangeMarketData } from '../../../api/exchanges';

function useExchangeMarketData({ selectedExchange, activeDetailTab }) {
  const [exchangeMarketData, setExchangeMarketData] = useState([]);
  const [loadingExchangeMarketData, setLoadingExchangeMarketData] = useState(false);
  const [errorExchangeMarketData, setErrorExchangeMarketData] = useState(null);
  const [exchangeMarketRefreshCycle, setExchangeMarketRefreshCycle] = useState(0);

  const resetExchangeMarketData = useCallback(() => {
    setExchangeMarketData([]);
    setErrorExchangeMarketData(null);
  }, []);

  const fetchExchangeMarketData = useCallback(async (exchange) => {
    if (!exchange?.id) return;

    setExchangeMarketRefreshCycle((cycle) => cycle + 1);
    setLoadingExchangeMarketData(true);
    setErrorExchangeMarketData(null);
    try {
      const data = await getExchangeMarketData(exchange.id);
      const rows = Array.isArray(data.data)
        ? data.data
        : (Array.isArray(data.marketData) ? data.marketData : []);
      setExchangeMarketData(rows);
    } catch (err) {
      console.error('Failed to fetch exchange market data:', err);
      setErrorExchangeMarketData(err.message);
      setExchangeMarketData([]);
    } finally {
      setLoadingExchangeMarketData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExchange && activeDetailTab === 'market') {
      fetchExchangeMarketData(selectedExchange);
    }
  }, [selectedExchange, activeDetailTab, fetchExchangeMarketData]);

  useEffect(() => {
    if (!selectedExchange || activeDetailTab !== 'market') return undefined;

    const interval = setInterval(() => {
      fetchExchangeMarketData(selectedExchange);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedExchange, activeDetailTab, fetchExchangeMarketData]);

  return {
    exchangeMarketData,
    loadingExchangeMarketData,
    errorExchangeMarketData,
    exchangeMarketRefreshCycle,
    resetExchangeMarketData
  };
}

export default useExchangeMarketData;
