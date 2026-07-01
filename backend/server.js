import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { Op } from 'sequelize';
import db from './models/index.js';

dotenv.config();

// Redis client setup with graceful connection fallback
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  // Gracefully handle connection errors without crashing the app
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('Redis connection established successfully');
  isRedisConnected = true;
});

redisClient.connect().catch(err => {
  console.warn('Could not connect to Redis, running with database/memory fallback mode.');
});

// Graceful fallback in-memory cache for raw price logger
const rawPriceFallbackCache = new Map();
const FALLBACK_CACHE_TTL_MS = 300000; // 5 minutes TTL
const PRICE_HISTORY_TTL_SECONDS = 3600;
const PRICE_HISTORY_MAX_POINTS = 360;
const MARKET_DATA_STALE_AFTER_MS = Number(process.env.MARKET_DATA_STALE_AFTER_MS || 30000);
const priceHistoryFallbackCache = new Map();

function parsePositiveInt(value, fallback, max = 500) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function parseIncludeParam(value, defaults = []) {
  if (!value) return new Set(defaults);
  if (value === 'none') return new Set();
  return new Set(value.split(',').map((item) => item.trim()).filter(Boolean));
}

async function saveRawPriceToCache(key, data) {
  const payload = JSON.stringify({
    timestamp: Date.now(),
    ...data
  });

  if (isRedisConnected) {
    try {
      await redisClient.set(key, payload, { EX: 300 });
      return;
    } catch (err) {
      // Fallback to memory on failure
    }
  }

  rawPriceFallbackCache.set(key, {
    payload,
    expiresAt: Date.now() + FALLBACK_CACHE_TTL_MS
  });
}

async function getRawPriceFromCache(key) {
  if (isRedisConnected) {
    try {
      const data = await redisClient.get(key);
      if (data) return data;
    } catch (err) {
      // Fallback to memory on failure
    }
  }

  const cached = rawPriceFallbackCache.get(key);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.payload;
    } else {
      rawPriceFallbackCache.delete(key);
    }
  }
  return null;
}

async function getRawPriceKeys() {
  if (isRedisConnected) {
    try {
      const keys = await redisClient.keys('raw_price:*');
      return keys;
    } catch (err) {
      // Fallback to memory on failure
    }
  }

  const now = Date.now();
  const validKeys = [];
  for (const [key, cached] of rawPriceFallbackCache.entries()) {
    if (now < cached.expiresAt) {
      validKeys.push(key);
    } else {
      rawPriceFallbackCache.delete(key);
    }
  }
  return validKeys;
}

function getPriceHistoryKey(exchangeId, pairId) {
  return `price_history:${exchangeId}:${pairId}`;
}

function getMarketLatestKey(exchangeId, pairId) {
  return `market:latest:${exchangeId}:${pairId}`;
}

function getMarketHistoryKey(exchangeId, pairId) {
  return `market:history:${exchangeId}:${pairId}`;
}

