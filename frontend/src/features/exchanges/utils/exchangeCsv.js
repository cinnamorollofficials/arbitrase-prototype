import { escapeCsvValue } from '../../../utils/csv';

const EXCHANGE_MARKET_CSV_HEADERS = [
  'Exchange',
  'Pair',
  'Base Symbol',
  'Base Name',
  'Quote Symbol',
  'Last / Mid',
  'Bid',
  'Ask',
  'Bid Qty',
  'Ask Qty',
  'Price Timestamp',
  'Status',
  'Source'
];

export const buildExchangeMarketCsvRows = ({ exchange, pairs, getMarketRow }) => {
  return pairs.map((pair) => {
    const market = getMarketRow(pair);
    const priceTimestamp = market?.priceTimestamp || market?.timestamp || null;

    return [
      exchange?.name || '',
      pair.symbol || '',
      pair.baseToken?.symbol || '',
      pair.baseToken?.name || '',
      pair.quoteToken?.symbol || '',
      market?.mid ?? market?.last ?? market?.price ?? '',
      market?.bid ?? market?.nativeBid ?? '',
      market?.ask ?? market?.nativeAsk ?? '',
      market?.bidQty ?? '',
      market?.askQty ?? '',
      priceTimestamp ? new Date(priceTimestamp).toISOString() : '',
      market?.status || 'pending',
      market?.source || ''
    ];
  });
};

export const buildExchangeMarketCsv = ({ exchange, pairs, getMarketRow }) => {
  const rows = buildExchangeMarketCsvRows({ exchange, pairs, getMarketRow });

  return [EXCHANGE_MARKET_CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
};

export const getExchangeMarketCsvFilename = (exchange) => {
  const exchangeName = String(exchange?.name || 'exchange')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const dateStamp = new Date().toISOString().slice(0, 10);

  return `${exchangeName}-market-data-${dateStamp}.csv`;
};

export const downloadExchangeMarketCsv = ({ exchange, pairs, getMarketRow }) => {
  if (pairs.length === 0) return;

  const csv = buildExchangeMarketCsv({ exchange, pairs, getMarketRow });
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getExchangeMarketCsvFilename(exchange);
  link.click();
  URL.revokeObjectURL(url);
};
