# Implementasi Market Data Exchange

Dokumen ini merangkum update Tokocrypto market data dan langkah replikasi untuk exchange lain.

## Tujuan

- Menyimpan pair token/fiat exchange ke file JSON sederhana.
- Men-seed pair tersebut ke tabel `token_pairs`.
- Mengambil harga live dari API exchange berdasarkan pair di database.
- Menampilkan harga live di modal detail exchange pada tab `Market Data`.
- Menjalankan auto-refresh setiap 10 detik dengan indikator progress lingkaran.

## File Yang Diubah

- `backend/data/tokocrypto-pairs.json`
  - Fixture daftar pair token/fiat Tokocrypto.
  - Format: array string, contoh `"BTC_IDR"`.

- `backend/seeders/20260629000005-demo-chains-tokens-attributes.js`
  - Menambahkan token yang dibutuhkan pair Tokocrypto IDR.
  - Menambahkan `IDR` sebagai quote token.

- `backend/seeders/20260629000011-demo-exchanges-wallets-pairs-fees.js`
  - Membaca fixture pair dari `backend/data/tokocrypto-pairs.json`.
  - Mapping `BASE_QUOTE` ke `base_token_id` dan `quote_token_id`.
  - Insert ke `token_pairs` untuk `exchange_id: 10`.

- `backend/server.js`
  - Menambahkan endpoint:
    - `GET /api/exchanges-db/:exchangeId/market-data`
  - Endpoint membaca pair fiat dari database, lalu fetch harga live.
  - Tokocrypto menggunakan endpoint depth:
    - `https://www.tokocrypto.com/open/v1/market/depth?symbol=BTC_IDR&limit=5`

- `frontend/src/App.jsx`
  - Modal detail exchange dibuat full page.
  - Menambahkan tab `Overview` dan `Market Data`.
  - Tab `Market Data` fetch harga dari endpoint backend.
  - Auto-refresh data setiap 10 detik.
  - Tombol `Refresh Harga` untuk manual refresh.

- `frontend/src/index.css`
  - Menambahkan animasi ring progress 10 detik.

## Struktur Fixture Pair

Gunakan format array string.

```json
[
  "BTC_IDR",
  "ETH_IDR",
  "USDT_IDR"
]
```

Konvensi symbol:

- Gunakan format exchange asli jika memungkinkan.
- Untuk pair fiat lokal Indonesia, gunakan `BASE_IDR`.
- Pastikan `BASE` dan `QUOTE` sudah ada di tabel `tokens`.

## Langkah Implementasi Exchange Baru

### 1. Buat Fixture Pair

Buat file:

```text
backend/data/<exchange-slug>-pairs.json
```

Contoh:

```text
backend/data/indodax-pairs.json
backend/data/reku-pairs.json
```

Isi hanya pair token/fiat:

```json
[
  "BTC_IDR",
  "ETH_IDR",
  "USDT_IDR"
]
```

### 2. Tambahkan Token Yang Belum Ada

Update:

```text
backend/seeders/20260629000005-demo-chains-tokens-attributes.js
```

Tambahkan token baru ke array `tokens`.

Contoh:

```js
{ id: 64, symbol: 'XYZ', name: 'XYZ Token', coingecko_id: null, is_active: true }
```

Pastikan `IDR` hanya dibuat sekali sebagai token quote fiat:

```js
{ id: 63, symbol: 'IDR', name: 'Indonesian Rupiah', coingecko_id: null, is_active: true }
```

### 3. Seed Pair Ke `token_pairs`

Update:

```text
backend/seeders/20260629000011-demo-exchanges-wallets-pairs-fees.js
```

Pola implementasi:

```js
import { readFileSync } from 'node:fs';

const exchangeFiatPairs = JSON.parse(
  readFileSync(new URL('../data/<exchange-slug>-pairs.json', import.meta.url), 'utf8')
);
```

Lalu mapping symbol:

```js
for (const symbol of exchangeFiatPairs) {
  const [baseSymbol, quoteSymbol] = symbol.split('_');
  const baseToken = tokenBySymbol.get(baseSymbol);
  const quoteToken = tokenBySymbol.get(quoteSymbol);

  if (!baseToken || !quoteToken) {
    throw new Error(`Missing token seed for pair ${symbol}`);
  }

  tokenPairs.push({
    id: pairId++,
    exchange_id: EXCHANGE_ID,
    base_token_id: baseToken.id,
    quote_token_id: quoteToken.id,
    symbol,
    is_active: true
  });
}
```

### 4. Tambahkan Fetcher Market Data Backend

