# Panduan Setup Market Data Mobee di Device Lain

Panduan ini menjelaskan cara menjalankan market data Mobee di environment baru. Mobee membutuhkan signed request, jadi `price-worker` wajib memiliki `MOBEE_API_KEY` dan `MOBEE_API_SECRET`.

## 1. Siapkan Environment

Copy file env contoh lalu isi konfigurasi lokal.

```bash
cp backend/.env.example .env
```

Di Windows PowerShell:

```powershell
Copy-Item backend\.env.example .env
```

Pastikan `.env` berisi konfigurasi database, Redis, dan Mobee:

```env
PORT=5001

DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=arbitrage_db
DB_SSL=false

REDIS_URL=redis://localhost:6379
MARKET_DATA_STALE_AFTER_MS=30000

MOBEE_API_KEY=isi_api_key_mobee
MOBEE_API_SECRET=isi_secret_key_mobee
MOBEE_CONCURRENCY=5
```

Jangan commit `.env`; file ini sudah masuk `.gitignore`.

## 2. Install Dependency

```bash
make install
```

Atau manual:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../price-worker
go mod download
```

## 3. Jalankan Database dan Redis

Pastikan PostgreSQL dan Redis aktif sesuai `.env`.

Minimal service yang dibutuhkan:

- PostgreSQL berisi database `arbitrage_db`.
- Redis di `redis://localhost:6379`.

## 4. Migrasi dan Seed Database

Dari root project:

```bash
make db-setup
```

Atau manual:

```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Jika database sudah pernah di-seed sebelum fitur Mobee ditambahkan, cukup jalankan migration:

```bash
cd backend
npx sequelize-cli db:migrate
```

Pastikan migration Mobee sudah `up`:

```bash
cd backend
npx sequelize-cli db:migrate:status
```

Cari baris:

```text
up 20260701004000-add-mobee-exchange-market-pairs.js
```

## 5. Refresh Daftar Pair Mobee

Setelah `MOBEE_API_KEY` dan `MOBEE_API_SECRET` diisi, refresh fixture pair dari API Mobee:

```bash
cd backend
npm run update:mobee-pairs
```

Script ini mengambil `GET /v1/market/settings` dari Mobee dan menulis pair IDR ke:

```text
backend/data/mobee-pairs.json
```

Setelah file pair berubah, jalankan ulang migration Mobee atau reset seed sesuai kebutuhan database lokal.

## 6. Jalankan Aplikasi

Cara cepat dari root:

```bash
make run
```

Atau jalankan tiga service secara terpisah:

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Terminal 3:

```bash
cd price-worker
go run ./cmd/price-worker
```

`price-worker` harus dijalankan setelah `.env` berisi credential Mobee. Worker akan membaca `.env`, mengambil pair fiat dari database, memanggil Mobee, lalu menyimpan tick terbaru ke Redis.

## 7. Verifikasi

Cek Mobee muncul di backend:

```bash
curl "http://localhost:5001/api/exchanges-db?include=tokenPairs"
```

Pastikan ada exchange:

```json
{
  "id": 16,
  "name": "Mobee",
  "type": "CEX"
}
```

Cek market data Mobee:

```bash
curl "http://localhost:5001/api/exchanges-db/16/market-data"
```

Response sukses idealnya berisi row seperti:

```json
{
  "symbol": "BTC_IDR",
  "bid": 1063034423,
  "ask": 1064675288,
  "mid": 1063854855.5,
  "nativeCurrency": "IDR",
  "status": "success",
  "source": "mobee_market_summary"
}
```

Jika status masih `unsupported` dengan message `MOBEE_API_KEY is not configured` atau `MOBEE_API_SECRET is not configured`, restart `price-worker` setelah memastikan `.env` sudah benar.

Jika status `stale`, worker tidak memperbarui Redis dalam window `MARKET_DATA_STALE_AFTER_MS`; cek terminal worker untuk error.

## 8. Endpoint Mobee yang Dipakai

Worker memakai endpoint batch:

```text
GET https://open-api.mobee.io/v1/markets/summary
```

Response Mobee memakai key pair terbalik, contoh:

```text
IDR_BTC
IDR_ETH
IDR_USDT
```

Format pair internal database:

```text
BTC_IDR
ETH_IDR
USDT_IDR
```

Worker otomatis mengubah `_` menjadi `-`.

## 9. Troubleshooting Cepat

- Mobee tidak muncul di frontend: jalankan `npx sequelize-cli db:migrate`, lalu refresh frontend.
- Mobee muncul tetapi harga kosong: pastikan `price-worker` berjalan.
- Harga tampil `unsupported`: credential Mobee belum terbaca oleh worker, restart worker.
- Harga tampil `stale`: worker berhenti atau gagal fetch, cek terminal worker dan Redis.
- Pair baru tidak muncul: jalankan `npm run update:mobee-pairs`, lalu update database pair melalui migration/seed sesuai environment.
