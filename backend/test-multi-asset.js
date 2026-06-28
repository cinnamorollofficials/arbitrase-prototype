import axios from 'axios';

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
  }
};

function matchesSymbol(sym, target) {
  const s = sym.toUpperCase();
  const t = target.toUpperCase();
  if (s === t) return true;
  if (t === 'ETH' && s === 'WETH') return true;
  if (t === 'BTC' && (s === 'WBTC' || s === 'BTCB')) return true;
  if (t === 'SOL' && s === 'WSOL') return true;
  return false;
}

async function getDexPricesForSymbol(symbol) {
  const tokens = ASSET_TOKENS[symbol];
  if (!tokens) return console.log(`Symbol ${symbol} not supported`);

  try {
    // Fetch individually to prevent top-30 cap drowning
    const [resEth, resBsc, resSol] = await Promise.all([
      axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokens.ethereum}`),
      axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokens.bsc}`),
      axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokens.solana}`)
    ]);

    const ethPairs = resEth.data.pairs || [];
    const bscPairs = resBsc.data.pairs || [];
    const solPairs = resSol.data.pairs || [];
    
    const targets = [
      { name: 'Uniswap V3', pairs: ethPairs, chain: 'ethereum', dexId: 'uniswap' },
      { name: 'PancakeSwap V3', pairs: bscPairs, chain: 'bsc', dexId: 'pancakeswap' },
      { name: 'Raydium', pairs: solPairs, chain: 'solana', dexId: 'raydium' },
      { name: 'Orca', pairs: solPairs, chain: 'solana', dexId: 'orca' }
    ];

    console.log(`\n--- Dynamic Dex prices for ${symbol} ---`);
    targets.forEach(t => {
      const match = t.pairs.filter(p => 
        p.chainId === t.chain && 
        p.dexId.toLowerCase().includes(t.dexId) &&
        (
          symbol === 'USDT' 
            ? (p.baseToken.symbol === 'USDC' || p.quoteToken.symbol === 'USDC')
            : (p.baseToken.symbol === 'USDT' || p.quoteToken.symbol === 'USDT')
        )
      );

      if (match.length > 0) {
        match.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const best = match[0];
        console.log(`[${t.name}] Pair: ${best.baseToken.symbol}/${best.quoteToken.symbol}, PriceUSD: ${best.priceUsd}, NativePrice: ${best.priceNative}, Liquidity: $${best.liquidity?.usd}`);
      } else {
        console.log(`[${t.name}] No matching pool found`);
      }
    });
  } catch (err) {
    console.error(err.message);
  }
}

async function main() {
  await getDexPricesForSymbol('USDT');
  await getDexPricesForSymbol('SOL');
  await getDexPricesForSymbol('ETH');
}

main();
