import axios from 'axios';

async function main() {
  try {
    for (let page = 1; page <= 6; page++) {
      console.log(`Fetching page ${page}...`);
      const res = await axios.get(`https://api.coingecko.com/api/v3/coins/tether/tickers?page=${page}`);
      const tickers = res.data.tickers || [];
      const kucoin = tickers.filter(t => t.market.name.toLowerCase().includes('kucoin'));
      if (kucoin.length > 0) {
        console.log(`Found KuCoin tickers on page ${page}:`);
        kucoin.forEach(k => {
          console.log(`- Pair: ${k.base}/${k.target}, Price: ${k.last}, Volume: ${k.volume}`);
        });
      }
      if (tickers.length === 0) break;
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err) {
    console.error(err.message);
  }
}

main();
