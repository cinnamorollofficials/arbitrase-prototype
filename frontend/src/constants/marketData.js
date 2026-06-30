export const defaultSymbols = ['USDT', 'SOL', 'ETH'];

export const COIN_ICONS = {
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  POPCAT: 'https://assets.coingecko.com/coins/images/36766/small/popcat.png',
  RENDER: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
  W: 'https://assets.coingecko.com/coins/images/35514/small/wormhole.png',
  FLOKI: 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png',
  NEIRO: 'https://assets.coingecko.com/coins/images/39392/small/NEIRO.png',
  MOG: 'https://assets.coingecko.com/coins/images/31059/small/mog.png',
  GIGA: 'https://assets.coingecko.com/coins/images/36477/small/gigachad.png',
  TURBO: 'https://assets.coingecko.com/coins/images/29445/small/turbo.png',
  FWOG: 'https://assets.coingecko.com/coins/images/39272/small/fwog.png',
  BRETT: 'https://assets.coingecko.com/coins/images/36310/small/brett.png',
  FDUSD: 'https://assets.coingecko.com/coins/images/31079/small/firstdigital.png',
  USDE: 'https://assets.coingecko.com/coins/images/33613/small/USDE.png',
  PYUSD: 'https://assets.coingecko.com/coins/images/31212/small/PYUSD.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-link.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.png',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.png',
  FET: 'https://assets.coingecko.com/coins/images/5681/small/Fetch.png',
};

export const COIN_META_LOOKUP = {
  USDC: { category: 'STABLE' },
  USDT: { category: 'STABLE' },
  SOL: { category: 'FLUKTUATIF' },
  ETH: { category: 'FLUKTUATIF' },
  BNB: { category: 'FLUKTUATIF' },
  PEPE: { category: 'MICIN' },
  BONK: { category: 'MICIN' },
  POPCAT: { category: 'MICIN' },
  RENDER: { category: 'FLUKTUATIF' },
  W: { category: 'FLUKTUATIF' },
  FLOKI: { category: 'MICIN' },
  NEIRO: { category: 'MICIN' },
  MOG: { category: 'MICIN' },
  GIGA: { category: 'MICIN' },
  TURBO: { category: 'FLUKTUATIF' },
  FWOG: { category: 'MICIN' },
  BRETT: { category: 'FLUKTUATIF' },
  FDUSD: { category: 'STABLE' },
  USDE: { category: 'STABLE' },
  PYUSD: { category: 'STABLE' },
  LTC: { category: 'FLUKTUATIF' },
  XRP: { category: 'FLUKTUATIF' },
  ADA: { category: 'FLUKTUATIF' },
  AVAX: { category: 'FLUKTUATIF' },
  DOT: { category: 'FLUKTUATIF' },
  LINK: { category: 'FLUKTUATIF' },
  NEAR: { category: 'FLUKTUATIF' },
  APT: { category: 'FLUKTUATIF' },
  SUI: { category: 'FLUKTUATIF' },
  FET: { category: 'FLUKTUATIF' },
};

export const EXCHANGE_ICONS = {
  // CEX
  'Binance': 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
  'Bybit': 'https://assets.coingecko.com/markets/images/698/small/bybit_spot.png',
  'Gate.io': 'https://assets.coingecko.com/markets/images/60/small/gate_io_logo1.jpg',
  'OKX': 'https://assets.coingecko.com/markets/images/96/small/WeChat_Image_20220117220452.png',
  'Kraken': 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg',
  'KuCoin': 'https://assets.coingecko.com/markets/images/61/small/kucoin.png',
  'Coinbase': 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png',
  'HTX': 'https://assets.coingecko.com/markets/images/25/small/huobi.jpg',
  'Indodax': 'https://coin-images.coingecko.com/markets/images/3/large/logogram-Indodax-new-_JPG_format.jpg',
  'Tokocrypto': 'https://coin-images.coingecko.com/markets/images/635/large/tokocrypto.png',
  'Reku': 'https://coin-images.coingecko.com/markets/images/1029/large/reku.png',
  // DEX
  'Raydium': 'https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg',
  'Uniswap': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  'PancakeSwap': 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
  'Orca': 'https://assets.coingecko.com/coins/images/17687/small/sunset-orca-icon.png',
  'Curve': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  'SushiSwap': 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  'dYdX': 'https://assets.coingecko.com/coins/images/17500/small/hjnIm9bV.jpg',
  'Jupiter': 'https://assets.coingecko.com/coins/images/34188/small/jup.png',
};

export const SYMBOL_COLORS = {
  USDC: '#2775CA', USDT: '#26A17B', SOL: '#9945FF', ETH: '#627EEA',
  BNB: '#F0B90B', PEPE: '#4CAF50', BONK: '#F57C00', POPCAT: '#78909C',
  RENDER: '#FF007A', W: '#9C27B0', FLOKI: '#FFB300', NEIRO: '#FF6F00',
  MOG: '#E91E63', GIGA: '#3F51B5', TURBO: '#00BCD4', FWOG: '#388E3C',
  BRETT: '#5D4037', FDUSD: '#1565C0', USDE: '#37474F', PYUSD: '#1976D2',
};

