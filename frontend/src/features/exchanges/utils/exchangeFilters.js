import { normalizeMarketSymbol } from '../../../utils/market';

export const getExchangeMarketRowKey = (pair) => String(pair.id ?? pair.symbol);

export const getExchangeMarketLookup = (marketData) => {
  const lookup = new Map();

  marketData.forEach((item) => {
    if (item.pairId !== undefined && item.pairId !== null) {
      lookup.set(`id:${item.pairId}`, item);
    }

    if (item.symbol) {
      lookup.set(`symbol:${item.symbol}`, item);
      lookup.set(`symbol:${normalizeMarketSymbol(item.symbol)}`, item);
    }
  });

  return lookup;
};

export const getExchangeMarketRow = (lookup, pair) => {
  return lookup.get(`id:${pair.id}`)
    || lookup.get(`symbol:${pair.symbol}`)
    || lookup.get(`symbol:${normalizeMarketSymbol(pair.symbol)}`)
    || null;
};

export const getFiatPairs = (exchange) => {
  const fiatSymbols = new Set(['IDR', 'USD']);

  return (exchange?.tokenPairs || [])
    .filter((pair) => fiatSymbols.has(pair.quoteToken?.symbol))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
};

export const filterExchangePairs = (pairs, query, getMarketRow) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return pairs;

  return pairs.filter((pair) => {
    const market = getMarketRow(pair);
    const searchableText = [
      pair.symbol,
      pair.baseToken?.symbol,
      pair.baseToken?.name,
      pair.quoteToken?.symbol,
      pair.quoteToken?.name,
      market?.status,
      market?.source,
      market?.nativeCurrency
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};

export const sortExchangePairs = (pairs, sortConfig, lookup) => {
  const direction = sortConfig.direction === 'asc' ? 1 : -1;
  const getMarket = (pair) => getExchangeMarketRow(lookup, pair);

  const getNumberValue = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const compareNullableNumbers = (a, b) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  };

  const compareStrings = (a, b) => String(a || '').localeCompare(String(b || ''), 'id-ID', {
    numeric: true,
    sensitivity: 'base'
  });

  return [...pairs].sort((a, b) => {
    const marketA = getMarket(a);
    const marketB = getMarket(b);
    let result = 0;

    switch (sortConfig.key) {
      case 'baseToken':
        result = compareStrings(a.baseToken?.symbol, b.baseToken?.symbol)
          || compareStrings(a.baseToken?.name, b.baseToken?.name)
          || compareStrings(a.symbol, b.symbol);
        break;
      case 'last':
        result = compareNullableNumbers(
          getNumberValue(marketA?.mid ?? marketA?.last ?? marketA?.price),
          getNumberValue(marketB?.mid ?? marketB?.last ?? marketB?.price)
        );
        break;
      case 'bid':
        result = compareNullableNumbers(
          getNumberValue(marketA?.bid ?? marketA?.nativeBid),
          getNumberValue(marketB?.bid ?? marketB?.nativeBid)
        );
        break;
      case 'ask':
        result = compareNullableNumbers(
          getNumberValue(marketA?.ask ?? marketA?.nativeAsk),
          getNumberValue(marketB?.ask ?? marketB?.nativeAsk)
        );
        break;
      case 'quantity':
        result = compareNullableNumbers(getNumberValue(marketA?.bidQty), getNumberValue(marketB?.bidQty))
          || compareNullableNumbers(getNumberValue(marketA?.askQty), getNumberValue(marketB?.askQty));
        break;
      case 'timestamp':
        result = compareNullableNumbers(
          getNumberValue(marketA?.priceTimestamp || marketA?.timestamp),
          getNumberValue(marketB?.priceTimestamp || marketB?.timestamp)
        );
        break;
      case 'status':
        result = compareStrings(marketA?.status || 'pending', marketB?.status || 'pending');
        break;
      default:
        result = compareStrings(a.symbol, b.symbol);
        break;
    }

    return result * direction;
  });
};