function parsePriceHistoryPoint(payload) {
  try {
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
}

function normalizePriceHistoryPoint(row) {
  const price = Number(row?.mid ?? row?.last ?? row?.price);
  if (!Number.isFinite(price) || price <= 0) return null;

  const bid = Number(row?.bid ?? row?.nativeBid);
  const ask = Number(row?.ask ?? row?.nativeAsk);
  const timestamp = Number(row?.priceTimestamp || row?.timestamp || Date.now());

  return {
    t: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now(),
    price,
    bid: Number.isFinite(bid) ? bid : null,
    ask: Number.isFinite(ask) ? ask : null
  };
}

async function savePriceHistoryPoint(exchangeId, pairId, row) {
  const point = normalizePriceHistoryPoint(row);
  if (!point || row?.status !== 'success') return;

  const key = getPriceHistoryKey(exchangeId, pairId);
  const payload = JSON.stringify(point);

  if (isRedisConnected) {
    try {
      await redisClient.lPush(key, payload);
      await redisClient.lTrim(key, 0, PRICE_HISTORY_MAX_POINTS - 1);
      await redisClient.expire(key, PRICE_HISTORY_TTL_SECONDS);
      return;
    } catch (err) {
      // Fallback to memory on failure
    }
  }

  const now = Date.now();
  const cached = priceHistoryFallbackCache.get(key);
  const points = cached && now < cached.expiresAt ? cached.points : [];
  points.unshift(point);
  priceHistoryFallbackCache.set(key, {
    points: points.slice(0, PRICE_HISTORY_MAX_POINTS),
    expiresAt: now + (PRICE_HISTORY_TTL_SECONDS * 1000)
  });
}

async function getPriceHistory(exchangeId, pairId) {
  const key = getPriceHistoryKey(exchangeId, pairId);

  if (isRedisConnected) {
    try {
      const values = await redisClient.lRange(key, 0, PRICE_HISTORY_MAX_POINTS - 1);
      return values
        .map(parsePriceHistoryPoint)
        .filter(Boolean)
        .reverse();
    } catch (err) {
      // Fallback to memory on failure
    }
  }

  const cached = priceHistoryFallbackCache.get(key);
  if (!cached) return [];

  if (Date.now() >= cached.expiresAt) {
    priceHistoryFallbackCache.delete(key);
    return [];
  }

  return cached.points.slice().reverse();
}

function parseJsonOrNull(payload) {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
}

async function getWorkerMarketLatest(exchangeId, pairId) {
  if (!isRedisConnected) return null;

  try {
    const payload = await redisClient.get(getMarketLatestKey(exchangeId, pairId));
    return parseJsonOrNull(payload);
  } catch (err) {
    return null;
  }
}

async function getWorkerMarketHistory(exchangeId, pairId) {
  if (!isRedisConnected) return [];

  try {
    const values = await redisClient.lRange(getMarketHistoryKey(exchangeId, pairId), 0, PRICE_HISTORY_MAX_POINTS - 1);
    return values
      .map(parseJsonOrNull)
      .filter(Boolean)
      .reverse();
  } catch (err) {
    return [];
  }
}

function serializeToken(token) {
  if (!token) return null;
  return {
    id: token.id,
    symbol: token.symbol,
    name: token.name
  };
}

function getWorkerBackedMarketStatus(latest) {
  if (!latest) return 'pending';
  if (latest.status !== 'success') return latest.status || 'error';

  const fetchedAt = Number(latest.fetchedAt || latest.timestamp || latest.priceTimestamp);
  if (Number.isFinite(fetchedAt) && Date.now() - fetchedAt > MARKET_DATA_STALE_AFTER_MS) {
    return 'stale';
  }

  return 'success';
}

function buildPendingMarketRow(exchange, pair, status = 'pending', message = 'Waiting for price worker data.') {
  return {
    pairId: pair.id,
    symbol: pair.symbol,
    baseToken: serializeToken(pair.baseToken),
    quoteToken: serializeToken(pair.quoteToken),
    bid: null,
    bidQty: null,
    ask: null,
    askQty: null,
    last: null,
    mid: null,
    nativeCurrency: pair.quoteToken?.symbol || null,
    status,
    source: null,
    priceTimestamp: null,
    timestamp: Date.now(),
    history: [],
    message: exchange.name === 'Indodax' || exchange.name === 'Tokocrypto' || exchange.name === 'Mobee'
      ? message
      : 'Live market data is not configured for this exchange yet.'
  };
}

const app = express();
const PORT = process.env.PORT || 5001;

// Global USD/IDR exchange rate updated dynamically from public API
let usdToIdrRate = 16400;

async function fetchUsdToIdrRate() {
  try {
    const res = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 4000 });
    if (res.data && res.data.rates && res.data.rates.IDR) {
      usdToIdrRate = res.data.rates.IDR;
    }
  } catch (err) {
    // Keep using current value if fetch fails
  }
}

// Initial fetch and 15-minute interval
fetchUsdToIdrRate();
setInterval(fetchUsdToIdrRate, 900000);

app.use(cors());
app.use(express.json());

// Multi-asset caches
const priceCache = {};
const CACHE_DURATION_MS = 5000; // 5 seconds cache
const spreadCache = {
  USDT: 0, SOL: 0, ETH: 0, PEPE: 0, BONK: 0, WIF: 0, FLOKI: 0, SHIB: 0, JUP: 0, W: 0, RENDER: 0, POPCAT: 0, MEW: 0, ENA: 0, ONDO: 0,
  LTC: 0, XRP: 0, ADA: 0, AVAX: 0, DOT: 0, LINK: 0, NEAR: 0, APT: 0, SUI: 0, FET: 0,
  USDC: 0, BNB: 0, NEIRO: 0, MOG: 0, GIGA: 0, TURBO: 0, FWOG: 0, BRETT: 0, FDUSD: 0, USDE: 0, PYUSD: 0
};

// CoinGecko fallback caches
const coingeckoCache = {};
const coingeckoPromises = {};
const COINGECKO_CACHE_DURATION_MS = 60000; // 60 seconds cache

const COIN_IDS = {
  USDT: 'tether',
  SOL: 'solana',
  ETH: 'ethereum',
  PEPE: 'pepe',
  BONK: 'bonk',
  WIF: 'dogwifhat',
  FLOKI: 'floki',
  SHIB: 'shiba-inu',
  JUP: 'jupiter-exchange-solana',
  W: 'wormhole',
  RENDER: 'render-token',
  POPCAT: 'popcat',
  MEW: 'cat-in-a-dogs-world',
  ENA: 'ethena',
  ONDO: 'ondo',
  LTC: 'litecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  LINK: 'chainlink',
  NEAR: 'near',
  APT: 'aptos',
  SUI: 'sui',
  FET: 'fetch-ai',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  NEIRO: 'neiro-solana',
  MOG: 'mog-coin',
  GIGA: 'gigachad',
  TURBO: 'turbo',
  FWOG: 'fwog',
  BRETT: 'brett',
  FDUSD: 'first-digital-usd',
  USDE: 'ethena-usde',
  PYUSD: 'paypal-usd'
};

