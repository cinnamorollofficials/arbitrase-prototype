import { readFileSync } from 'node:fs';

const tokocryptoIdrPairs = JSON.parse(
  readFileSync(new URL('../data/tokocrypto-pairs.json', import.meta.url), 'utf8')
);
const indodaxIdrPairs = JSON.parse(
  readFileSync(new URL('../data/indodax-pairs.json', import.meta.url), 'utf8')
);
const rekuIdrPairs = JSON.parse(
  readFileSync(new URL('../data/reku-pairs.json', import.meta.url), 'utf8')
);

export async function up(queryInterface, Sequelize) {
  // 1. Seed Exchanges
  const exchanges = [
    { id: 1, name: 'Binance', type: 'CEX', is_active: true, website_url: 'https://binance.com', logo_url: 'https://static.vecteezy.com/system/resources/previews/054/061/035/non_2x/binance-logo-free-download-free-vector.jpg', is_registered_indonesia: false, rating: 10.0, capital: 65000000000.00 },
    { id: 2, name: 'OKX', type: 'CEX', is_active: true, website_url: 'https://okx.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Logo-OKX.png', is_registered_indonesia: false, rating: 9.8, capital: 18500000000.00 },
    { id: 3, name: 'Bybit', type: 'CEX', is_active: true, website_url: 'https://bybit.com', logo_url: 'https://cryptologos.cc/logos/bybit-logo.png', is_registered_indonesia: false, rating: 9.5, capital: 12200000000.00 },
    { id: 4, name: 'Coinbase', type: 'CEX', is_active: true, website_url: 'https://coinbase.com', logo_url: 'https://i.pinimg.com/474x/d6/4a/59/d64a5981e74538459bfa3fa5beee2621.jpg', is_registered_indonesia: false, rating: 9.9, capital: 85000000000.00 },
    { id: 5, name: 'Kraken', type: 'CEX', is_active: true, website_url: 'https://kraken.com', logo_url: 'https://zengo.com/wp-content/uploads/kraken_300x300@x2.png', is_registered_indonesia: false, rating: 9.7, capital: 15000000000.00 },
    { id: 6, name: 'Gate.io', type: 'CEX', is_active: true, website_url: 'https://gate.io', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKa0AnIVYc2lanSMeFElaGsUpQQBpjUwK7fA&s', is_registered_indonesia: false, rating: 8.8, capital: 4800000000.00 },
    { id: 7, name: 'Bitget', type: 'CEX', is_active: true, website_url: 'https://bitget.com', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSP3NzvYDI_O7l1m-tP2P3o0lb7DjJKpwWL7A&s', is_registered_indonesia: false, rating: 8.5, capital: 3500000000.00 },
    { id: 8, name: 'MEXC', type: 'CEX', is_active: true, website_url: 'https://mexc.com', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQ8PZO3MqMddk0QEct72-V5rdZG8wB4YGTMg&s', is_registered_indonesia: false, rating: 7.2, capital: 1800000000.00 },
    { id: 9, name: 'Indodax', type: 'CEX', is_active: true, website_url: 'https://indodax.com', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeOR42JBjLsH3Zesz_VqTeTGi-hMZraznjGw&s', is_registered_indonesia: true, rating: 8.0, capital: 450000000.00 },
    { id: 10, name: 'Tokocrypto', type: 'CEX', is_active: true, website_url: 'https://tokocrypto.com', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVDirI-6MhGAcgt29NY7HR-WOPyVM86K-Ppw&s', is_registered_indonesia: true, rating: 8.2, capital: 320000000.00 },
    { id: 11, name: 'Reku', type: 'CEX', is_active: true, website_url: 'https://reku.id', logo_url: 'https://play-lh.googleusercontent.com/OXoqBZ-q2cmiv1ZXKds9ziXJB21AQfpksEC99HYUDCS82QggcKdMri1-lcw0epnmLxdH85pM_c381hwSPl9W', is_registered_indonesia: true, rating: 7.8, capital: 180000000.00 },
    { id: 12, name: 'Uniswap V3', type: 'DEX', is_active: true, website_url: 'https://uniswap.org', logo_url: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', is_registered_indonesia: false, rating: 9.9, capital: 5400000000.00 },
    { id: 13, name: 'PancakeSwap V3', type: 'DEX', is_active: true, website_url: 'https://pancakeswap.finance', logo_url: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png', is_registered_indonesia: false, rating: 9.2, capital: 1900000000.00 },
    { id: 14, name: 'Raydium', type: 'DEX', is_active: true, website_url: 'https://avatars.githubusercontent.com/u/78411976?s=280&v=4', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPaZ-gdOabOTEG23aVOPY_gLAFvhg4pC0cmg&s', is_registered_indonesia: false, rating: 8.5, capital: 950000000.00 },
    { id: 15, name: 'Orca', type: 'DEX', is_active: true, website_url: 'https://orca.so', logo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDdu_bh5yJc4fXMxsGEDyZ9_SxawifHtMh8A&s', is_registered_indonesia: false, rating: 8.7, capital: 250000000.00 }
  ];
  await queryInterface.bulkInsert('exchanges', exchanges);

  // 2. Seed Exchange Attributes
  const exchangeAttributes = [
    { exchange_id: 1, attribute_key: 'api_url', attribute_value: 'https://api.binance.com', data_type: 'string' },
    { exchange_id: 2, attribute_key: 'api_url', attribute_value: 'https://www.okx.com', data_type: 'string' },
    { exchange_id: 3, attribute_key: 'api_url', attribute_value: 'https://api.bytick.com', data_type: 'string' },
    { exchange_id: 4, attribute_key: 'api_url', attribute_value: 'https://api.coinbase.com', data_type: 'string' },
    { exchange_id: 5, attribute_key: 'api_url', attribute_value: 'https://api.kraken.com', data_type: 'string' },
    { exchange_id: 6, attribute_key: 'api_url', attribute_value: 'https://api.gateio.ws', data_type: 'string' },
    { exchange_id: 7, attribute_key: 'api_url', attribute_value: 'https://api.bitget.com', data_type: 'string' },
    { exchange_id: 8, attribute_key: 'api_url', attribute_value: 'https://api.mexc.com', data_type: 'string' },
    { exchange_id: 9, attribute_key: 'api_url', attribute_value: 'https://indodax.com', data_type: 'string' },
    { exchange_id: 10, attribute_key: 'api_url', attribute_value: 'https://api.tokocrypto.com', data_type: 'string' },
    { exchange_id: 11, attribute_key: 'api_url', attribute_value: 'https://reku.id', data_type: 'string' },
    { exchange_id: 12, attribute_key: 'factory_address', attribute_value: '0x1F98431c8aD98523631AE4a59f267346ea31F984', data_type: 'string' },
    { exchange_id: 13, attribute_key: 'factory_address', attribute_value: '0x0BFbCF9fa4e9c742591820902446d12d576C5d9d', data_type: 'string' },
    { exchange_id: 14, attribute_key: 'amm_program_id', attribute_value: '675k1a29k5bT8C7yVb31T5y36C5y881288B8C888B888', data_type: 'string' },
    { exchange_id: 15, attribute_key: 'factory_address', attribute_value: 'whirOS12a1BA25B6C5D4D6B5D2D5D6E6F6A7B8C9D', data_type: 'string' }
  ];
  await queryInterface.bulkInsert('exchange_attributes', exchangeAttributes);

  // 3. Seed Wallets
  await queryInterface.bulkInsert('wallets', [
    { id: 1, chain_id: 1, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', private_key_encrypted: 'encrypted_pk_evm_dev', name: 'Ethereum Execution Wallet', is_active: true },
    { id: 2, chain_id: 2, address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', private_key_encrypted: 'encrypted_pk_bsc_dev', name: 'BSC Execution Wallet', is_active: true },
    { id: 3, chain_id: 3, address: 'GovDkS6z7PnrnRJjz3wX4mPtkoc27DPCNXR1356waDg', private_key_encrypted: 'encrypted_pk_sol_dev', name: 'Solana Execution Wallet', is_active: true }
  ]);

  // Define Tokens
  const tokens = [
    { id: 1, symbol: 'USDT' },
    { id: 2, symbol: 'SOL' },
    { id: 3, symbol: 'ETH' },
    { id: 4, symbol: 'PEPE' },
    { id: 5, symbol: 'BONK' },
    { id: 6, symbol: 'WIF' },
    { id: 7, symbol: 'FLOKI' },
    { id: 8, symbol: 'SHIB' },
    { id: 9, symbol: 'JUP' },
    { id: 10, symbol: 'W' },
    { id: 11, symbol: 'RENDER' },
    { id: 12, symbol: 'POPCAT' },
    { id: 13, symbol: 'MEW' },
    { id: 14, symbol: 'ENA' },
    { id: 15, symbol: 'ONDO' },
    { id: 16, symbol: 'LTC' },
    { id: 17, symbol: 'XRP' },
    { id: 18, symbol: 'ADA' },
    { id: 19, symbol: 'AVAX' },
    { id: 20, symbol: 'DOT' },
    { id: 21, symbol: 'LINK' },
    { id: 22, symbol: 'NEAR' },
    { id: 23, symbol: 'APT' },
    { id: 24, symbol: 'SUI' },
    { id: 25, symbol: 'FET' },
    { id: 26, symbol: 'USDC' },
    { id: 27, symbol: 'BNB' },
    { id: 28, symbol: 'NEIRO' },
    { id: 29, symbol: 'MOG' },
    { id: 30, symbol: 'GIGA' },
    { id: 31, symbol: 'TURBO' },
    { id: 32, symbol: 'FWOG' },
    { id: 33, symbol: 'BRETT' },
    { id: 34, symbol: 'FDUSD' },
    { id: 35, symbol: 'USDE' },
    { id: 36, symbol: 'PYUSD' },
    { id: 37, symbol: 'ALCH' },
    { id: 38, symbol: 'ARB' },
    { id: 39, symbol: 'ASTER' },
    { id: 40, symbol: 'BTC' },
    { id: 41, symbol: 'CARV' },
    { id: 42, symbol: 'DOGE' },
    { id: 43, symbol: 'DOGS' },
    { id: 44, symbol: 'DRX' },
    { id: 45, symbol: 'GOAT' },
    { id: 46, symbol: 'HBAR' },
    { id: 47, symbol: 'JELLYJELLY' },
    { id: 48, symbol: 'MANTA' },
    { id: 49, symbol: 'MOODENG' },
    { id: 50, symbol: 'NBT' },
    { id: 51, symbol: 'POL' },
    { id: 52, symbol: 'SCR' },
    { id: 53, symbol: 'SKYA' },
    { id: 54, symbol: 'SOON' },
    { id: 55, symbol: 'SPX' },
    { id: 56, symbol: 'TAO' },
    { id: 57, symbol: 'TKO' },
    { id: 58, symbol: 'U' },
    { id: 59, symbol: 'VELO' },
    { id: 60, symbol: 'VIRTUAL' },
    { id: 61, symbol: 'WLD' },
    { id: 62, symbol: 'ZIL' },
    { id: 63, symbol: 'IDR' }
  ];
  const tokenBySymbol = new Map(tokens.map((token) => [token.symbol, token]));
  let nextTokenId = Math.max(...tokens.map((token) => token.id)) + 1;

  const marketPairs = [...indodaxIdrPairs, ...rekuIdrPairs];

  for (const symbol of marketPairs) {
    const [baseSymbol] = symbol.split('_');

    if (tokenBySymbol.has(baseSymbol)) {
      continue;
    }

    const token = { id: nextTokenId++, symbol: baseSymbol };
    tokens.push(token);
    tokenBySymbol.set(baseSymbol, token);
  }

  const demoTokens = tokens.filter((token) => token.id <= 36);

  // Token Chain mapping: 1 = Ethereum, 2 = BSC, 3 = Solana
  const tokenChains = {
    USDT: [1, 2, 3],
    SOL: [1, 2, 3],
    ETH: [1, 2, 3],
    PEPE: [1, 2],
    BONK: [1, 3],
    WIF: [3],
    FLOKI: [1, 2],
    SHIB: [1, 2],
    JUP: [3],
    W: [3],
    RENDER: [3],
    POPCAT: [3],
    MEW: [3],
    ENA: [1],
    ONDO: [1],
    LTC: [2],
    XRP: [2],
    ADA: [2],
    AVAX: [2],
    DOT: [2],
    LINK: [1, 2],
    NEAR: [2],
    APT: [2],
    SUI: [2],
    FET: [1],
    USDC: [1, 2, 3],
    BNB: [1, 2, 3],
    NEIRO: [3],
    MOG: [1],
    GIGA: [3],
    TURBO: [1],
    FWOG: [3],
    BRETT: [1],
    FDUSD: [1, 2],
    USDE: [1],
    PYUSD: [1, 3]
  };

  // 4. Generate Token Pairs programmatically
  const tokenPairs = [];
  let pairId = 1;

  // CEX Token Pairs (Binance, OKX, Bybit, Coinbase, Kraken, Gate.io, Bitget, MEXC, Indodax, Tokocrypto, Reku)
  for (const token of demoTokens) {
    const sym = token.symbol;

    // Binance (id 1)
    const binanceSym = sym === 'USDT' ? 'USDCUSDT' : `${sym}USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 1, base_token_id: token.id, quote_token_id: 1, symbol: binanceSym, is_active: true });

    // OKX (id 2)
    const okxSym = sym === 'USDT' ? 'USDT-USDC' : `${sym}-USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 2, base_token_id: token.id, quote_token_id: 1, symbol: okxSym, is_active: true });

    // Bybit (id 3)
    const bybitSym = sym === 'USDT' ? 'USDCUSDT' : `${sym}USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 3, base_token_id: token.id, quote_token_id: 1, symbol: bybitSym, is_active: true });

    // Coinbase (id 4)
    const cbSym = sym === 'USDT' ? 'USDT-USD' : `${sym}-USD`;
    tokenPairs.push({ id: pairId++, exchange_id: 4, base_token_id: token.id, quote_token_id: 1, symbol: cbSym, is_active: true });

    // Kraken (id 5)
    const krkSym = sym === 'USDT' ? 'USDTUSD' : `${sym}USD`;
    tokenPairs.push({ id: pairId++, exchange_id: 5, base_token_id: token.id, quote_token_id: 1, symbol: krkSym, is_active: true });

    // Gate.io (id 6)
    const gateSym = sym === 'USDT' ? 'USDC_USDT' : `${sym}_USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 6, base_token_id: token.id, quote_token_id: 1, symbol: gateSym, is_active: true });

    // Bitget (id 7)
    const bitgetSym = sym === 'USDT' ? 'USDTUSDC' : `${sym}USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 7, base_token_id: token.id, quote_token_id: 1, symbol: bitgetSym, is_active: true });

    // MEXC (id 8)
    const mexcSym = sym === 'USDT' ? 'USDCUSDT' : `${sym}USDT`;
    tokenPairs.push({ id: pairId++, exchange_id: 8, base_token_id: token.id, quote_token_id: 1, symbol: mexcSym, is_active: true });
  }

  // Indodax (id 9) IDR market pairs from backend/data/indodax-pairs.json.
  for (const symbol of indodaxIdrPairs) {
    const [baseSymbol, quoteSymbol] = symbol.split('_');
    const baseToken = tokenBySymbol.get(baseSymbol);
    const quoteToken = tokenBySymbol.get(quoteSymbol);

    if (!baseToken || !quoteToken) {
      throw new Error(`Missing token seed for Indodax pair ${symbol}`);
    }

    tokenPairs.push({
      id: pairId++,
      exchange_id: 9,
      base_token_id: baseToken.id,
      quote_token_id: quoteToken.id,
      symbol,
      is_active: true
    });
  }

  // Tokocrypto (id 10) IDR market pairs from backend/data/tokocrypto-pairs.json.
  for (const symbol of tokocryptoIdrPairs) {
    const [baseSymbol, quoteSymbol] = symbol.split('_');
    const baseToken = tokenBySymbol.get(baseSymbol);
    const quoteToken = tokenBySymbol.get(quoteSymbol);

    if (!baseToken || !quoteToken) {
      throw new Error(`Missing token seed for Tokocrypto pair ${symbol}`);
    }

    tokenPairs.push({
      id: pairId++,
      exchange_id: 10,
      base_token_id: baseToken.id,
      quote_token_id: quoteToken.id,
      symbol,
      is_active: true
    });
  }

  // Reku (id 11) IDR market pairs from backend/data/reku-pairs.json.
  for (const symbol of rekuIdrPairs) {
    const [baseSymbol, quoteSymbol] = symbol.split('_');
    const baseToken = tokenBySymbol.get(baseSymbol);
    const quoteToken = tokenBySymbol.get(quoteSymbol);

    if (!baseToken || !quoteToken) {
      throw new Error(`Missing token seed for Reku pair ${symbol}`);
    }

    tokenPairs.push({
      id: pairId++,
      exchange_id: 11,
      base_token_id: baseToken.id,
      quote_token_id: quoteToken.id,
      symbol,
      is_active: true
    });
  }

  // DEX Token Pairs
  for (const token of demoTokens) {
    const sym = token.symbol;
    const chains = tokenChains[sym] || [];

    // Uniswap V3 (id 12, Chain 1)
    if (chains.includes(1)) {
      const pairSym = sym === 'USDT' ? 'USDT/USDC' : `${sym}/USDT`;
      tokenPairs.push({ id: pairId++, exchange_id: 12, base_token_id: token.id, quote_token_id: 1, symbol: pairSym, is_active: true });
    }

    // PancakeSwap V3 (id 13, Chain 2)
    if (chains.includes(2)) {
      const pairSym = sym === 'USDT' ? 'USDT/USDC' : `${sym}/USDT`;
      tokenPairs.push({ id: pairId++, exchange_id: 13, base_token_id: token.id, quote_token_id: 1, symbol: pairSym, is_active: true });
    }

    // Raydium (id 14, Chain 3)
    if (chains.includes(3)) {
      const pairSym = sym === 'USDT' ? 'USDT/USDC' : `${sym}/USDT`;
      tokenPairs.push({ id: pairId++, exchange_id: 14, base_token_id: token.id, quote_token_id: 1, symbol: pairSym, is_active: true });
    }

    // Orca (id 15, Chain 3)
    if (chains.includes(3)) {
      const pairSym = sym === 'USDT' ? 'USDT/USDC' : `${sym}/USDT`;
      tokenPairs.push({ id: pairId++, exchange_id: 15, base_token_id: token.id, quote_token_id: 1, symbol: pairSym, is_active: true });
    }
  }

  await queryInterface.bulkInsert('token_pairs', tokenPairs);

  // 5. Seed Fees (Trade fees, Pool fees, Withdrawal fees)
  const fees = [];

  // A. Seed Trade Fees for all CEXes (Standard percentages matching CEX markets)
  const cexFeeRates = {
    1: 0.0010,  // Binance 0.1%
    2: 0.0010,  // OKX 0.1%
    3: 0.0010,  // Bybit 0.1%
    4: 0.0040,  // Coinbase 0.4%
    5: 0.0026,  // Kraken 0.26%
    6: 0.0020,  // Gate.io 0.2%
    7: 0.0010,  // Bitget 0.1%
    8: 0.0010,  // MEXC 0.1%
    9: 0.0021,  // Indodax 0.21%
    10: 0.0010, // Tokocrypto 0.1%
    11: 0.0010  // Reku 0.1%
  };

  for (const [exId, rate] of Object.entries(cexFeeRates)) {
    fees.push({
      fee_type: 'CEX_TRADE',
      exchange_id: parseInt(exId),
      token_pair_id: null,
      token_id: null,
      chain_id: null,
      fee_percentage: rate,
      fee_flat: null,
      fee_flat_token_id: null,
      is_active: true
    });
  }

  // B. Seed Pool Fees for all DEX Token Pairs
  const dexPoolFeeRates = {
    12: 0.0030, // Uniswap V3 0.3%
    13: 0.0025, // PancakeSwap V3 0.25%
    14: 0.0025, // Raydium 0.25%
    15: 0.0030  // Orca 0.3%
  };

  const dexPairs = tokenPairs.filter(p => p.exchange_id >= 12);
  for (const pair of dexPairs) {
    const rate = dexPoolFeeRates[pair.exchange_id] || 0.0030;
    fees.push({
      fee_type: 'DEX_POOL',
      exchange_id: pair.exchange_id,
      token_pair_id: pair.id,
      token_id: null,
      chain_id: null,
      fee_percentage: rate,
      fee_flat: null,
      fee_flat_token_id: null,
      is_active: true
    });
  }

  // C. Seed withdrawal fees for major tokens (USDT, SOL, ETH) across CEXes (1-11)
  const cexIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (const exId of cexIds) {
    // USDT (token_id 1) withdrawals
    // To Ethereum (chain 1): Flat 5 USDT
    fees.push({
      fee_type: 'WITHDRAWAL',
      exchange_id: exId,
      token_pair_id: null,
      token_id: 1,
      chain_id: 1,
      fee_percentage: null,
      fee_flat: 5.00000000,
      fee_flat_token_id: 1,
      is_active: true
    });
    // To BSC (chain 2): Flat 1 USDT
    fees.push({
      fee_type: 'WITHDRAWAL',
      exchange_id: exId,
      token_pair_id: null,
      token_id: 1,
      chain_id: 2,
      fee_percentage: null,
      fee_flat: 1.00000000,
      fee_flat_token_id: 1,
      is_active: true
    });
    // To Solana (chain 3): Flat 1 USDT
    fees.push({
      fee_type: 'WITHDRAWAL',
      exchange_id: exId,
      token_pair_id: null,
      token_id: 1,
      chain_id: 3,
      fee_percentage: null,
      fee_flat: 1.00000000,
      fee_flat_token_id: 1,
      is_active: true
    });

    // SOL (token_id 2) withdrawals to Solana (chain 3): Flat 0.01 SOL
    fees.push({
      fee_type: 'WITHDRAWAL',
      exchange_id: exId,
      token_pair_id: null,
      token_id: 2,
      chain_id: 3,
      fee_percentage: null,
      fee_flat: 0.01000000,
      fee_flat_token_id: 2,
      is_active: true
    });

    // ETH (token_id 3) withdrawals to Ethereum (chain 1): Flat 0.005 ETH
    fees.push({
      fee_type: 'WITHDRAWAL',
      exchange_id: exId,
      token_pair_id: null,
      token_id: 3,
      chain_id: 1,
      fee_percentage: null,
      fee_flat: 0.00500000,
      fee_flat_token_id: 3,
      is_active: true
    });
  }

  await queryInterface.bulkInsert('fees', fees);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('fees', null, {});
  await queryInterface.bulkDelete('token_pairs', null, {});
  await queryInterface.bulkDelete('wallets', null, {});
  await queryInterface.bulkDelete('exchange_attributes', null, {});
  await queryInterface.bulkDelete('exchanges', null, {});
}
