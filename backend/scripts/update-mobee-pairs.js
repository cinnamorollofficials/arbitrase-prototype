import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: new URL('../.env', import.meta.url) });
dotenv.config({ path: new URL('../../.env', import.meta.url) });

const apiKey = process.env.MOBEE_API_KEY;
if (!apiKey) {
  console.error('MOBEE_API_KEY is required to fetch Mobee market pairs.');
  process.exit(1);
}

const endpoints = [
  'https://open-api.mobee.io/v1/market/settings',
  'https://open-api.mobee.io/v1/markets/settings'
];

let lastError = null;
let payload = null;
for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'X-API-Key': apiKey,
        'User-Agent': 'arbitrase-prototype/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`${endpoint} returned ${response.status}`);
    }

    payload = await response.json();
    break;
  } catch (error) {
    lastError = error;
  }
}

if (!payload) {
  console.error(`Failed to fetch Mobee market settings: ${lastError?.message || 'unknown error'}`);
  process.exit(1);
}

const pairs = [...extractPairs(payload)]
  .filter((symbol) => symbol.endsWith('_IDR'))
  .sort((a, b) => a.localeCompare(b));

if (pairs.length === 0) {
  console.error('Mobee market settings did not contain any IDR pairs.');
  process.exit(1);
}

const outPath = fileURLToPath(new URL('../data/mobee-pairs.json', import.meta.url));
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(pairs, null, 4)}\n`);

console.log(`Wrote ${pairs.length} Mobee IDR pairs to ${outPath}`);

function* extractPairs(value) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      yield* extractPairs(item);
    }
    return;
  }

  if (typeof value === 'object') {
    const pair = pairFromObject(value);
    if (pair) {
      yield pair;
    }

    for (const nested of Object.values(value)) {
      yield* extractPairs(nested);
    }
  }
}

function pairFromObject(value) {
  const symbol = getString(value, ['symbol', 'pair', 'market', 'marketSymbol', 'market_symbol']);
  if (symbol) {
    return normalizePair(symbol);
  }

  const base = getString(value, ['base', 'baseAsset', 'base_asset', 'baseCurrency', 'base_currency']);
  const quote = getString(value, ['quote', 'quoteAsset', 'quote_asset', 'quoteCurrency', 'quote_currency']);
  if (base && quote) {
    return `${base.toUpperCase()}_${quote.toUpperCase()}`;
  }

  return null;
}

function getString(value, keys) {
  for (const key of keys) {
    const found = value[key];
    if (typeof found === 'string' && found.trim()) {
      return found.trim();
    }
  }
  return null;
}

function normalizePair(value) {
  return value.trim().toUpperCase().replace('-', '_').replace('/', '_');
}
