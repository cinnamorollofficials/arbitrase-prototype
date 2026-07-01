import { useCallback, useMemo, useState } from 'react';
import {
  filterExchangePairs,
  getExchangeMarketLookup,
  getExchangeMarketRow,
  getExchangeMarketRowKey,
  getFiatPairs,
  sortExchangePairs
} from '../utils/exchangeFilters';
import { downloadExchangeMarketCsv } from '../utils/exchangeCsv';

function useExchangeMarketTable({ selectedExchange, marketData }) {
  const [exchangeMarketSortConfig, setExchangeMarketSortConfig] = useState({ key: 'baseToken', direction: 'asc' });
  const [exchangeMarketSearchQuery, setExchangeMarketSearchQuery] = useState('');
  const [selectedExchangeMarketRows, setSelectedExchangeMarketRows] = useState(new Set());

  const selectedExchangeFiatPairs = useMemo(() => getFiatPairs(selectedExchange), [selectedExchange]);
  const exchangeMarketDataLookup = useMemo(() => getExchangeMarketLookup(marketData), [marketData]);

  const getMarketRow = useCallback((pair) => {
    return getExchangeMarketRow(exchangeMarketDataLookup, pair);
  }, [exchangeMarketDataLookup]);

  const filteredExchangeFiatPairs = useMemo(() => {
    return filterExchangePairs(selectedExchangeFiatPairs, exchangeMarketSearchQuery, getMarketRow);
  }, [selectedExchangeFiatPairs, exchangeMarketSearchQuery, getMarketRow]);

  const sortedExchangeFiatPairs = useMemo(() => {
    return sortExchangePairs(filteredExchangeFiatPairs, exchangeMarketSortConfig, exchangeMarketDataLookup);
  }, [filteredExchangeFiatPairs, exchangeMarketDataLookup, exchangeMarketSortConfig]);

  const selectedExchangeMarketPairs = useMemo(() => {
    return selectedExchangeFiatPairs.filter((pair) => selectedExchangeMarketRows.has(getExchangeMarketRowKey(pair)));
  }, [selectedExchangeFiatPairs, selectedExchangeMarketRows]);

  const allVisibleExchangeMarketRowsSelected = sortedExchangeFiatPairs.length > 0
    && sortedExchangeFiatPairs.every((pair) => selectedExchangeMarketRows.has(getExchangeMarketRowKey(pair)));

  const handleExchangeMarketSort = useCallback((key) => {
    setExchangeMarketSortConfig((current) => {
      let direction = 'asc';
      if (current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const getExchangeMarketSortIndicator = useCallback((key) => {
    if (exchangeMarketSortConfig.key !== key) return ' ↕';
    return exchangeMarketSortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  }, [exchangeMarketSortConfig]);

  const toggleExchangeMarketRowSelection = useCallback((pair) => {
    const rowKey = getExchangeMarketRowKey(pair);
    setSelectedExchangeMarketRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }, []);

  const toggleAllVisibleExchangeMarketRows = useCallback(() => {
    setSelectedExchangeMarketRows((prev) => {
      const next = new Set(prev);
      if (allVisibleExchangeMarketRowsSelected) {
        sortedExchangeFiatPairs.forEach((pair) => next.delete(getExchangeMarketRowKey(pair)));
      } else {
        sortedExchangeFiatPairs.forEach((pair) => next.add(getExchangeMarketRowKey(pair)));
      }
      return next;
    });
  }, [allVisibleExchangeMarketRowsSelected, sortedExchangeFiatPairs]);

  const resetExchangeMarketTable = useCallback(() => {
    setExchangeMarketSearchQuery('');
    setSelectedExchangeMarketRows(new Set());
  }, []);

  const handleExportExchangeMarketCsv = useCallback(() => {
    downloadExchangeMarketCsv({
      exchange: selectedExchange,
      pairs: selectedExchangeMarketPairs,
      getMarketRow
    });
  }, [getMarketRow, selectedExchange, selectedExchangeMarketPairs]);

  return {
    exchangeMarketSearchQuery,
    setExchangeMarketSearchQuery,
    selectedExchangeFiatPairs,
    filteredExchangeFiatPairs,
    sortedExchangeFiatPairs,
    selectedExchangeMarketRows,
    selectedExchangeMarketPairs,
    allVisibleExchangeMarketRowsSelected,
    getExchangeMarketRow: getMarketRow,
    getExchangeMarketRowKey,
    handleExchangeMarketSort,
    getExchangeMarketSortIndicator,
    toggleExchangeMarketRowSelection,
    toggleAllVisibleExchangeMarketRows,
    handleExportExchangeMarketCsv,
    resetExchangeMarketTable
  };
}

export default useExchangeMarketTable;
