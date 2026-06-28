import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('https://api.dexscreener.com/latest/dex/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const pairs = res.data.pairs || [];
    console.log('\n--- Orca pools for USDC on Solana ---');
    const matching = pairs.filter(p => 
      p.chainId === 'solana' && 
      p.dexId.toLowerCase().includes('orca')
    );
    matching.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    matching.slice(0, 10).forEach((p, idx) => {
      console.log(`[${idx}] Pair: ${p.baseToken.symbol}/${p.quoteToken.symbol}, Address: ${p.pairAddress}, Liquidity: $${p.liquidity?.usd}, PriceNative: ${p.priceNative}, PriceUSD: ${p.priceUsd}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
