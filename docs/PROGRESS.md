# Progress — Hadirku

> Terakhir diperbarui: 25 Mei 2026 (review ke-3)

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
- [x] Statistik RSVP: Hadir / Tidak Hadir / Belum (Quick Stats cards + Response Rate bar)
- [x] Sidebar nav clickable
- [x] Daftar tamu inline + search/filter nama
- [x] Tambah tamu manual (form inline dengan animasi)
- [x] Upload tamu via Excel (`.xlsx` / `.xls`)
- [x] Download template Excel
- [x] Per tamu: kirim WhatsApp, salin link, hapus (dengan konfirmasi Ya/Batal)
- [x] Tampil pesan/ucapan tamu
- [x] Empty state saat belum ada undangan
- [x] **Supabase Realtime** — stats update otomatis saat RSVP baru masuk (indikator "Live" pulse hijau)

### Form Buat / Edit Undangan
- [x] Pilih tema dengan preview warna (5 tema)
- [x] Warna aksen kustom per undangan — 9 preset + color picker bebas
- [x] Input nama pengantin + nama ayah & ibu masing-masing mempelai
- [x] Tanggal & waktu resepsi, venue nama & alamat
- [x] Seksi Akad Nikah (toggle)
- [x] Warning tanggal lampau
- [x] Input dresscode, kutipan kustom
- [x] Upload foto cover (Supabase Storage, maks 5 MB)
- [x] Upload 6 foto galeri
- [x] Upload musik background (maks 8 MB)
- [x] Rekening/Angpao + QRIS (hingga 4 rekening)
- [x] Alamat pengiriman hadiah fisik
- [x] Nomor WhatsApp owner
- [x] Gelar & Instagram handle per mempelai
- [x] Zona waktu (WIB / WITA / WIT)
- [x] Batas waktu RSVP (rsvp_closes_at)
- [x] Slug kustom dengan validasi reserved words
- [x] Toggle publish / draft

### Manajemen Tamu (`/dashboard/guests`)
- [x] Tabel desktop + kartu mobile
- [x] Kolom Kursi — tampilkan guest_count per tamu hadir
- [x] Search + filter per status RSVP
- [x] Edit nama & nomor telepon inline
- [x] Import Excel massal
- [x] WA Blast — step 1: edit template pesan (placeholder `{nama}` & `{link}`), step 2: kirim satu per satu dengan progress bar + tombol Lewati
- [x] **Paginasi** — 50 tamu per halaman, kontrol Sebelumnya / Berikutnya, reset saat filter/search berubah

### Statistik (`/dashboard/stats`)
- [x] Donut chart RSVP
- [x] RSVP per hari (14 hari terakhir)
- [x] Badge "N orang hadir" (total kursi dari guest_count)
- [x] Live feed ucapan tamu
- [x] QR Code undangan
- [x] Export Excel ucapan tamu (kolom: Nama, Status, Kursi, Ucapan, Tanggal)

### Halaman Undangan Publik (`/invite?s=<slug>&to=<nama>`)
- [x] Amplop animasi
- [x] Personalisasi nama tamu
- [x] **5 tema dengan diferensiasi visual nyata:**
  - Garden Bloom: ornamen kelopak bunga, countdown kotak, separator ✿, ikon 🌿
  - Rustic Gold: ornamen lingkaran klasik, countdown kotak, separator ♥, ikon ◇
  - Modern Minimal: grid garis statis, countdown teks besar, separator garis, tanpa ikon
  - Royal Elegance: ornamen mandala 12 jari, countdown pill, separator ✦, ikon ♛
  - Floral Dream: ornamen bunga 6 kelopak, countdown pill, separator ✿, ikon ✿
- [x] RSVP form dengan stepper jumlah tamu (guest_count)
- [x] Countdown real-time (box / pill / text sesuai tema)
- [x] Galeri foto (6 foto)
- [x] Hadiah & Angpao, alamat fisik
- [x] Musik background + WhatsApp share
- [x] Add to Calendar (Google + iCal)
- [x] Ucapan & Doa
- [x] Preview mode untuk owner draft

