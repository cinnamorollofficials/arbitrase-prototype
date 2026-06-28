import axios from 'axios';

async function testSearch(q) {
  try {
    const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
    const pairs = res.data.pairs || [];
    console.log(`\nResults for query "${q}" (${pairs.length}):`);
    pairs.slice(0, 5).forEach((p, idx) => {
      console.log(`[${idx}] Chain: ${p.chainId}, Dex: ${p.dexId}, Pair: ${p.baseToken?.symbol}/${p.quoteToken?.symbol}, Address: ${p.pairAddress}`);
    });
  } catch (err) {
    console.log(`[ERROR] Q: "${q}" -> ${err.message}`);
  }
}

async function main() {
  await testSearch('Uniswap USDC USDT ethereum');
  await testSearch('PancakeSwap USDC USDT bsc');
  await testSearch('Raydium USDC USDT solana');
}

main();
