export const normalizeMarketSymbol = (symbol) => String(symbol || '')
  .trim()
  .toUpperCase()
  .replace('/', '_')
  .replace('-', '_');

export const formatNativeMarketPrice = (value, currency = 'IDR') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const numericValue = Number(value);

  if (currency === 'IDR') {
    return 'Rp ' + numericValue.toLocaleString('id-ID', {
      minimumFractionDigits: numericValue < 1 ? 4 : 0,
      maximumFractionDigits: numericValue < 1 ? 8 : 2
    });
  }

  return `${currency} ${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: numericValue < 1 ? 4 : 2,
    maximumFractionDigits: numericValue < 1 ? 8 : 6
  })}`;
};

export const formatMarketPriceTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
