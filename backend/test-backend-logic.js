import axios from 'axios';

// Cache for CoinGecko tickers to prevent rate limits
let coingeckoCache = null;
let coingeckoCacheTime = 0;
const COINGECKO_CACHE_DURATION = 15000; // 15 seconds

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

// Fetch all tickers from CoinGecko as fallback
async function getCoinGeckoTickers() {
  const now = Date.now();
  if (coingeckoCache && (now - coingeckoCacheTime < COINGECKO_CACHE_DURATION)) {
    return coingeckoCache;
  }

  try {
    console.log('Fetching CoinGecko tickers fallback...');
    // Fetch page 1 and page 2 to get most major exchanges
    const [p1, p2] = await Promise.all([
      axios.get('https://api.coingecko.com/api/v3/coins/tether/tickers?page=1'),
      axios.get('https://api.coingecko.com/api/v3/coins/tether/tickers?page=2')
    ]);
    
    const tickers = [...(p1.data.tickers || []), ...(p2.data.tickers || [])];
    coingeckoCache = tickers;
    coingeckoCacheTime = now;
    return tickers;
  } catch (err) {
    console.log('CoinGecko fallback fetch failed:', err.message);
    return coingeckoCache || []; // Return stale cache if failed
  }
}

function getPriceFromTickers(tickers, exchangeKey, isBtcUsdt = false) {
  const matching = tickers.filter(t => {
    const market = t.market.name.toLowerCase();
    const base = t.base.toUpperCase();
    const target = t.target.toUpperCase();
    
    const matchesExchange = market.includes(exchangeKey.toLowerCase());
    const matchesPair = 
      (base === 'USDT' && (target === 'USD' || target === 'USDC')) ||
      (base === 'USDC' && target === 'USDT');
      
    return matchesExchange && matchesPair;
  });

  if (matching.length === 0) return null;

  // Sort by volume to get the primary pair
  matching.sort((a, b) => b.volume - a.volume);
  const primary = matching[0];

  if (primary.base === 'USDT') {
    // USDT/USDC or USDT/USD -> price is already price of USDT
    return parseFloat(primary.last);
  } else {
    // USDC/USDT -> price is in USDT, so 1 USDT = 1 / price
    return 1 / parseFloat(primary.last);
  }
}

// CEX Direct Fetches with CoinGecko Fallback
async function getCexPrice(name, url, parser, coingeckoKey) {
  try {
    const data = await fetchWithTimeout(url);
    const price = parser(data);
    return { name, type: 'CEX', pair: 'USDT/USDC', price, status: 'success', source: 'direct' };
  } catch (err) {
    console.log(`Direct fetch for ${name} failed (${err.message}). Using CoinGecko fallback...`);
    try {
      const tickers = await getCoinGeckoTickers();
      const price = getPriceFromTickers(tickers, coingeckoKey || name);
      if (price) {
        return { name, type: 'CEX', pair: 'USDT/USDC', price, status: 'success', source: 'coingecko' };
      }
    } catch (fallbackErr) {
      console.log(`Fallback for ${name} failed:`, fallbackErr.message);
    }
    return { name, type: 'CEX', pair: 'USDT/USDC', price: null, status: 'error', message: err.message };
  }
}

