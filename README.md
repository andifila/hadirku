# Wedding Invite

Aplikasi undangan pernikahan digital berbasis web. Buat undangan, kelola daftar tamu, kirim via WhatsApp, dan pantau RSVP secara real-time.

## Fitur Utama

- Amplop digital dengan animasi buka undangan
- 5 pilihan tema warna (Garden Bloom, Rustic Gold, Modern Minimal, Royal Elegance, Floral Dream)
- Undangan personal per tamu via link unik (`?to=NamaTamu`)
- Upload foto cover & musik background
- Countdown timer menuju hari H
- RSVP online langsung dari halaman undangan
- Dashboard manajemen tamu — tambah manual atau upload Excel
- Kirim undangan via WhatsApp dengan satu klik
- Statistik RSVP real-time (hadir / tidak hadir / belum konfirmasi)

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19 + Tailwind CSS v4 + Framer Motion |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Bahasa | TypeScript |
| Deploy | GitHub Pages |

## Struktur Halaman

| Route | Keterangan |
|---|---|
| `/` | Redirect ke dashboard atau login |
| `/login` | Login dengan email (magic link / OAuth) |
| `/auth/callback` | Callback setelah login |
| `/dashboard` | Dashboard utama + manajemen tamu |
| `/dashboard/new` | Form buat undangan baru |
| `/dashboard/edit?id=...` | Form edit undangan |
| `/invite?s=<slug>&to=<nama>` | Halaman undangan publik |

## Dokumentasi

- [`docs/SETUP.md`](docs/SETUP.md) — Panduan setup lokal & Supabase
- [`docs/DATABASE.md`](docs/DATABASE.md) — Skema database lengkap
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — Status fitur & rencana pengembangan

## Cara Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

> Butuh file `.env.local` dengan kredensial Supabase. Lihat [`docs/SETUP.md`](docs/SETUP.md).