### Infrastruktur
- [x] GitHub Actions: auto-deploy ke GitHub Pages saat push ke `main`
- [x] GitHub Actions: keep-alive ping Supabase setiap 3 hari
- [x] Clipboard fallback untuk HTTP

### Keamanan / Data
- [x] RLS pada semua tabel
- [x] `getUserInvitations` filter by `user_id`
- [x] RSVP dedup server-side
- [x] **Edge Function `submit-rsvp`** — validasi server-side: published check, deadline check, rate limiting 15/menit, dedup by phone+name, insert; CORS dibatasi ke app origin; validasi panjang name/message/guest_count
- [x] **Rate limiting RSVP** — 15 request/menit per `invitation_id` di Edge Function
- [x] **HTML injection prevention** — `escapeHtml()` di `notify-rsvp` untuk semua field user-supplied
- [x] **CSP via meta tag** — Content-Security-Policy di `layout.tsx` tanpa `unsafe-eval`
- [x] **notify-rsvp auth** — `WEBHOOK_SECRET` header check; validasi payload; `SITE_URL` env var
- [x] **Refactor `invite/page.tsx`** — dipecah dari 2032 baris ke ~700 baris + 9 komponen terpisah di `src/components/invitation/`
- [x] **Shared utils** — `src/lib/constants.ts`, `src/lib/utils/share.ts` (getShareLink/getInviteUrl), `src/components/ui/WaIcon.tsx`, `src/lib/supabase/rsvp-config.ts`; semua duplikasi dihapus
- [x] **`getInvitationBySlug` unified** — satu fungsi dengan param `{ preview }` menggantikan dua fungsi terpisah
- [x] **Dead code** — `markRsvpSubmitted`, `checkRsvpRateLimit`, `buildInviteUrl` dihapus
- [x] **`bulkAddGuests` chunking** — insert per 500 baris agar tidak melebihi batas request Supabase
- [x] **Dashboard optimasi** — hapus `guests` state; Realtime callback hanya re-fetch stats; headcount dari `total_seats` di view
- [x] **`types.ts`** — tambah `total_seats` ke `invitation_stats` view type; fix `guests.Update` type (tambah `name`, `phone`, `is_message_public`); reorder `invitation_stats.Row` sesuai urutan kolom view SQL
- [x] **Dead code** — hapus manual guest deletion di `deleteInvitation` (sudah ditangani FK ON DELETE CASCADE)
- [x] **`as any` removal** — `updateGuest` di `guests.ts` tidak lagi butuh cast setelah `guests.Update` type diperbaiki
- [x] **Guest list safeguard** — `.limit(2000)` pada `getInvitationGuests` sebagai batas atas memori
- [x] **Deno std update** — Edge Functions naik dari `0.168.0` ke `0.224.0`

---

## Yang Belum / Perlu Dikerjakan

### High Priority
- [x] **404 page custom** — `public/404.html` branded, auto-redirect ke `/hadirku/` dalam 5 detik
- [x] **RLS pada view `invitation_stats`** — SQL ada di `supabase/migrations/002_cascade_rls_analytics.sql`
- [x] **ON DELETE CASCADE pada `guests.invitation_id`** — SQL ada di `supabase/migrations/002_cascade_rls_analytics.sql`
- [x] **Set `WEBHOOK_SECRET` di Supabase Edge Function env** — untuk autentikasi webhook `notify-rsvp`
- [x] **Set `SITE_URL` di Supabase Edge Function env** — nilai: `https://andifila.github.io/hadirku`
- [ ] **Supabase magic link redirect URL** — update di Supabase Dashboard → Auth → URL Configuration ke `https://andifila.github.io/hadirku` dan `https://andifila.github.io/hadirku/auth/callback/`

