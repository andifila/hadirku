# Panduan Setup

## Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com)
- (Opsional) Akun GitHub untuk deploy ke GitHub Pages

---

## 1. Clone & Install

```bash
git clone https://github.com/<username>/invitation-wedding.git
cd invitation-wedding
npm install
```

---

## 2. Setup Supabase

### Buat project baru di Supabase Dashboard

1. Masuk ke [supabase.com](https://supabase.com) → **New Project**
2. Catat **Project URL** dan **anon public key** dari menu *Project Settings → API*

### Jalankan schema database

Buka **SQL Editor** di Supabase Dashboard, lalu jalankan:

```
supabase/schema.sql
```

Ini akan membuat semua tabel, enum, RLS policy, trigger, dan mengisi data template.

### Setup Storage

Jalankan juga:

```
supabase/storage-setup.sql
```

Ini membuat bucket `covers` dan `music` dengan akses publik baca.

### Aktifkan Auth

Di menu *Authentication → Providers*:
- Aktifkan **Email** (magic link sudah cukup untuk mulai)
- Atur **Site URL** ke URL deploy kamu (atau `http://localhost:3000` untuk dev)
- Tambahkan redirect URL: `http://localhost:3000/auth/callback`

---

## 3. Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Jangan commit file ini. Sudah ada di `.gitignore`.

---

## 4. Jalankan Lokal

```bash
npm run dev
```

Buka `http://localhost:3000`.

---

## 5. Build & Deploy ke GitHub Pages

### Konfigurasi `next.config.ts`

`basePath` dan `assetPrefix` sudah dikonfigurasi otomatis untuk GitHub Pages:

```ts
basePath: process.env.NODE_ENV === "production" ? "/invitation-wedding" : "",
```

Ganti `invitation-wedding` jika nama repo kamu berbeda.

### Build static

```bash
npm run build
```

Output ada di folder `out/`.

### Deploy manual

Push folder `out/` ke branch `gh-pages`, atau pakai GitHub Actions.

### Environment Variables di GitHub

Tambahkan di *Repository Settings → Secrets and variables → Actions*:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Struktur Env

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |

Semua variabel diawali `NEXT_PUBLIC_` karena dipakai di sisi client (browser).
