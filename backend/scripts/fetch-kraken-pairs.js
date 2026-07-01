#!/usr/bin/env node
/**
 * Script untuk mengambil semua token pair dari Kraken API
 * dan menyimpannya ke backend/data/kraken-pairs.json
 *
 * Format output: array string "BASE_QUOTE" (maksimal 650 pair)
 * Urutan prioritas: online > post_only. Exclude cancel_only.
 *
 * Usage:
 *   node scripts/fetch-kraken-pairs.js
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KRAKEN_API_URL = 'https://api.kraken.com/0/public/AssetPairs';
const OUTPUT_FILE = join(__dirname, '../data/kraken-pairs.json');
const MAX_PAIRS = 650;

// Map Kraken internal quote names -> simbol standar
const QUOTE_MAP = {
  ZUSD: 'USD',
  ZEUR: 'EUR',
  ZGBP: 'GBP',
  ZCAD: 'CAD',
  ZAUD: 'AUD',
  ZJPY: 'JPY',
  ZCHF: 'CHF',
  XETH: 'ETH',
  XXBT: 'XBT',
  XXLM: 'XLM',
  XXMR: 'XMR',
  USDT: 'USDT',
  USDC: 'USDC',
  DAI:  'DAI',
  PYUSD: 'PYUSD',
  EURT: 'EURT',
  CHF:  'CHF',
};

// Map Kraken internal base names -> simbol standar
const BASE_MAP = {
  XXBT: 'XBT',
  XETH: 'ETH',
  XXLM: 'XLM',
  XXMR: 'XMR',
  XXRP: 'XRP',
  XZEC: 'ZEC',
  XLTC: 'LTC',
  XXDG: 'XDG',
  XXTZ: 'XTZ',
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'arbitrase-bot/1.0', Accept: 'application/json' },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

function processPairs(result) {
  const allPairs = Object.entries(result);
  console.log(`Total pairs dari Kraken API : ${allPairs.length}`);

  const activePairs = allPairs.filter(
    ([, p]) => p.status === 'online' || p.status === 'post_only'
  );
  const onlinePairs   = activePairs.filter(([, p]) => p.status === 'online');
  const postOnlyPairs = activePairs.filter(([, p]) => p.status === 'post_only');

  console.log(`Pairs aktif                 : ${activePairs.length}`);
  console.log(`  status online             : ${onlinePairs.length}`);
  console.log(`  status post_only          : ${postOnlyPairs.length}`);

  // Online diprioritaskan, post_only di belakang
  const sortedPairs = [...onlinePairs, ...postOnlyPairs];

  const converted = [];
  const seen = new Set();

  for (const [, pair] of sortedPairs) {
    if (!pair.wsname) continue;
    const parts = pair.wsname.split('/');
    if (parts.length !== 2) continue;

    const [rawBase, rawQuote] = parts;
    const base   = BASE_MAP[rawBase]  || rawBase;
    const quote  = QUOTE_MAP[rawQuote] || rawQuote;
    const symbol = `${base}_${quote}`;

    if (seen.has(symbol)) continue;
    seen.add(symbol);
    converted.push({ symbol, status: pair.status, base, quote });
    if (converted.length >= MAX_PAIRS) break;
  }

  return converted;
}

async function main() {
  console.log('=== Kraken Pair Fetcher ===');
  console.log(`Endpoint : ${KRAKEN_API_URL}`);
  console.log(`Max pairs: ${MAX_PAIRS}\n`);

  let rawJson;
  try {
    console.log('Fetching from Kraken API...');
    rawJson = await httpsGet(KRAKEN_API_URL);
    console.log('Response received.\n');
  } catch (err) {
    console.error(`❌ Fetch gagal: ${err.message}`);
    process.exit(1);
  }

  const data = JSON.parse(rawJson);
  if (data.error && data.error.length > 0) {
    throw new Error(`Kraken API error: ${data.error.join(', ')}`);
  }

  const converted = processPairs(data.result);

  console.log(`\nTotal pair disimpan: ${converted.length}`);

  // Distribusi quote currency
  const quoteDist = {};
  for (const p of converted) quoteDist[p.quote] = (quoteDist[p.quote] || 0) + 1;
  console.log('\nDistribusi quote currency:');
  Object.entries(quoteDist)
    .sort(([, a], [, b]) => b - a)
    .forEach(([q, c]) => console.log(`  ${q.padEnd(8)}: ${c} pairs`));

  const symbols = converted.map((p) => p.symbol);
  writeFileSync(OUTPUT_FILE, JSON.stringify(symbols, null, 2) + '\n', 'utf8');

  console.log(`\n✅ Tersimpan ke: ${OUTPUT_FILE}`);
  console.log('\nSample 10 pertama:');
  symbols.slice(0, 10).forEach((s) => console.log(`  ${s}`));
  console.log('\nSample 10 terakhir:');
  symbols.slice(-10).forEach((s) => console.log(`  ${s}`));
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
