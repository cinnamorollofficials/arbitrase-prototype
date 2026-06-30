export const getHeaderGradient = (symbol) => {
  switch (symbol) {
    case 'SOL':
      return 'linear-gradient(135deg, #14F195, #9945FF)';
    case 'ETH':
      return 'linear-gradient(135deg, #627EEA, #C0CEFF)';
    case 'PEPE':
      return 'linear-gradient(135deg, #4CAF50, #81C784)';
    case 'BONK':
      return 'linear-gradient(135deg, #F57C00, #FFB74D)';
    case 'WIF':
      return 'linear-gradient(135deg, #9E9E9E, #E0E0E0)';
    case 'FLOKI':
      return 'linear-gradient(135deg, #FFB300, #FFE082)';
    case 'SHIB':
      return 'linear-gradient(135deg, #FF5722, #FFAB91)';
    case 'JUP':
      return 'linear-gradient(135deg, #00B0FF, #00E5FF)';
    case 'W':
      return 'linear-gradient(135deg, #9C27B0, #E040FB)';
    case 'RENDER':
      return 'linear-gradient(135deg, #FF007A, #FF7BB8)';
    case 'POPCAT':
      return 'linear-gradient(135deg, #78909C, #B0BEC5)';
    case 'MEW':
      return 'linear-gradient(135deg, #00ACC1, #80DEEA)';
    case 'ENA':
      return 'linear-gradient(135deg, #212121, #757575)';
    case 'ONDO':
      return 'linear-gradient(135deg, #26A69A, #80CBC4)';
    default:
      return 'linear-gradient(135deg, #a2c9ff, #dcbce2)';
  }
};

export const formatRupiah = (usdVal, rate) => {
  if (usdVal === null || usdVal === undefined || isNaN(usdVal)) return '';
  const idrVal = usdVal * rate;
  if (idrVal < 0.01) {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  } else if (idrVal < 10) {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } else {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
};

export const formatCapital = (usdVal) => {
  if (usdVal === null || usdVal === undefined || isNaN(usdVal)) return '-';
  const val = parseFloat(usdVal);
  if (val >= 1e9) {
    return `$${(val / 1e9).toFixed(1)}B USD`;
  } else if (val >= 1e6) {
    return `$${(val / 1e6).toFixed(1)}M USD`;
  } else {
    return `$${val.toLocaleString('en-US')}`;
  }
};

export const getCapitalTier = (usdVal) => {
  if (usdVal === null || usdVal === undefined || isNaN(usdVal)) return { label: 'Unknown TVL', color: '#78909c' };
  const val = parseFloat(usdVal);
  if (val >= 10e9) {
    return { label: 'Tier 1 Reserves', color: '#10b981' };
  } else if (val >= 1e9) {
    return { label: 'Tier 2 Reserves', color: '#3b82f6' };
  } else if (val >= 100e6) {
    return { label: 'Tier 3 Reserves', color: '#f59e0b' };
  } else {
    return { label: 'Tier 4 Reserves', color: '#ef5350' };
  }
};

export const getRatingStatus = (ratingVal) => {
  if (ratingVal === null || ratingVal === undefined || isNaN(ratingVal)) return { label: 'Unrated', color: '#78909c' };
  const val = parseFloat(ratingVal);
  if (val >= 9.0) {
    return { label: 'Highly Credible', color: '#10b981' };
  } else if (val >= 8.0) {
    return { label: 'Credible', color: '#3b82f6' };
  } else if (val >= 7.0) {
    return { label: 'Moderate', color: '#f59e0b' };
  } else {
    return { label: 'Risky / Low Trust', color: '#ef5350' };
  }
};
