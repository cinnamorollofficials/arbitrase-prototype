import axios from 'axios';

const TARGET_EXCHANGES = [
  'binance', 'okx', 'bybit', 'coinbase', 'kucoin', 'gate', 'bitget', 'mexc',
  'kraken', 'htx', 'uniswap', 'pancakeswap', 'raydium', 'orca'
];

async function main() {
  try {
    // We can fetch up to 3 pages of tickers to get a wider selection
    let allTickers = [];
    for (let page = 1; page <= 3; page++) {
      console.log(`Fetching page ${page}...`);
      const res = await axios.get(`https://api.coingecko.com/api/v3/coins/tether/tickers?page=${page}`);
      const tickers = res.data.tickers || [];
      if (tickers.length === 0) break;
      allTickers.push(...tickers);
      // Avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nFiltered Tickers (matching target exchanges and trading against USD/USDC):`);
    
    const filtered = allTickers.filter(t => {
      const marketName = t.market.name.toLowerCase();
      const base = t.base.toUpperCase();
      const target = t.target.toUpperCase();
      
      const isTargetExchange = TARGET_EXCHANGES.some(ex => marketName.includes(ex));
      const isStableOrUsdPair = 
        (base === 'USDT' && (target === 'USD' || target === 'USDC')) ||
        (base === 'USDC' && target === 'USDT');
        
      return isTargetExchange && isStableOrUsdPair;
    });

    filtered.forEach((t, idx) => {
      console.log(`[${idx}] Exchange: ${t.market.name}, Pair: ${t.base}/${t.target}, Price: ${t.last}, PriceUSD: ${t.converted_last?.usd}, Volume: ${t.volume.toFixed(0)}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
