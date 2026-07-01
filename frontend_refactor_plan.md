# Frontend Refactor Plan

## Tujuan

Merestrukturisasi frontend agar `src/App.jsx` tidak menjadi file tunggal yang terlalu panjang dan sulit dirawat.
Targetnya adalah memecah kode berdasarkan domain fitur, menjaga behavior tetap sama, dan membuat kode lebih mudah dites, dibaca, serta dikembangkan.

## Prinsip Clean Code

- Pisahkan kode berdasarkan fitur, bukan hanya berdasarkan tipe file.
- `App.jsx` hanya mengatur shell aplikasi, route, dan wiring global.
- Komponen UI fokus pada render dan interaksi lokal.
- Fetching data, route state, sorting, filtering, dan export dipindahkan ke hooks atau utils.
- Refactor dilakukan bertahap dengan build verification setelah setiap tahap.
- Hindari perubahan behavior saat refactor. Perubahan fitur dilakukan setelah struktur stabil.

## Struktur Target

```text
frontend/src/
+-- App.jsx
+-- routes/
|   +-- AppRoutes.jsx
+-- layouts/
|   +-- AppShell.jsx
|   +-- AppHeader.jsx
|   +-- Breadcrumbs.jsx
+-- features/
|   +-- exchanges/
|   |   +-- ExchangesPage.jsx
|   |   +-- ExchangeDetailPage.jsx
|   |   +-- ExchangeTable.jsx
|   |   +-- ExchangeGrid.jsx
|   |   +-- ExchangeMarketTable.jsx
|   |   +-- hooks/
|   |   |   +-- useExchangeRoute.js
|   |   |   +-- useExchangeMarketData.js
|   |   |   +-- useExchangeMarketTable.js
|   |   +-- utils/
|   |       +-- exchangeCsv.js
|   |       +-- exchangeFilters.js
|   +-- prices/
|   +-- transactions/
|   +-- balances/
|   +-- portfolio/
|   +-- agent/
+-- components/
|   +-- CoinIcon.jsx
|   +-- ExchangeIcon.jsx
|   +-- PriceSparkline.jsx
|   +-- ui/
|       +-- Badge.jsx
|       +-- Card.jsx
|       +-- TabButton.jsx
|       +-- StatusChip.jsx
+-- hooks/
+-- api/
+-- utils/
+-- constants/
```

## Target Ukuran File

| File Type | Target Ukuran |
| --- | --- |
| `App.jsx` | 80-150 baris |
| Page/container | 150-300 baris |
| Tabel besar | 200-400 baris |
| Hook | 50-180 baris |
| Utility | kecil, pure function, mudah dites |

## Tahap 1: Extract Layout

Pindahkan bagian layout global dari `App.jsx` ke:

```text
frontend/src/layouts/AppShell.jsx
frontend/src/layouts/AppHeader.jsx
frontend/src/layouts/Breadcrumbs.jsx
```

Komponen yang dipindahkan:

- Header utama aplikasi.
- Status auto refresh.
- Toggle compact UI.
- Breadcrumb halaman detail exchange.

Target setelah tahap ini:

- `App.jsx` tidak lagi berisi markup header panjang.
- Header tetap tampil sama secara visual.
- Breadcrumb bisa dipakai ulang untuk halaman lain.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 2: Extract Exchanges Feature

Pindahkan seluruh UI tab Exchanges ke folder:

```text
frontend/src/features/exchanges/
```

File awal yang dibuat:

```text
ExchangesPage.jsx
ExchangeDetailPage.jsx
```

`ExchangesPage.jsx` bertanggung jawab untuk:

- Fetch daftar exchange.
- Loading dan error state.
- Switch view table/grid.
- Membuka route detail exchange.

`ExchangeDetailPage.jsx` bertanggung jawab untuk:

- Header detail exchange.
- Overview tab.
- Market data tab.
- Tombol kembali.
- Integrasi breadcrumb.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 3: Extract Exchange Table dan Grid

Pecah render daftar exchange menjadi:

```text
ExchangeTable.jsx
ExchangeGrid.jsx
```

Contoh props:

```jsx
<ExchangeTable
  exchanges={exchanges}
  compactMode={compactMode}
  onOpenExchange={openExchange}
/>
```

Tujuan:

- Mengurangi panjang `ExchangesPage.jsx`.
- Memisahkan view mode table dan grid.
- Membuat table/grid mudah diubah tanpa menyentuh logic route atau fetch.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 4: Extract Market Data Table