// DEX Fetcher
async function getDexPrices() {
  const dexes = [
    { name: 'Uniswap V3', key: 'uniswap-v3', chain: 'ethereum', pairUrl: 'https://api.dexscreener.com/latest/dex/pairs/ethereum/0x3416cf6c708da44db2624d63ea0aaef7113527c6' },
    { name: 'PancakeSwap V3', key: 'pancakeswap-v3', chain: 'bsc', pairUrl: 'https://api.dexscreener.com/latest/dex/pairs/bsc/0x92b7807bf19b7dddf89b706143896d05228f3121' },
    { name: 'Raydium', key: 'raydium', chain: 'solana', pairUrl: 'https://api.dexscreener.com/latest/dex/pairs/solana/7TbGqz32RsuwXbXY7EyBCiAnMbJq1gm1wKmfjQjuwoyF' },
    { name: 'Orca', key: 'orca', chain: 'solana', pairUrl: 'https://api.dexscreener.com/latest/dex/pairs/solana/4fuUiYxTQ6QCrdSq9ouBYcTM7bqSwYTSyLueGZLTy4T4' }
  ];

  const results = [];
  
  // Fetch Uniswap, PancakeSwap and Solana pools in parallel
  try {
    const promises = dexes.map(async (dex) => {
      try {
        const data = await fetchWithTimeout(dex.pairUrl);
        const pair = data.pair;
        if (!pair) throw new Error('No pair data returned');

        let price = null;
        if (pair.baseToken.symbol === 'USDT' && pair.quoteToken.symbol === 'USDC') {
          price = parseFloat(pair.priceUsd) || parseFloat(pair.priceNative);
        } else if (pair.baseToken.symbol === 'USDC' && pair.quoteToken.symbol === 'USDT') {
          price = 1 / parseFloat(pair.priceNative);
        } else {
          price = parseFloat(pair.priceUsd);
        }

        return { name: dex.name, type: 'DEX', pair: 'USDT/USDC', price, status: 'success', source: 'dexscreener' };
      } catch (err) {
        return { name: dex.name, type: 'DEX', pair: 'USDT/USDC', price: null, status: 'error', message: err.message };
      }
    });

    return await Promise.all(promises);
  } catch (err) {
    return dexes.map(d => ({ name: d.name, type: 'DEX', pair: 'USDT/USDC', price: null, status: 'error', message: err.message }));
  }
}

async function runTest() {
  console.log('Starting price aggregation test...');
  const start = Date.now();

  const results = await Promise.all([
    // Binance (direct usually blocks, fallback to CoinGecko)
    getCexPrice('Binance', 'https://api.binance.com/api/v3/ticker/price?symbol=USDCUSDT', 
      d => 1 / parseFloat(d.price), 'binance'),

    // OKX (direct usually blocks, fallback to CoinGecko)
    getCexPrice('OKX', 'https://www.okx.com/api/v5/market/ticker?instId=USDT-USDC', 
      d => parseFloat(d.data[0].last), 'okx'),

    // Bybit (direct uses api.bytick.com mirror, fallback to CoinGecko if fails)
    getCexPrice('Bybit', 'https://api.bytick.com/v5/market/tickers?category=spot&symbol=USDCUSDT', 
      d => 1 / parseFloat(d.result.list[0].lastPrice), 'bybit'),

    // Coinbase (direct USDT-USD)
    getCexPrice('Coinbase', 'https://api.coinbase.com/v2/prices/USDT-USD/spot', 
      d => parseFloat(d.data.amount), 'coinbase'),

    // KuCoin (direct usually blocks, fallback to CoinGecko)
    getCexPrice('KuCoin', 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=USDT-USDC', 
      d => parseFloat(d.data.price), 'kucoin'),

    // Gate.io (direct uses USDC_USDT pair)
    getCexPrice('Gate.io', 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=USDC_USDT', 
      d => 1 / parseFloat(d[0].last), 'gate'),

    // Bitget (direct usually blocks, fallback to CoinGecko)
    getCexPrice('Bitget', 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=USDTUSDC', 
      d => parseFloat(d.data[0].lastPr), 'bitget'),

    // MEXC (direct usually blocks, fallback to CoinGecko)
    getCexPrice('MEXC', 'https://api.mexc.com/api/v3/ticker/price?symbol=USDCUSDT', 
      d => 1 / parseFloat(d.price), 'mexc'),

    // DEX prices (Uniswap, PancakeSwap, Raydium, Orca)
    getDexPrices()
  ]);

  const flatData = [];
  results.forEach(res => {
    if (Array.isArray(res)) {
      flatData.push(...res);
    } else {
      flatData.push(res);
    }
  });

  console.log(`\nTest completed in ${(Date.now() - start) / 1000} seconds.`);
  console.log('Resulting USDT Price List:');
  console.table(flatData);
}

runTest();