### Medium Priority
- [ ] Enforcement plan free vs premium (kolom `plan` sudah ada di DB)
- [x] **Template thumbnails** — SVG mini-mockup per template di `InvitationForm` (ganti dot warna)
- [x] Notifikasi email ke owner saat RSVP masuk — `notify-rsvp` deployed, dipanggil langsung dari `submit-rsvp` (fire-and-forget)
- [x] **Analytics view_count** — kolom `view_count` di `invitations`, RPC `increment_view_count`, dipanggil dari invite/page.tsx; ditampilkan di dashboard hero

### Low Priority
- [ ] Multiple undangan per akun
- [ ] Custom domain untuk link undangan

---

## Migration SQL (jalankan di Supabase SQL Editor)

File migrasi ada di `supabase/migrations/`. Jalankan secara berurutan:

**001 — Kolom baru (23 Mei 2026)** — `supabase/migrations/001_additional_columns.sql`
```sql
alter table invitations add column if not exists primary_color text;
alter table guests      add column if not exists guest_count      integer not null default 1;
alter table guests      add column if not exists is_message_public boolean not null default true;
```

**002 — CASCADE, RLS, Analytics (25 Mei 2026)** — `supabase/migrations/002_cascade_rls_analytics.sql`
```sql
-- ON DELETE CASCADE pada guests FK
-- invitation_stats view dengan security_invoker = true + view_count
-- view_count column pada invitations
-- RPC increment_view_count(uuid)
-- Lihat file lengkap di supabase/migrations/002_cascade_rls_analytics.sql
```

---

## Arsitektur Komponen Undangan

File `src/app/invite/page.tsx` dipecah menjadi komponen-komponen berikut:

| File | Tanggung Jawab |
|---|---|
| `src/components/invitation/template-config.ts` | Konstanta tema & helper `resolveTheme()` / `resolveExtra()` |
| `src/components/invitation/shared.tsx` | `RevealSection`, `SectionTitle`, `LetterReveal` |
| `src/components/invitation/HeroOrnament.tsx` | SVG ornamen animasi per template |
| `src/components/invitation/TemplateDivider.tsx` | Separator antar nama mempelai per template |
| `src/components/invitation/ConfettiBurst.tsx` | Animasi confetti 64 partikel saat buka amplop |
| `src/components/invitation/RsvpSection.tsx` | Form RSVP lengkap dengan state management |
| `src/components/invitation/MessageWall.tsx` | Tampilan ucapan tamu |
| `src/components/invitation/BankCard.tsx` | Kartu rekening + copy + QRIS toggle |
| `src/components/invitation/ShareButton.tsx` | Tombol share / salin link |

## Edge Functions (Supabase Deno)

| Function | Tanggung Jawab |
|---|---|
| `submit-rsvp` | Validasi & insert RSVP server-side (published, deadline, rate limit, dedup) |
| `notify-rsvp` | Kirim email notifikasi ke owner saat RSVP baru masuk |

### Deploy Edge Functions
```bash
supabase functions deploy submit-rsvp
supabase functions deploy notify-rsvp
```

---

## Catatan Penting

### Supabase Free Tier — Pause Prevention
Project Supabase pause otomatis setelah 7 hari tidak ada request.
Keep-alive workflow di `.github/workflows/keep-alive.yml` ping setiap 3 hari.
Jika terlanjur pause: `https://supabase.com/dashboard` → Resume project.

### Alur Publish Undangan
1. Buat undangan → status **Draft**
2. Edit → aktifkan toggle **Dipublikasikan** → Simpan
3. Baru bisa diakses lewat link publik `/invite?s=<slug>`

### Rename dari invitation-wedding ke hadirku (23 Mei 2026)
- GitHub repo: `andifila/hadirku`
- URL live: `https://andifila.github.io/hadirku`
- basePath: `/hadirku`
- Supabase redirect URL wajib diupdate manual (lihat High Priority di atas)
