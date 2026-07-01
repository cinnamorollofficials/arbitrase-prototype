# Price Worker

Go background worker untuk mengambil harga `token_pairs` secara berkala dan menulis hasilnya ke Redis.

## Redis Keys

- `market:latest:{exchangeId}:{pairId}`: JSON tick terakhir, TTL mengikuti `HISTORY_TTL_SECONDS`.
- `market:history:{exchangeId}:{pairId}`: Redis list berisi point harga terbaru, dipotong sampai `HISTORY_MAX_POINTS`, dan hanya ditulis setiap `HISTORY_SAMPLE_SECONDS`.

## Supported Exchanges

- Indodax: `ticker_all`, satu request per interval.
- Bittime: order book depth per pair, dengan concurrency limit.
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
HISTORY_TTL_SECONDS=86400
HISTORY_SAMPLE_SECONDS=60
HISTORY_MAX_POINTS=1440
TOKOCRYPTO_CONCURRENCY=5 # dipakai untuk Tokocrypto dan Bittime depth per pair
MOBEE_API_KEY=
MOBEE_API_SECRET=
MOBEE_CONCURRENCY=5
STALE_AFTER_SECONDS=30
HTTP_TIMEOUT_SECONDS=5
```

Saat dijalankan dari folder `price-worker`, worker juga otomatis mencoba memuat `../backend/.env`.
Env dari shell tetap memiliki prioritas lebih tinggi daripada file.

Dengan konfigurasi default di atas, `market:latest:*` tetap diperbarui setiap 10 detik, tetapi history chart hanya menyimpan satu point per menit. Ini memberi rentang sekitar 24 jam dengan 1440 point per pair.

## Run

```bash
cd price-worker
go run ./cmd/price-worker
```
