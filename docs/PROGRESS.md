# Progress — Wedding Invite App

> Terakhir diperbarui: 19 Mei 2026

## Tech Stack

| Layer | Library / Tools |
|---|---|
| Framework | Next.js 16.2.4 (React 19, App Router, Static Export) |
| UI | React 19 + Tailwind CSS v4 + Framer Motion |
| Backend / DB | Supabase (Auth, PostgreSQL, Storage) |
| Bahasa | TypeScript |
| Deploy | GitHub Pages via GitHub Actions |

---

## Fitur yang Sudah Selesai

### Autentikasi
- [x] Login via magic link email (Supabase Auth) — seluruhnya Bahasa Indonesia
- [x] Auth callback handler
- [x] `AuthGuard` — redirect ke `/login` jika belum login
- [x] `useAuth` hook — handle network error agar tidak blank putih
- [x] Root page (`/`) redirect otomatis ke dashboard atau login

### Dashboard (`/dashboard`)
- [x] Kartu undangan: nama pengantin, tanggal, venue, status published/draft
- [x] Warning banner jika undangan masih draft
- [x] Tombol Lihat — otomatis preview mode untuk draft
- [x] Statistik RSVP: Hadir / Tidak Hadir / Belum
- [x] Daftar tamu inline + search/filter nama
- [x] Tambah tamu manual (form inline dengan animasi)
- [x] Upload tamu via Excel (`.xlsx` / `.xls`)
- [x] Download template Excel
- [x] Per tamu: kirim WhatsApp, salin link, hapus (dengan konfirmasi Ya/Batal)
- [x] Tampil pesan/ucapan tamu
- [x] Empty state saat belum ada undangan

### Form Buat / Edit Undangan
- [x] Pilih tema dengan preview warna (5 tema)
- [x] Input nama pengantin, tanggal & waktu, venue
- [x] Warning tanggal lampau
- [x] Input kutipan kustom
- [x] Upload foto cover (Supabase Storage, maks 5 MB) — file lama auto-hapus
- [x] Upload musik background (Supabase Storage, maks 8 MB) — file lama auto-hapus
- [x] Slug kustom dengan validasi reserved words
- [x] Slug tersimpan dengan benar saat edit
- [x] Toggle publish / draft

### Halaman Undangan Publik (`/invite?s=<slug>&to=<nama>`)
- [x] Amplop animasi dengan wax seal interaktif
- [x] Personalisasi nama tamu ("Kepada Yth.")
- [x] 5 tema warna
- [x] Hero: nama pengantin, tanggal, scroll indicator
- [x] Kutipan kustom
- [x] Waktu & Tempat + Google Maps embed + tombol Buka Maps
- [x] Countdown real-time menuju hari H
- [x] RSVP form — dengan dedup server-side (nama yang sama tidak bisa submit 2x)
- [x] Ucapan & Doa dari tamu
- [x] Musik background (auto-play saat amplop dibuka, toggle play/pause)
- [x] WhatsApp share
- [x] Preview mode (`?preview=1`) untuk owner melihat draft
- [x] Network error ditangani — tidak hang, tampil pesan tidak ditemukan

### Infrastruktur
- [x] GitHub Actions: auto-deploy ke GitHub Pages saat push ke `main`
- [x] GitHub Actions: keep-alive ping Supabase setiap 3 hari (cegah free tier pause)
- [x] Clipboard fallback untuk HTTP

### Keamanan / Data
- [x] RLS pada semua tabel (`profiles`, `templates`, `invitations`, `guests`)
- [x] `getUserInvitations` filter by `user_id` — data user tidak bocor ke user lain
- [x] RSVP dedup server-side via `ilike` query

---

## Yang Belum / Perlu Dikerjakan

### High Priority
- [ ] **404 page custom** — GitHub Pages tampilkan 404 generik. Perlu `public/404.html` yang redirect ke `/login`
- [ ] **RLS pada view `invitation_stats`** — perlu tambah `WITH (security_invoker = true)` di SQL Supabase agar RLS tabel `invitations` berlaku saat query view
- [ ] **OG meta tags dinamis** — link undangan yang dibagikan di WA/sosmed preview-nya masih generic. Butuh SSR atau solusi workaround (tidak bisa di static export)

### Medium Priority
- [ ] Rate limiting RSVP — dedup per nama ada, tapi belum ada proteksi spam banyak nama
- [ ] Multiple undangan per akun (saat ini hanya 1)
- [ ] Enforcement plan free vs premium (kolom `plan` sudah ada di DB, belum dipakai)
- [ ] Template thumbnails (saat ini hanya dot warna, tidak ada gambar preview)
- [ ] Notifikasi ke owner saat ada RSVP masuk (email / WA)
- [ ] Analytics — jumlah view undangan

### Low Priority
- [ ] Custom domain untuk link undangan
- [ ] Paginasi daftar tamu (untuk 100+ tamu)
- [ ] Export daftar tamu + status RSVP ke Excel

---

## Catatan Penting

### Supabase Free Tier — Pause Prevention
Project Supabase pause otomatis setelah 7 hari tidak ada request.
Keep-alive workflow di `.github/workflows/keep-alive.yml` ping setiap 3 hari.
Jika terlanjur pause: `https://supabase.com/dashboard` → Resume project.

### Alur Publish Undangan (wajib diikuti)
1. Buat undangan → status **Draft**
2. Edit → aktifkan toggle **Dipublikasikan** → Simpan
3. Baru bisa diakses lewat link publik `/invite?s=<slug>`

Dashboard menampilkan warning banner jika undangan masih draft.

### Slug Update (fix: 19 Mei 2026)
Edit slug di form sekarang tersimpan dengan benar. Jika slug tidak berubah sebelumnya, buka Edit dan simpan ulang.

### RLS `invitation_stats` View — Action Required
Jalankan di Supabase SQL Editor untuk keamanan penuh:
```sql
CREATE OR REPLACE VIEW invitation_stats
WITH (security_invoker = true) AS
SELECT
  i.id              AS invitation_id,
  i.user_id,
  i.slug,
  i.bride_name,
  i.groom_name,
  i.event_date,
  i.is_published,
  count(g.id)                                                  AS total_guests,
  count(g.id) FILTER (WHERE g.rsvp_status = 'attending')      AS attending,
  count(g.id) FILTER (WHERE g.rsvp_status = 'not_attending')  AS not_attending,
  count(g.id) FILTER (WHERE g.rsvp_status = 'pending')        AS pending
FROM invitations i
LEFT JOIN guests g ON g.invitation_id = i.id
GROUP BY i.id;
```
