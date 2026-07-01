# Price Worker

Go background worker untuk mengambil harga `token_pairs` secara berkala dan menulis hasilnya ke Redis.

## Redis Keys

- `market:latest:{exchangeId}:{pairId}`: JSON tick terakhir, TTL mengikuti `HISTORY_TTL_SECONDS`.
- `market:history:{exchangeId}:{pairId}`: Redis list berisi point harga terbaru, dipotong sampai `HISTORY_MAX_POINTS`.

## Supported Exchanges

- Indodax: `ticker_all`, satu request per interval.
- Mobee: `v1/markets/summary`, satu request batch per interval dengan signed headers.
- Reku: `v2/bidask`, satu request per interval.
- Tokocrypto: order book depth per pair, dengan concurrency limit.

Exchange lain tetap dibaca dari Postgres oleh API, tetapi akan tampil sebagai `unsupported` sampai adapter worker dibuat.

## Env

Worker memakai env yang sama dengan backend:

```env
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/arbitrage_db
REDIS_URL=redis://127.0.0.1:6379
POLL_INTERVAL_SECONDS=10
HISTORY_TTL_SECONDS=3600
HISTORY_MAX_POINTS=360
TOKOCRYPTO_CONCURRENCY=5
MOBEE_API_KEY=
MOBEE_API_SECRET=
MOBEE_CONCURRENCY=5
STALE_AFTER_SECONDS=30
HTTP_TIMEOUT_SECONDS=5
```

Saat dijalankan dari folder `price-worker`, worker juga otomatis mencoba memuat `../backend/.env`.
Env dari shell tetap memiliki prioritas lebih tinggi daripada file.

## Run

```bash
cd price-worker
go run ./cmd/price-worker
```
