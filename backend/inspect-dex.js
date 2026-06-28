import axios from 'axios';

async function main() {
  try {
    const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=USDC%20USDT`);
    const pairs = res.data.pairs || [];
    console.log(`Fetched ${pairs.length} search results from DexScreener:`);
    // Filter for Ethereum, BSC, and Solana
    const filtered = pairs.filter(p => ['ethereum', 'bsc', 'solana'].includes(p.chainId));
    filtered.slice(0, 20).forEach((p, idx) => {
      console.log(`[${idx}] Chain: ${p.chainId}, Dex: ${p.dexId}, Pair: ${p.baseToken.symbol}/${p.quoteToken.symbol}, Address: ${p.pairAddress}, Price: ${p.priceUsd || p.priceNative}, Liquidity: ${p.liquidity?.usd}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