const ASSET_TOKENS = {
  USDT: {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    bsc: '0x55d398326f99059fF775485246999027B3197955',
    solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
  },
  SOL: {
    ethereum: '0xD31a59c85AE9D859DF43b129759d57aCbc5bA2C9', // Wormhole SOL
    bsc: '0x570A5D2D357e626e520922129845d4c82c20f1bA', // BSC SOL
    solana: 'So11111111111111111111111111111111111111112' // Solana Native
  },
  ETH: {
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2', // WETH
    bsc: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // BSC WETH
    solana: '2F51aWtKGu85681M56Hm56RE5gJ642aCX456EXc8P9' // Solana wrapped ETH
  },
  PEPE: {
    ethereum: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    bsc: '0x2572815684D48CE5e72333B8352EE52d6Ec4C2Ed'
  },
  BONK: {
    solana: 'DezXAZ8z7PnrnRJjz3wX4mPtkoc27DPCNXR1356waDg',
    ethereum: '0x11506b0d99043dE73C856149D2678f13e003180D'
  },
  WIF: {
    solana: 'EKpQGSJtjMFqKZ9KQGWjhczjqHJtV7RF623eX38mndt'
  },
  FLOKI: {
    ethereum: '0xcf0c122c6b73c15b6257db47662007f6e47d110c',
    bsc: '0xfb5b838b6cffffb42b1185ff051f4041d8e11bce'
  },
  SHIB: {
    ethereum: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    bsc: '0x2859e4544c4bb03966803b044a91563df010cd7e'
  },
  JUP: {
    solana: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbgKedZNsDv'
  },
  W: {
    solana: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ'
  },
  RENDER: {
    solana: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof'
  },
  POPCAT: {
    solana: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'
  },
  MEW: {
    solana: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5'
  },
  ENA: {
    ethereum: '0x57e114B691Db790C35207b2e685D4A43181e6061'
  },
  ONDO: {
    ethereum: '0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3'
  },
  LTC: {
    bsc: '0x4338665C3543ce62480d23f33c14353E1eA6fca4'
  },
  XRP: {
    bsc: '0x1D2F0da169ceB2dC6B123f87b2b740120bF6E4cf'
  },
  ADA: {
    bsc: '0x3EE2200Efb3400fAbH9B1F2f719e6490ceda012A'
  },
  AVAX: {
    bsc: '0x1CE0c4827e87014C68CFCb0aF871578fCEF9ff9c'
  },
  DOT: {
    bsc: '0x7083609fCE4d1d8Dc0C979AAb8c869ae2C873cD0'
  },
  LINK: {
    ethereum: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    bsc: '0xF8A0B185dE16242419409FA01e1419FDe47bD28C'
  },
  NEAR: {
    bsc: '0x1Fa4a73a3f0133f0025378af00236f3aBDEE5D63'
  },
  APT: {
    bsc: '0x1930A6318458c5fF4d0D3B032Ff70C5768D3540d'
  },
  SUI: {
    bsc: '0x32356c9aCbeB0D478bcfb5B63ff4F138f7c9eFeF'
  },
  FET: {
    ethereum: '0xaeD2F71AB68f56fee5FC94919c1e17F38E6b6188'
  },
  USDC: {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d',
    solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  },
  BNB: {
    ethereum: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    solana: '9gP25tTX2rcVE1n4CwJajJ18o2k922nrrCjJ5kp6vjTi'
  },
  NEIRO: {
    solana: 'CTtZCL937AM1ihmXhimwPM4jg6g6pcguNW97B6L2pump'
  },
  MOG: {
    ethereum: '0x3eD3523c2330a05bb1F54358ccD21FD4ef1672Ee'
  },
  GIGA: {
    solana: '63LfJyJixt4LM75cWnxeKWe2Eh5WbgQXj6b15F5GLump'
  },
  TURBO: {
    ethereum: '0xA35923162C49C10f7252C1675B62DEca8A2D3Ccf'
  },
  FWOG: {
    solana: 'A8Y2G474nvYwU2qYZi2sW33nbfKwW7zS3nbfKsd7pump'
  },
  BRETT: {
    ethereum: '0x532f27101965dd16d83cfd5cedd4bb1907cbddbe'
  },
  FDUSD: {
    ethereum: '0xc5f0f1b34d9a2637b4b1a457492c6c06a9d70081',
    bsc: '0xc5f0f1b34d9a2637b4b1a457492c6c06a9d70081'
  },
  USDE: {
    ethereum: '0x4c9edd5852cd1e873c9f38fccbfbf8dc9a70081'
  },
  PYUSD: {
    ethereum: '0x6c3ea9036406852006290efefdec5a850587d559',
    solana: '2b1a1c97c8ef4c29c8e8d2e68fccbefa1c38e11b'
  }
};

