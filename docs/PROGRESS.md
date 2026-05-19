# Progress — Wedding Invite App

> Terakhir diperbarui: 19 Mei 2026

## Tech Stack

| Layer | Library / Tools |
|---|---|
| Framework | Next.js 16.2.4 (React 19, App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend / DB | Supabase (Auth, PostgreSQL, Storage) |
| Animasi | Framer Motion |
| Ikon | Lucide React |
| Excel | xlsx (SheetJS) |

---

## Fitur yang Sudah Selesai

### Autentikasi
- [x] Login via Supabase Auth (`/login`)
- [x] Auth callback handler (`/auth/callback`)
- [x] `AuthGuard` component — redirect jika belum login
- [x] `useAuth` hook — expose `user` + `signOut`

### Dashboard (`/dashboard`)
- [x] Tampil undangan pertama milik user (1 undangan per akun)
- [x] Kartu undangan: nama pengantin, tanggal, venue, status published/draft
- [x] Tombol Lihat (preview) + Edit
- [x] Statistik RSVP: Hadir / Tidak Hadir / Belum
- [x] Daftar tamu inline (tanpa halaman terpisah)
- [x] Tambah tamu manual (form inline dengan animasi)
- [x] Upload tamu via Excel (`.xlsx` / `.xls` / `.csv`)
- [x] Download template Excel kosong
- [x] Per tamu: kirim WhatsApp, salin link personal, hapus tamu
- [x] Tampil pesan/ucapan tamu jika ada
- [x] Empty state saat belum ada undangan

### Form Buat / Edit Undangan (`/dashboard/new`, `/dashboard/edit`)
- [x] Pilih template (dari DB)
- [x] Input nama pengantin (mempelai wanita & pria)
- [x] Input tanggal & waktu acara
- [x] Input nama & alamat venue
- [x] Input kutipan / pesan kustom
- [x] Upload foto cover (Supabase Storage, max 5 MB)
- [x] Upload musik background (Supabase Storage, max 10 MB)
- [x] Toggle publish / draft
- [x] Auto-generate slug dari nama pengantin

### Halaman Undangan Publik (`/invite?s=<slug>&to=<nama>`)
- [x] **Amplop / Envelope cover** — animasi slide-up saat dibuka
  - Desain kertas amplop dengan garis diagonal
  - Nama tamu personal ("Kepada Yth. Bapak/Ibu ...")
  - Wax seal interaktif (pulse ring, spring animation)
  - Tombol share WhatsApp di cover
- [x] **5 tema warna** — garden-bloom, rustic-gold, modern-minimal, royal-elegance, floral-dream
- [x] **Hero section** — nama pengantin besar, tanggal, scroll indicator
- [x] **Kutipan** — custom message dengan styling italic
- [x] **Waktu & Tempat** — detail hari/tanggal/jam/lokasi, Google Maps embed (iframe), tombol buka Maps
- [x] **Countdown timer** — hitung mundur real-time (hari/jam/menit/detik)
- [x] **RSVP form** — pilih hadir/tidak hadir, nama, nomor WhatsApp, ucapan/doa
  - Pencegahan duplikat submit via localStorage
  - Pesan konfirmasi setelah submit
  - Share undangan via WhatsApp setelah submit
- [x] **Ucapan & Doa tamu** — tampil setelah ada yang submit RSVP
- [x] **Floating music player** — auto-play saat amplop dibuka, toggle play/pause
- [x] **Footer** — nama pengantin + tanggal
- [x] **FadeSection** — semua section fade-in saat di-scroll (Framer Motion viewport)
- [x] Ornament SVG (lingkaran konsentris + garis diagonal) sebagai background hero

### Database (Supabase)

**Tabel:**
- `profiles` — data user (id, email, full_name, plan)
- `templates` — pilihan tema (name, slug, thumbnail_url, is_premium)
- `invitations` — data undangan lengkap
- `guests` — daftar tamu per undangan (name, phone, rsvp_status, message)

**View:**
- `invitation_stats` — ringkasan per undangan (total, hadir, tidak hadir, pending)

**Supabase libs (`src/lib/supabase/`):**
| File | Fungsi |
|---|---|
| `client.ts` | Inisialisasi Supabase client |
| `auth.ts` | Sign in, sign out, get session |
| `invitations.ts` | Ambil stats undangan milik user |
| `invitation-crud.ts` | CRUD undangan + list template + generate slug |
| `guests.ts` | Tambah, hapus, bulk-add tamu; build invite URL & WA link |
| `rsvp.ts` | Submit RSVP dari tamu |
| `public-invitation.ts` | Ambil undangan by slug (publik) + pesan tamu |
| `storage.ts` | Upload cover & musik ke Supabase Storage |

---

## Struktur File

```
src/
├── app/
│   ├── page.tsx                  # Root redirect
│   ├── layout.tsx                # Root layout + font
│   ├── globals.css               # CSS variables + Tailwind
│   ├── login/page.tsx            # Halaman login
│   ├── auth/callback/page.tsx    # OAuth callback
│   ├── invite/page.tsx           # Halaman undangan publik
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout (auth guard)
│       ├── page.tsx              # Dashboard utama + guest list
│       ├── new/page.tsx          # Buat undangan baru
│       ├── edit/page.tsx         # Edit undangan
│       └── guests/page.tsx       # (legacy — sudah inline di dashboard)
├── components/
│   ├── auth/AuthGuard.tsx
│   └── invitation/InvitationForm.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── utils.ts                  # cn() helper
│   └── supabase/                 # Semua fungsi Supabase
└── types/
    └── index.ts                  # Re-export types
```

---

## Yang Belum / Potensial Dikerjakan

- [ ] Multiple undangan per akun (saat ini hanya 1)
- [ ] Enforcement plan free vs premium (kolom `plan` sudah ada di DB, belum dipakai)
- [ ] Template thumbnails (UI pemilih template masih basic)
- [ ] Paginasi / virtual scroll daftar tamu (jika tamu sangat banyak)
- [ ] Notifikasi email saat ada RSVP masuk
- [ ] Analytics — jumlah view undangan
- [ ] Deploy ke production (Vercel + Supabase production project)
- [ ] Custom domain untuk link undangan