Endpoint umum sudah tersedia:

```text
GET /api/exchanges-db/:exchangeId/market-data
```

Untuk exchange baru, tambahkan fetcher di `backend/server.js`.

Pola:

```js
const fetchers = {
  Tokocrypto: fetchTokocryptoDepth,
  Indodax: fetchIndodaxTicker,
  Reku: fetchRekuTicker
};
```

Fetcher harus return shape berikut:

```js
{
  pairId: pair.id,
  symbol: pair.symbol,
  baseToken: pair.baseToken,
  quoteToken: pair.quoteToken,
  bid: number | null,
  bidQty: number | null,
  ask: number | null,
  askQty: number | null,
  mid: number | null,
  nativeCurrency: pair.quoteToken?.symbol,
  status: 'success' | 'empty' | 'unsupported' | 'error',
  source: '<exchange>_<api_type>',
  timestamp: Date.now()
}
```

Jika API exchange hanya menyediakan `last`, bisa isi:

```js
bid: null,
ask: null,
mid: last
```

Jika API menyediakan order book, gunakan:

```js
bid = best bid price
ask = best ask price
mid = (bid + ask) / 2
```

### 5. Frontend Tidak Perlu Banyak Diubah

Tab `Market Data` di `frontend/src/App.jsx` sudah generic:

- Mengambil pair dari `selectedExchangeDb.tokenPairs`.
- Fetch endpoint `/api/exchanges-db/:exchangeId/market-data`.
- Menampilkan `mid`, `bid`, `ask`, `bidQty`, `askQty`, dan status.
- Auto-refresh 10 detik.
- Ring progress mengisi dari 0 ke penuh selama 10 detik.

Selama backend mengembalikan format response yang sama, exchange baru otomatis tampil.

## Response Endpoint Market Data

Contoh response:

```json
{
  "exchange": {
    "id": 10,
    "name": "Tokocrypto"
  },
  "pairCount": 39,
  "timestamp": 1782820000000,
  "data": [
    {
      "pairId": 123,
      "symbol": "BTC_IDR",
      "bid": 1064917794,
      "bidQty": 0.00125,
      "ask": 1065396194,
      "askQty": 0.01747,
      "mid": 1065156994,
      "nativeCurrency": "IDR",
      "status": "success",
      "source": "tokocrypto_depth"
    }
  ]
}
```

## Checklist Implementasi Exchange Baru

- [ ] Buat `backend/data/<exchange-slug>-pairs.json`.
- [ ] Pastikan semua base token dan quote fiat ada di seed token.
- [ ] Tambahkan pair ke seeder `token_pairs`.
- [ ] Tambahkan fetcher live market data di `backend/server.js`.
- [ ] Tambahkan fetcher ke map `fetchers`.
- [ ] Jalankan syntax check backend:

```bash
node --check backend/server.js
```

- [ ] Build frontend:

```bash
cd frontend
npm.cmd run build
```

- [ ] Test endpoint:

```bash
curl http://localhost:5001/api/exchanges-db/<exchangeId>/market-data
```

## Catatan Untuk Exchange Lokal

### Tokocrypto

- Pair format: `BTC_IDR`.
- API order book:

```text
https://www.tokocrypto.com/open/v1/market/depth?symbol=BTC_IDR&limit=5
```

### Indodax

- Pair API biasanya lowercase, contoh `btc_idr`.
- Endpoint ticker umum:

```text
https://indodax.com/api/btc_idr/ticker
```

Perlu adapter symbol dari `BTC_IDR` menjadi `btc_idr`.

### Reku

- Perlu verifikasi endpoint publik yang stabil.
- Jika belum tersedia, return `unsupported` sampai fetcher resmi ditambahkan.

### Mobee

- Pair API memakai format `BASE-QUOTE`, contoh `BTC-IDR`.
- Fixture aplikasi tetap memakai format internal `BASE_IDR`.
- Daftar pair bisa diperbarui dari API Mobee setelah `MOBEE_API_KEY` diisi:

```bash
cd backend
npm run update:mobee-pairs
```

- Worker memakai endpoint summary per pair:

```text
https://open-api.mobee.io/v1/markets/BTC-IDR/summary
```

- Header wajib:

```text
X-API-Key: <MOBEE_API_KEY>
```

## Prinsip Desain

- Database tetap menjadi sumber daftar pair.
- API exchange hanya menjadi sumber harga live.
- UI tidak hardcode exchange tertentu.
- Setiap exchange cukup menambahkan:
  - fixture pair,
  - seeder mapping,
  - backend fetcher.
