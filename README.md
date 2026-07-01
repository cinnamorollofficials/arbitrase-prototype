# Arbitrase Prototype

Prototype aplikasi arbitrase crypto dengan tiga proses utama:

- `backend`: API Express, PostgreSQL, Redis, dan Sequelize migration/seeder.
- `frontend`: React + Vite, dijalankan dengan Bun.
- `price-worker`: Go worker untuk mengambil harga market secara berkala dan menulisnya ke Redis.

## Prasyarat

Pastikan tool berikut sudah tersedia di mesin lokal:

- GNU Make
- Node.js dan npm, untuk backend dan Sequelize CLI
- Bun, untuk frontend
- Go
- PostgreSQL
- Redis

## Struktur Project

```text
.
+-- backend/       # Express API, Sequelize models, migrations, seeders
+-- frontend/      # React + Vite app
+-- price-worker/  # Go worker pengambil harga market
`-- Makefile       # Command setup dan run dari root project
```

## Setup Environment

Backend dan price-worker memakai konfigurasi database/cache yang sama.

Salin file env contoh:

```bash
cp backend/.env.example backend/.env
```

Untuk PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Sesuaikan nilai di `backend/.env`:

```env
PORT=5001
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=arbitrage_db
DB_SSL=false
REDIS_URL=redis://localhost:6379
MARKET_DATA_STALE_AFTER_MS=30000
```

Pastikan database `arbitrage_db` sudah dibuat di PostgreSQL dan Redis sudah berjalan.

## Install Dependency

Dari root project:

```bash
make install
```

Command ini akan menjalankan:

- `cd backend && npm install`
- `cd frontend && bun install` jika Bun tersedia, atau `npm install` sebagai fallback
- `cd price-worker && go mod download`

## Migrasi dan Seeder

Jalankan migrasi database:

```bash
make migrate
```

Jalankan seeder:

```bash
make seed
```

Atau jalankan keduanya sekaligus:

```bash
make db-setup
```

## Menjalankan Project

Untuk menjalankan backend API, frontend, dan price-worker sekaligus:

```bash
make run
```

Proses yang dijalankan:

- Backend API: `cd backend && npm run dev`
- Frontend: `cd frontend && bun run dev` jika Bun tersedia, atau `npm run dev` sebagai fallback
- Price worker: `cd price-worker && go run ./cmd/price-worker`

Secara default backend berjalan di:

```text
http://localhost:5001
```

Frontend Vite biasanya akan menampilkan URL dev server di terminal saat proses berjalan.

## Command Makefile

| Command | Fungsi |
| --- | --- |
| `make install` | Install dependency backend, frontend, dan price-worker |
| `make run` | Jalankan backend, frontend, dan price-worker bersamaan |
| `make run-backend` | Jalankan backend saja |
| `make run-frontend` | Jalankan frontend saja dengan Bun |
| `make run-price-worker` | Jalankan price-worker saja |
| `make migrate` | Jalankan Sequelize migration |
| `make seed` | Jalankan semua Sequelize seeder |
| `make db-setup` | Jalankan migration lalu seeder |

## Catatan Frontend Bun

Frontend sudah diarahkan untuk memakai Bun. Setelah menjalankan:

```bash
cd frontend
bun install
```

Bun akan membuat `bun.lock`. Jika frontend sudah stabil dengan Bun, `frontend/package-lock.json` bisa dihapus agar frontend hanya memakai lockfile Bun.

## Troubleshooting

Jika backend gagal konek database, cek:

- PostgreSQL sudah berjalan.
- Database `arbitrage_db` sudah dibuat.
- Nilai `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` di `backend/.env` sudah benar.

Jika worker gagal konek Redis, cek:

- Redis sudah berjalan.
- `REDIS_URL` di `backend/.env` sesuai.

Jika `make run` gagal di frontend, cek:

- Bun sudah terinstall.
- `bun` tersedia di PATH.
- Dependency frontend sudah diinstall dengan `make install` atau `cd frontend && bun install`.