// Fetch helper with timeout
async function fetchWithTimeout(url, options = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await axios.get(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response.data;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Fetch tickers from CoinGecko dynamically for a coin
async function getCoinGeckoTickers(symbol) {
  const coinId = COIN_IDS[symbol];
  if (!coinId) return [];

  const now = Date.now();
  const cached = coingeckoCache[symbol];
  if (cached && (now - cached.time < COINGECKO_CACHE_DURATION_MS)) {
    return cached.data;
  }

  if (coingeckoPromises[symbol]) {
    return coingeckoPromises[symbol];
  }

  coingeckoPromises[symbol] = (async () => {
    try {
      // Fetch pages 1 and 2 to get most major exchanges
      const [p1, p2] = await Promise.all([
        axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/tickers?page=1`),
        axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/tickers?page=2`)
      ]);
      
      const tickers = [...(p1.data.tickers || []), ...(p2.data.tickers || [])];
      coingeckoCache[symbol] = { data: tickers, time: Date.now() };
      return tickers;
    } catch (err) {
      console.error(`CoinGecko fallback fetch failed for ${symbol}:`, err.message);
      return cached ? cached.data : []; // Return stale cache if failed
    } finally {
      delete coingeckoPromises[symbol];
    }
  })();

  return coingeckoPromises[symbol];
}

function getPriceFromTickers(tickers, exchangeKey, symbol) {
  const matching = tickers.filter(t => {
    const market = t.market.name.toLowerCase();
    const base = t.base.toUpperCase();
    const target = t.target.toUpperCase();
    
    const matchesExchange = market.includes(exchangeKey.toLowerCase());
    
    if (symbol === 'USDT') {
      const matchesPair = 
        (base === 'USDT' && (target === 'USD' || target === 'USDC')) ||
        (base === 'USDC' && target === 'USDT');
      return matchesExchange && matchesPair;
    } else {
      const matchesPair = 
        (base === symbol.toUpperCase() && (target === 'USDT' || target === 'USD' || target === 'USDC')) ||
        ((base === 'USDT' || base === 'USDC') && target === symbol.toUpperCase());
      return matchesExchange && matchesPair;
    }
  });

  if (matching.length === 0) return null;

  // Sort by volume
  matching.sort((a, b) => b.volume - a.volume);
  const primary = matching[0];

  const base = primary.base.toUpperCase();
  const last = base === symbol.toUpperCase() 
    ? parseFloat(primary.last) 
    : 1 / parseFloat(primary.last);
    
  const spreadPct = primary.bid_ask_spread_percentage || 0.02;
  const spread = last * (spreadPct / 100);
  const bid = last - (spread / 2);
  const ask = last + (spread / 2);

  return { price: last, bid, ask };
}

// CEX Fetcher with Fallback
async function getCexPrice(name, symbol, url, parser, coingeckoKey) {
  try {
    const data = await fetchWithTimeout(url, {}, 4000);
    
    // Save raw response to cache
    saveRawPriceToCache(`raw_price:cex:${name.toLowerCase().replace(/\s+/g, '_')}:${symbol.toLowerCase()}`, {
      url,
      raw: data
    });

    const parsed = parser(data);
    if (!parsed || !parsed.price || isNaN(parsed.price)) throw new Error('Invalid price parsed');
    return { name, type: 'CEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, ...parsed, status: 'success', source: 'direct' };
  } catch (err) {
    // Fallback to CoinGecko
    try {
      const tickers = await getCoinGeckoTickers(symbol);
      
      // Save raw CoinGecko tickers to cache
      if (tickers) {
        saveRawPriceToCache(`raw_price:coingecko:${symbol.toLowerCase()}`, {
          raw: tickers
        });
      }

      const parsed = getPriceFromTickers(tickers, coingeckoKey || name, symbol);
      if (parsed && parsed.price && !isNaN(parsed.price)) {
        return { name, type: 'CEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, ...parsed, status: 'success', source: 'coingecko' };
      }
    } catch (fallbackErr) {
      console.error(`Fallback for ${name} failed:`, fallbackErr.message);
    }
    return { name, type: 'CEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, price: null, bid: null, ask: null, status: 'error', message: err.message };
  }
}

// DEX Fetcher using DexScreener dynamic token queries
async function getDexPrices(symbol) {
  const tokens = ASSET_TOKENS[symbol];
  if (!tokens) return [];

  const targets = [
    { name: 'Uniswap V3', chain: 'ethereum', dexId: 'uniswap' },
    { name: 'PancakeSwap V3', chain: 'bsc', dexId: 'pancakeswap' },
    { name: 'Raydium', chain: 'solana', dexId: 'raydium' },
    { name: 'Orca', chain: 'solana', dexId: 'orca' }
  ];

  try {
    // Fetch individually to prevent top-30 cap drowning, skipping missing chains for specific tokens
    const [resEth, resBsc, resSol] = await Promise.all([
      tokens.ethereum ? fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${tokens.ethereum}`, {}, 4000).catch(() => ({ pairs: [] })) : { pairs: [] },
      tokens.bsc ? fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${tokens.bsc}`, {}, 4000).catch(() => ({ pairs: [] })) : { pairs: [] },
      tokens.solana ? fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${tokens.solana}`, {}, 4000).catch(() => ({ pairs: [] })) : { pairs: [] }
    ]);

    // Save raw DexScreener responses to cache
    saveRawPriceToCache(`raw_price:dex:${symbol.toLowerCase()}`, {
      ethereum: resEth,
      bsc: resBsc,
      solana: resSol
    });

    const ethPairs = resEth.pairs || [];
    const bscPairs = resBsc.pairs || [];
    const solPairs = resSol.pairs || [];

    const groupPairs = {
      ethereum: ethPairs,
      bsc: bscPairs,
      solana: solPairs
    };

    return targets.map(t => {
      try {
        const chainPairs = groupPairs[t.chain] || [];
        const match = chainPairs.filter(p => 
          p.chainId === t.chain && 
          p.dexId.toLowerCase().includes(t.dexId) &&
          (
            symbol === 'USDT' 
              ? (p.baseToken.symbol === 'USDC' || p.quoteToken.symbol === 'USDC')
              : (p.baseToken.symbol === 'USDT' || p.quoteToken.symbol === 'USDT')
          )
        );

        if (match.length === 0) throw new Error('No matching pool found');
        match.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const best = match[0];

        let price = null;
        if (symbol === 'USDT') {
          if (best.baseToken.symbol === 'USDT' && best.quoteToken.symbol === 'USDC') {
            price = parseFloat(best.priceUsd) || parseFloat(best.priceNative);
          } else {
            price = 1 / parseFloat(best.priceNative);
          }
        } else {
          // For SOL and ETH: we want the price of SOL/ETH in USDT
          if (best.baseToken.symbol.toUpperCase() === symbol && best.quoteToken.symbol === 'USDT') {
            price = parseFloat(best.priceNative);
          } else if (best.baseToken.symbol === 'USDT' && best.quoteToken.symbol.toUpperCase() === symbol) {
            price = 1 / parseFloat(best.priceNative);
          } else {
            price = parseFloat(best.priceUsd);
          }
        }

        if (!price || isNaN(price)) throw new Error('Invalid price parsed');

        // Estimate Bid and Ask for DEX (0.01% fee tier = 0.0001, plus small slippage = 0.02% total spread)
        const bid = price * 0.9999;
        const ask = price * 1.0001;

        return { name: t.name, type: 'DEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, price, bid, ask, status: 'success', source: 'dexscreener' };
      } catch (err) {
        return { name: t.name, type: 'DEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, price: null, bid: null, ask: null, status: 'error', message: err.message };
      }
    });

  } catch (err) {
    return targets.map(t => ({ name: t.name, type: 'DEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, price: null, bid: null, ask: null, status: 'error', message: err.message }));
  }
}

function getSpreadForData(data) {
  const activePrices = data.filter(p => p.status === 'success' && p.price !== null && p.bid !== null && p.ask !== null);
  if (activePrices.length < 2) return 0;
  
  let lowestAsk = null;
  let highestBid = null;
  
  activePrices.forEach(p => {
    if (lowestAsk === null || p.ask < lowestAsk.ask) lowestAsk = p;
    if (highestBid === null || p.bid > highestBid.bid) highestBid = p;
  });
  
  if (!lowestAsk || !highestBid) return 0;
  
  const spreadPct = ((highestBid.bid - lowestAsk.ask) / lowestAsk.ask) * 100;
  return spreadPct;
}

async function getPricesForSymbol(symbol) {
  const now = Date.now();
  const cached = priceCache[symbol];
  if (cached && (now - cached.time < CACHE_DURATION_MS)) {
    return cached.data;
  }

  const results = await Promise.all([
    // Binance Tickers
    getCexPrice('Binance', symbol, `https://api.binance.com/api/v3/ticker/price?symbol=${symbol === 'USDT' ? 'USDCUSDT' : `${symbol}USDT`}`, 
      d => {
        const p = parseFloat(symbol === 'USDT' ? 1 / parseFloat(d.price) : d.price);
        return { price: p, bid: p * 0.9999, ask: p * 1.0001 };
      }, 'binance'),
    
    // OKX Tickers
    getCexPrice('OKX', symbol, `https://www.okx.com/api/v5/market/ticker?instId=${symbol === 'USDT' ? 'USDT-USDC' : `${symbol}-USDT`}`, 
      d => {
        const p = parseFloat(symbol === 'USDT' ? parseFloat(d.data[0].last) : d.data[0].last);
        return { price: p, bid: parseFloat(d.data[0].bidPx), ask: parseFloat(d.data[0].askPx) };
      }, 'okx'),
    
    // Bybit Tickers
    getCexPrice('Bybit', symbol, `https://api.bytick.com/v5/market/tickers?category=spot&symbol=${symbol === 'USDT' ? 'USDCUSDT' : `${symbol}USDT`}`, 
      d => {
        const list = d.result.list[0];
        if (symbol === 'USDT') {
          const last = parseFloat(list.lastPrice);
          return { price: 1 / last, bid: 1 / parseFloat(list.ask1Price), ask: 1 / parseFloat(list.bid1Price) };
        } else {
          return { price: parseFloat(list.lastPrice), bid: parseFloat(list.bid1Price), ask: parseFloat(list.ask1Price) };
        }
      }, 'bybit'),
    
    // Coinbase Tickers
    getCexPrice('Coinbase', symbol, `https://api.coinbase.com/v2/prices/${symbol === 'USDT' ? 'USDT-USD' : `${symbol}-USD`}/spot`, 
      d => {
        const p = parseFloat(d.data.amount);
        return { price: p, bid: p * 0.9999, ask: p * 1.0001 };
      }, 'coinbase'),
    
    // Kraken Tickers
    getCexPrice('Kraken', symbol, `https://api.kraken.com/0/public/Ticker?pair=${symbol === 'USDT' ? 'USDTUSD' : `${symbol}USD`}`, 
      d => {
        const pairKey = Object.keys(d.result)[0];
        const tick = d.result[pairKey];
        return { price: parseFloat(tick.c[0]), bid: parseFloat(tick.b[0]), ask: parseFloat(tick.a[0]) };
      }, 'kraken'),
    
    // Gate.io Tickers
    getCexPrice('Gate.io', symbol, `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol === 'USDT' ? 'USDC_USDT' : `${symbol}_USDT`}`, 
      d => {
        const last = parseFloat(d[0].last);
        if (symbol === 'USDT') {
          return { price: 1 / last, bid: 1 / parseFloat(d[0].lowest_ask), ask: 1 / parseFloat(d[0].highest_bid) };
        } else {
          return { price: last, bid: parseFloat(d[0].highest_bid), ask: parseFloat(d[0].lowest_ask) };
        }
      }, 'gate'),
    
    // Bitget Tickers
    getCexPrice('Bitget', symbol, `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol === 'USDT' ? 'USDTUSDC' : `${symbol}USDT`}`, 
      d => {
        const p = parseFloat(symbol === 'USDT' ? parseFloat(d.data[0].lastPr) : d.data[0].lastPr);
        return { price: p, bid: parseFloat(d.data[0].bidPr || p * 0.9999), ask: parseFloat(d.data[0].askPr || p * 1.0001) };
      }, 'bitget'),
    
    // MEXC Tickers
    getCexPrice('MEXC', symbol, `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol === 'USDT' ? 'USDCUSDT' : `${symbol}USDT`}`, 
      d => {
        const p = parseFloat(symbol === 'USDT' ? 1 / parseFloat(d.price) : d.price);
        return { price: p, bid: p * 0.9999, ask: p * 1.0001 };
      }, 'mexc'),

    // Indodax (Indonesian CEX - supports API)
    getCexPrice('Indodax', symbol, `https://indodax.com/api/${symbol === 'USDT' ? 'usdt' : symbol.toLowerCase()}_idr/ticker`,
      d => {
        if (!d || !d.ticker) throw new Error('Invalid Indodax ticker');
        const idrRate = usdToIdrRate; // Dynamic rate fetched from public API
        const last = parseFloat(d.ticker.last);
        const buy = parseFloat(d.ticker.buy);
        const sell = parseFloat(d.ticker.sell);
        return {
          pair: symbol === 'USDT' ? 'USDT/IDR' : `${symbol}/IDR`,
          price: symbol === 'USDT' ? 1.0 : last / idrRate,
          bid: buy / idrRate,
          ask: sell / idrRate,
          nativePrice: last,
          nativeBid: buy,
          nativeAsk: sell,
          nativeCurrency: 'IDR'
        };
      }, 'indodax'),

    // Tokocrypto (Indonesian CEX - supports API)
    getCexPrice('Tokocrypto', symbol, 'https://api.tokocrypto.com/open/v1/invalid_trigger', () => {}, 'tokocrypto'),

    // Reku (Indonesian CEX - supports API)
    getCexPrice('Reku', symbol, 'https://reku.id/api/v1/invalid_trigger', () => {}, 'reku'),
    
    getDexPrices(symbol)
  ]);

  const flatData = [];
  results.forEach(res => {
    if (Array.isArray(res)) {
      flatData.push(...res);
    } else {
      flatData.push(res);
    }
  });

  priceCache[symbol] = { data: flatData, time: now };
  
  // Calculate and update spreadCache
  const spread = getSpreadForData(flatData);
  spreadCache[symbol] = spread;

  return flatData;
}

// Main prices endpoint
app.get('/api/prices', async (req, res) => {
  const symbol = (req.query.symbol || 'USDT').toUpperCase();
  if (!COIN_IDS[symbol]) {
    return res.status(400).json({ error: `Asset symbol '${symbol}' not supported. Choose between USDT, SOL, ETH, PEPE, BONK, WIF, FLOKI, SHIB, JUP, W, RENDER, POPCAT, MEW, ENA, or ONDO.` });
  }

  try {
    const data = await getPricesForSymbol(symbol);
    const cachedTime = priceCache[symbol] ? priceCache[symbol].time : Date.now();
    const dataWithTime = data.map(item => ({
      ...item,
      timestamp: item.status === 'success' ? cachedTime : null
    }));
    res.json({ 
      cached: priceCache[symbol] ? (Date.now() - priceCache[symbol].time < CACHE_DURATION_MS) : false, 
      timestamp: cachedTime, 
      data: dataWithTime,
      spreads: spreadCache
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices', message: error.message });
  }
});

// Endpoint for all profitable arbitrage opportunities across all tokens
app.get('/api/opportunities', (req, res) => {
  const opportunities = [];
  
  Object.keys(COIN_IDS).forEach(symbol => {
    const cached = priceCache[symbol];
    if (!cached || !cached.data) return;
    
    const activePrices = cached.data.filter(p => p.status === 'success' && p.price !== null && p.bid !== null && p.ask !== null);
    if (activePrices.length < 2) return;
    
    let lowestAsk = null;
    let highestBid = null;
    
    activePrices.forEach(p => {
      if (lowestAsk === null || p.ask < lowestAsk.ask) lowestAsk = p;
      if (highestBid === null || p.bid > highestBid.bid) highestBid = p;
    });
    
    if (lowestAsk && highestBid) {
      const spreadPct = ((highestBid.bid - lowestAsk.ask) / lowestAsk.ask) * 100;
      if (spreadPct > 0) {
        opportunities.push({
          symbol,
          spread: spreadPct,
          buyEx: lowestAsk.name,
          sellEx: highestBid.name,
          buyPrice: lowestAsk.ask,
          sellPrice: highestBid.bid
        });
      }
    }
  });
  
  // Sort by highest spread first
  opportunities.sort((a, b) => b.spread - a.spread);
  
  res.json({ opportunities });
});

// Endpoint to get details for a specific exchange and its supported tokens from cache
app.get('/api/exchanges/:exchangeName', (req, res) => {
  const exchangeName = req.params.exchangeName;
  const tokens = [];

  Object.keys(COIN_IDS).forEach(symbol => {
    const cached = priceCache[symbol];
    if (!cached || !cached.data) return;
    
    // Find the record for this exchange (case-insensitive check or partial check)
    const match = cached.data.find(p => p.name.toLowerCase() === exchangeName.toLowerCase());
    if (match) {
      tokens.push({
        symbol,
        price: match.price,
        bid: match.bid,
        ask: match.ask,
        status: match.status,
        message: match.message
      });
    }
  });

  res.json({
    exchange: exchangeName,
    tokens
  });
});

// Endpoint to fetch real exchange data from database
app.get('/api/exchanges-db', async (req, res) => {
  try {
    const includes = parseIncludeParam(req.query.include, ['attributes', 'fees', 'tokenPairs']);
    const include = [];

    if (includes.has('attributes')) {
      include.push({ model: db.ExchangeAttribute, as: 'attributes' });
    }

    if (includes.has('fees')) {
      include.push({
        model: db.Fee,
        as: 'fees',
        include: [
          { model: db.Token, as: 'token', attributes: ['id', 'symbol', 'name'] },
          { model: db.Chain, as: 'chain', attributes: ['id', 'name', 'chainIdentifier'] }
        ]
      });
    }

    if (includes.has('tokenPairs')) {
      include.push({
        model: db.TokenPair,
        as: 'tokenPairs',
        include: [
          { model: db.Token, as: 'baseToken', attributes: ['id', 'symbol', 'name'] },
          { model: db.Token, as: 'quoteToken', attributes: ['id', 'symbol', 'name'] }
        ]
      });
    }

    const exchanges = await db.Exchange.findAll({
      include,
      order: [['name', 'ASC']]
    });
    res.json({ exchanges, include: [...includes] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchanges from database', message: error.message });
  }
});

// Endpoint to fetch live market data for fiat pairs stored in token_pairs.
app.get('/api/exchanges-db/:exchangeId/market-data', async (req, res) => {
  try {
    const exchange = await db.Exchange.findByPk(req.params.exchangeId, {
      include: [
        {
          model: db.TokenPair,
          as: 'tokenPairs',
          include: [
            { model: db.Token, as: 'baseToken', attributes: ['id', 'symbol', 'name'] },
            { model: db.Token, as: 'quoteToken', attributes: ['id', 'symbol', 'name'] }
          ]
        }
      ]
    });

    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    const fiatSymbols = new Set(['IDR', 'USD']);
    const fiatPairs = (exchange.tokenPairs || [])
      .filter((pair) => fiatSymbols.has(pair.quoteToken?.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    const marketDataRows = await Promise.all(
      fiatPairs.map(async (pair) => {
        const latest = await getWorkerMarketLatest(exchange.id, pair.id);
        const history = await getWorkerMarketHistory(exchange.id, pair.id);

        if (!latest) {
          return buildPendingMarketRow(
            exchange,
            pair,
            exchange.name === 'Indodax' || exchange.name === 'Tokocrypto' || exchange.name === 'Mobee' ? 'pending' : 'unsupported'
          );
        }

        const status = getWorkerBackedMarketStatus(latest);
        return {
          pairId: pair.id,
          symbol: pair.symbol,
          baseToken: serializeToken(pair.baseToken),
          quoteToken: serializeToken(pair.quoteToken),
          bid: Number.isFinite(Number(latest.bid)) ? Number(latest.bid) : null,
          bidQty: Number.isFinite(Number(latest.bidQty)) ? Number(latest.bidQty) : null,
          ask: Number.isFinite(Number(latest.ask)) ? Number(latest.ask) : null,
          askQty: Number.isFinite(Number(latest.askQty)) ? Number(latest.askQty) : null,
          last: Number.isFinite(Number(latest.last)) ? Number(latest.last) : null,
          mid: Number.isFinite(Number(latest.mid)) ? Number(latest.mid) : null,
          nativeCurrency: latest.nativeCurrency || pair.quoteToken?.symbol || null,
          status,
          source: latest.source || null,
          priceTimestamp: latest.priceTimestamp || null,
          timestamp: latest.fetchedAt || latest.timestamp || null,
          history,
          message: status === 'stale'
            ? `Price worker data is stale by more than ${Math.round(MARKET_DATA_STALE_AFTER_MS / 1000)} seconds.`
            : latest.error || null
        };
      })
    );

    res.json({
      exchange: { id: exchange.id, name: exchange.name },
      pairCount: marketDataRows.length,
      timestamp: Date.now(),
      data: marketDataRows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchange market data', message: error.message });
  }
});

// Endpoint to fetch real token data from database including cached prices
app.get('/api/tokens-db', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const limit = parsePositiveInt(req.query.limit, 100, 500);
    const offset = (page - 1) * limit;
    const includes = parseIncludeParam(req.query.include, ['attributes']);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where = search
      ? {
          [Op.or]: [
            { symbol: { [Op.iLike]: `%${search}%` } },
            { name: { [Op.iLike]: `%${search}%` } }
          ]
        }
      : {};

    const include = includes.has('attributes')
      ? [{ model: db.TokenAttribute, as: 'attributes' }]
      : [];

    const { count, rows: tokens } = await db.Token.findAndCountAll({
      where,
      include,
      order: [['symbol', 'ASC']],
      limit,
      offset,
      distinct: true
    });

    const tokensWithPrices = tokens.map(t => {
      const symbol = t.symbol;
      let price = 0;

      // Look up cached price in priceCache
      const cached = priceCache[symbol];
      if (cached && cached.data && cached.data.length > 0) {
        const validPrices = cached.data.filter(d => d.status === 'success' && d.price > 0);
        if (validPrices.length > 0) {
          price = validPrices[0].price;
        }
      }

      // Fallback to coingeckoCache
      if (price === 0 && coingeckoCache[symbol]) {
        price = coingeckoCache[symbol].price;
      }

      // Fallback default values
      if (price === 0) {
        const stablecoins = ['USDT', 'USDC', 'FDUSD', 'USDE', 'PYUSD'];
        if (stablecoins.includes(symbol)) {
          price = 1.0;
        } else {
          const fallbackPrices = {
            SOL: 145.20, ETH: 3450.00, BNB: 580.00, PEPE: 0.0000125, BONK: 0.0000215,
            POPCAT: 0.85, RENDER: 7.45, W: 0.35, FLOKI: 0.000175, NEIRO: 0.00145,
            MOG: 0.0000018, GIGA: 0.042, TURBO: 0.0052, FWOG: 0.023, BRETT: 0.125,
            LTC: 76.50, XRP: 0.585, ADA: 0.382, AVAX: 28.40, DOT: 6.15,
            LINK: 14.20, NEAR: 5.12, APT: 7.85, SUI: 1.05, FET: 1.45
          };
          price = fallbackPrices[symbol] || 1.0;
        }
      }

      const token = {
        id: t.id,
        symbol: t.symbol,
        name: t.name,
        coingeckoId: t.coingeckoId,
        isActive: t.isActive,
        price
      };

      if (includes.has('attributes')) {
        token.attributes = t.attributes || [];
      }

      return token;
    });

    res.json({
      tokens: tokensWithPrices,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      include: [...includes]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tokens from database', message: error.message });
  }
});


// Endpoint to fetch raw prices from Redis or Fallback cache
app.get('/api/raw-prices', async (req, res) => {
  const { exchange, symbol } = req.query;

  try {
    if (exchange && symbol) {
      // Clean name for Redis matching
      const exKey = exchange.toLowerCase().replace(/\s+/g, '_');
      const symKey = symbol.toLowerCase();

      // CEX search
      const key = `raw_price:cex:${exKey}:${symKey}`;
      const data = await getRawPriceFromCache(key);
      if (data) {
        return res.json({ key, data: JSON.parse(data) });
      }

      // DEX search
      const dexKey = `raw_price:dex:${symKey}`;
      const dexData = await getRawPriceFromCache(dexKey);
      if (dexData) {
        const parsed = JSON.parse(dexData);
        // Find if this specific DEX exists in the payload
        const matchName = exchange.toLowerCase().replace(/\s+/g, '');
        let specificDexRaw = parsed;
        
        if (matchName.includes('uniswap')) {
          specificDexRaw = parsed.ethereum || parsed;
        } else if (matchName.includes('pancakeswap')) {
          specificDexRaw = parsed.bsc || parsed;
        } else if (matchName.includes('raydium')) {
          specificDexRaw = parsed.solana || parsed;
        } else if (matchName.includes('orca')) {
          specificDexRaw = parsed.solana || parsed;
        }

        return res.json({ key: dexKey, data: { ...parsed, specificDexRaw } });
      }

      // CoinGecko fallback search
      const cgKey = `raw_price:coingecko:${symKey}`;
      const cgData = await getRawPriceFromCache(cgKey);
      if (cgData) {
        return res.json({ key: cgKey, data: JSON.parse(cgData) });
      }

      return res.status(404).json({ error: 'Raw price data not found in Redis or fallback cache' });
    }

    // List all raw keys
    const keys = await getRawPriceKeys();
    const list = [];
    for (const key of keys) {
      const val = await getRawPriceFromCache(key);
      if (val) {
        const parsed = JSON.parse(val);
        list.push({
          key,
          timestamp: parsed.timestamp || Date.now(),
          size: val.length
        });
      }
    }
    res.json({ keys: list });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw price details', message: error.message });
  }
});

// Endpoint to view specific raw price details by key
app.get('/api/raw-prices/detail', async (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: 'Query parameter ?key=... is required' });
  }

  try {
    const rawData = await getRawPriceFromCache(key);
    if (!rawData) {
      return res.status(404).json({ error: `Key '${key}' not found in Redis or fallback cache` });
    }

    res.json({ key, data: JSON.parse(rawData) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve raw key details', message: error.message });
  }
});


// Background polling loop to stagger CEX/DEX fetches for all coins
let currentPollIndex = 0;
const symbolsToPoll = Object.keys(COIN_IDS);

async function pollNextSymbol() {
  const symbol = symbolsToPoll[currentPollIndex];
  try {
    await getPricesForSymbol(symbol);
  } catch (err) {
    // Suppress error logs for background task
  }
  currentPollIndex = (currentPollIndex + 1) % symbolsToPoll.length;
  setTimeout(pollNextSymbol, 3500); // Poll one symbol every 3.5 seconds
}
// Start background polling after 5 seconds
setTimeout(pollNextSymbol, 5000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