Pindahkan tabel market data pada halaman detail exchange ke:

```text
ExchangeMarketTable.jsx
```

Komponen ini menerima props:

- daftar pair.
- market data lookup.
- loading/error.
- sort config.
- selected rows.
- handler selection.
- handler export CSV.

Tujuan:

- `ExchangeDetailPage.jsx` hanya menyusun section halaman.
- Logic tabel market tidak bercampur dengan overview exchange.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 5: Extract Hooks

Buat hooks khusus feature exchanges:

```text
features/exchanges/hooks/useExchangeRoute.js
features/exchanges/hooks/useExchangeMarketData.js
features/exchanges/hooks/useExchangeMarketTable.js
```

`useExchangeRoute.js`:

- Membaca route `/exchanges/:id`.
- Membuka halaman detail exchange.
- Kembali ke daftar exchange.
- Sinkron dengan tombol browser back/forward.

`useExchangeMarketData.js`:

- Fetch market data exchange.
- Auto refresh setiap 10 detik.
- Loading/error state.
- Data lookup per pair.

`useExchangeMarketTable.js`:

- Search market pair.
- Sort market pair.
- Select row.
- Select all visible rows.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 6: Extract Utils

Pindahkan logic pure function ke:

```text
features/exchanges/utils/exchangeCsv.js
features/exchanges/utils/exchangeFilters.js
```

`exchangeCsv.js`:

- Build CSV headers.
- Build CSV rows.
- Generate filename.
- Trigger download CSV.

`exchangeFilters.js`:

- Filter pair berdasarkan query.
- Sort pair berdasarkan config.
- Normalisasi key lookup.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 7: Extract UI Components

Ambil komponen reusable secara bertahap:

```text
components/ui/Badge.jsx
components/ui/Card.jsx
components/ui/TabButton.jsx
components/ui/StatusChip.jsx
components/PriceSparkline.jsx
```

Prioritas:

1. `PriceSparkline`, karena sudah cukup mandiri.
2. `StatusChip`, karena dipakai di header.
3. `Badge`, karena banyak dipakai di exchange.
4. `TabButton`, jika style tab mulai berulang.

Jangan membuat design system terlalu besar di awal. Ambil yang benar-benar mengurangi duplikasi nyata.

Verifikasi:

```bash
npm.cmd run build
```

## Tahap 8: Refactor Fitur Lain

Setelah `exchanges` stabil, lanjutkan fitur lain:

1. `prices`
2. `transactions`
3. `balances`
4. `portfolio`
5. `agent`

Setiap fitur sebaiknya punya pola:

```text
features/<feature-name>/
+-- <FeatureName>Page.jsx
+-- components...
+-- hooks...
+-- utils...
```

## Urutan Eksekusi yang Disarankan

1. Extract `AppHeader`.
2. Extract `Breadcrumbs`.
3. Extract `ExchangeDetailPage`.
4. Extract `ExchangesPage`.
5. Extract `ExchangeTable`.
6. Extract `ExchangeGrid`.
7. Extract `ExchangeMarketTable`.
8. Extract `useExchangeRoute`.
9. Extract `useExchangeMarketData`.
10. Extract `useExchangeMarketTable`.
11. Extract CSV/filter utils.
12. Extract UI components kecil.
13. Lanjut refactor fitur lain.

## Checklist Setiap Tahap

- Tidak mengubah behavior yang tidak terkait refactor.
- Tidak mengubah API contract.
- Build berhasil.
- Tidak ada import mati.
- Nama file dan component jelas.
- Props component tidak terlalu banyak. Jika props mulai terlalu banyak, pecah lagi atau gunakan hook/container.

Command verifikasi:

```bash
npm.cmd run build
```

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Behavior berubah saat extract component | Pindahkan kode apa adanya dulu, baru rapikan |
| Props drilling terlalu panjang | Gunakan container component atau feature hook |
| Route detail rusak saat refresh halaman | Pastikan Vite/dev server fallback ke `index.html` |
| CSS global makin sulit dilacak | Mulai kelompokkan class per feature setelah struktur JSX stabil |
| Refactor terlalu besar | Commit per tahap kecil |

## Definisi Selesai

Refactor dianggap selesai ketika:

- `App.jsx` hanya berisi shell, route, dan wiring global.
- Fitur exchanges sudah berada di `features/exchanges`.
- Detail exchange berada di route sendiri.
- Header dan breadcrumb berada di layout component.
- Build frontend berhasil.
- Tidak ada behavior utama yang berubah dari sisi pengguna.