export const EXCHANGES_LIST = [
  { name: 'Binance', type: 'CEX', local: false },
  { name: 'Bybit', type: 'CEX', local: false },
  { name: 'Gate.io', type: 'CEX', local: false },
  { name: 'OKX', type: 'CEX', local: false },
  { name: 'Kraken', type: 'CEX', local: false },
  { name: 'KuCoin', type: 'CEX', local: false },
  { name: 'Coinbase', type: 'CEX', local: false },
  { name: 'HTX', type: 'CEX', local: false },
  { name: 'Bitget', type: 'CEX', local: false },
  { name: 'MEXC', type: 'CEX', local: false },
  { name: 'Indodax', type: 'CEX', local: true },
  { name: 'Tokocrypto', type: 'CEX', local: true },
  { name: 'Reku', type: 'CEX', local: true },
  { name: 'Uniswap V3 (Ethereum)', type: 'DEX', local: false },
  { name: 'PancakeSwap V3 (BSC)', type: 'DEX', local: false },
  { name: 'Raydium (Solana)', type: 'DEX', local: false },
  { name: 'Orca (Solana)', type: 'DEX', local: false }
];

export const EXCHANGE_API_INFO = {
  Binance: {
    apis: 'REST API v3, Spot WebSocket Streams, Orderbook API',
    latency: '45ms',
    unlisted: ['BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'TRX', 'LINK']
  },
  Bybit: {
    apis: 'V5 REST Market, V5 WebSocket Spot, Private Order API',
    latency: '62ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'TON', 'XRP', 'SHIB', 'ADA', 'AVAX', 'DOT', 'LINK']
  },
  'Gate.io': {
    apis: 'REST API v4, Spot WebSocket v4, Trading API v4',
    latency: '110ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'TON', 'XRP', 'SHIB', 'ADA', 'AVAX', 'DOT', 'LINK']
  },
  OKX: {
    apis: 'REST API v5, Spot WS Public, WS Private Order',
    latency: '58ms',
    unlisted: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'TRX']
  },
  Kraken: {
    apis: 'REST v1 Spot, WebSocket Spot v2',
    latency: '95ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'ATOM']
  },
  KuCoin: {
    apis: 'REST Spot API v1, WebSocket Public feeds',
    latency: '105ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'SHIB', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'TRX']
  },
  Coinbase: {
    apis: 'Advanced Trade REST, WebSocket Feed v3',
    latency: '78ms',
    unlisted: ['BTC', 'ETH', 'ADA', 'XRP', 'DOGE', 'SOL', 'DOT', 'LINK', 'AVAX', 'MATIC']
  },
  HTX: {
    apis: 'REST V1 Spot, WebSocket Spot feeds',
    latency: '128ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'SHIB', 'TRX', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK']
  },
  Indodax: {
    apis: 'V2 Public API (Ticker/Orderbook), Private API (Rupiah Transact)',
    latency: '24ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'TRX', 'ADA', 'XRP', 'LTC', 'FIL', 'DOT', 'LINK']
  },
  Tokocrypto: {
    apis: 'Tokocrypto Open API v1 (Binance Cloud), Spot WS',
    latency: '30ms',
    unlisted: ['BTC', 'ETH', 'BNB', 'DOGE', 'TRX', 'XRP', 'ADA', 'LTC', 'DOT', 'LINK']
  },
  Reku: {
    apis: 'Reku Public API v1, Private Account API',
    latency: '34ms',
    unlisted: ['BTC', 'ETH', 'DOGE', 'ADA', 'XRP', 'LTC', 'DOT', 'LINK', 'UNI', 'ALGO']
  },
  Bitget: {
    apis: 'REST Spot v2, WebSocket Spot Public',
    latency: '78ms',
    unlisted: ['BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'TRX', 'LINK']
  },
  MEXC: {
    apis: 'REST Spot v3, WebSocket Market Streams',
    latency: '92ms',
    unlisted: ['BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'TRX', 'LINK']
  },
  'Uniswap V3 (Ethereum)': {
    apis: 'Ethereum JSON-RPC Query, Uniswap V3 Smart Contract Router',
    latency: '15ms (Ethereum RPC)',
    unlisted: ['WBTC', 'DAI', 'UNI', 'LINK', 'AAVE', 'MKR', 'GRT', 'LDO', 'CRV', 'COMP']
  },
  'PancakeSwap V3 (BSC)': {
    apis: 'BSC JSON-RPC Router, Pancake V3 Smart Contracts',
    latency: '18ms (BSC RPC)',
    unlisted: ['CAKE', 'BUSD', 'WBNB', 'DOT', 'XRP', 'ADA', 'LINK', 'LTC', 'DOGE', 'TRX']
  },
  'Raydium (Solana)': {
    apis: 'Solana RPC JSON-RPC Node, Raydium AMM Contract Router',
    latency: '22ms (Solana RPC)',
    unlisted: ['PYTH', 'JITO', 'BOME', 'SLERF', 'WIF', 'BONK', 'POPCAT', 'MEW', 'JUP', 'W']
  },
  'Orca (Solana)': {
    apis: 'Solana RPC JSON-RPC Node, Orca Whirlpool Smart Contracts',
    latency: '24ms (Solana RPC)',
    unlisted: ['PYTH', 'JITO', 'BOME', 'SLERF', 'WIF', 'BONK', 'POPCAT', 'MEW', 'JUP', 'W']
  }
};
