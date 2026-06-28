import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Multi-asset caches
const priceCache = {};
const CACHE_DURATION_MS = 5000; // 5 seconds cache
const spreadCache = {
  USDT: 0, SOL: 0, ETH: 0, PEPE: 0, BONK: 0, WIF: 0, FLOKI: 0, SHIB: 0, JUP: 0, W: 0, RENDER: 0, POPCAT: 0, MEW: 0, ENA: 0, ONDO: 0
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
  ONDO: 'ondo'
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
    const parsed = parser(data);
    if (!parsed || !parsed.price || isNaN(parsed.price)) throw new Error('Invalid price parsed');
    return { name, type: 'CEX', pair: symbol === 'USDT' ? 'USDT/USDC' : `${symbol}/USDT`, ...parsed, status: 'success', source: 'direct' };
  } catch (err) {
    // Fallback to CoinGecko
    try {
      const tickers = await getCoinGeckoTickers(symbol);
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
        const idrRate = 16500;
        const last = parseFloat(d.ticker.last);
        const buy = parseFloat(d.ticker.buy);
        const sell = parseFloat(d.ticker.sell);
        return {
          price: symbol === 'USDT' ? 1.0 : last / idrRate,
          bid: buy / idrRate,
          ask: sell / idrRate
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
    res.json({ 
      cached: priceCache[symbol] ? (Date.now() - priceCache[symbol].time < CACHE_DURATION_MS) : false, 
      timestamp: priceCache[symbol] ? priceCache[symbol].time : Date.now(), 
      data,
      spreads: spreadCache
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices', message: error.message });
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
