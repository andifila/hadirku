# Database — Skema & Kebijakan Akses

Semua tabel ada di Supabase PostgreSQL. Schema lengkap ada di [`supabase/schema.sql`](../supabase/schema.sql).

---

## Enum

```sql
plan_type   → 'free' | 'premium'
rsvp_status → 'pending' | 'attending' | 'not_attending'
```

---

## Tabel

### `profiles`
Dibuat otomatis saat user mendaftar via trigger `on_auth_user_created`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | Sama dengan `auth.users.id` |
| `email` | text | Email user |
| `full_name` | text | Nama lengkap (opsional) |
| `plan` | plan_type | `'free'` atau `'premium'` (default: `'free'`) |
| `created_at` | timestamptz | Waktu daftar |

**RLS:** User hanya bisa baca & update profil sendiri.

---

### `templates`
Data tema undangan. Diisi manual via SQL seed.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | Nama tampil (contoh: "Rustic Gold") |
| `slug` | text (unique) | Identifier tema (contoh: `rustic-gold`) |
| `thumbnail_url` | text | URL gambar preview tema |
| `is_premium` | boolean | Apakah hanya untuk akun premium |
| `sort_order` | int | Urutan tampil di form |

**RLS:** Semua orang bisa baca (public read).

**Tema yang tersedia:**

| Nama | Slug | Premium |
|---|---|---|
| Garden Bloom | `garden-bloom` | Tidak |
| Rustic Gold | `rustic-gold` | Tidak |
| Modern Minimal | `modern-minimal` | Tidak |
| Royal Elegance | `royal-elegance` | Ya |
| Floral Dream | `floral-dream` | Ya |

---

### `invitations`
Data undangan milik user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | Pemilik undangan |
| `template_id` | uuid (FK → templates) | Tema yang dipilih |
| `slug` | text (unique) | URL path undangan |
| `bride_name` | text | Nama mempelai wanita |
| `bride_title` | text | Gelar mempelai wanita (cth. S.E.) |
| `bride_father_name` | text | Nama ayah mempelai wanita |
| `bride_mother_name` | text | Nama ibu mempelai wanita |
| `bride_instagram` | text | Instagram handle mempelai wanita |
| `groom_name` | text | Nama mempelai pria |
| `groom_title` | text | Gelar mempelai pria (cth. S.T.) |
| `groom_father_name` | text | Nama ayah mempelai pria |
| `groom_mother_name` | text | Nama ibu mempelai pria |
| `groom_instagram` | text | Instagram handle mempelai pria |
| `event_date` | date | Tanggal resepsi |
| `event_time` | time | Jam resepsi |
| `venue_name` | text | Nama gedung/tempat resepsi |
| `venue_address` | text | Alamat lengkap resepsi |
| `akad_date` | date | Tanggal akad nikah (opsional) |
| `akad_time` | time | Jam akad nikah |
| `akad_venue_name` | text | Nama tempat akad nikah |
| `akad_venue_address` | text | Alamat tempat akad nikah |
| `dresscode` | text | Kode pakaian / dress code (opsional) |
| `cover_image_url` | text | URL foto cover (Supabase Storage `covers`) |
| `gallery_url_1` | text | URL foto galeri 1 (Supabase Storage `covers`) |
| `gallery_url_2` | text | URL foto galeri 2 (Supabase Storage `covers`) |
| `gallery_url_3` | text | URL foto galeri 3 (Supabase Storage `covers`) |
| `gallery_url_4` | text | URL foto galeri 4 |
| `gallery_url_5` | text | URL foto galeri 5 |
| `gallery_url_6` | text | URL foto galeri 6 |
| `music_url` | text | URL musik background (Supabase Storage `music`) |
| `custom_message` | text | Kutipan/pesan kustom |
| `bank_accounts` | jsonb | Array rekening angpao: `[{bank, account_name, account_number, qris_url?}]` |
| `gift_address` | text | Alamat pengiriman hadiah fisik (opsional) |
| `owner_whatsapp` | text | Nomor WA owner untuk konfirmasi tamu (opsional) |
| `timezone` | text | Zona waktu acara: `'WIB'`, `'WITA'`, `'WIT'` (default: `'WIB'`) |
| `rsvp_closes_at` | timestamptz | Batas waktu RSVP (opsional); setelah ini RSVP ditolak |
| `primary_color` | text | Warna aksen kustom (hex, opsional) |
| `is_published` | boolean | Apakah undangan bisa diakses publik |
| `view_count` | integer | Jumlah kunjungan halaman undangan (increment via RPC) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-update via trigger |

**RLS:**
- Owner: bisa select / insert / update / delete undangan sendiri
- Publik: hanya bisa baca undangan yang `is_published = true`

---

### `guests`
Daftar tamu per undangan. Diisi oleh owner (manual/Excel) atau tamu sendiri (RSVP).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | |
| `invitation_id` | uuid (FK → invitations) | Undangan yang terkait |
| `name` | text | Nama tamu |
| `phone` | text | Nomor WhatsApp (opsional) |
| `rsvp_status` | rsvp_status | Status konfirmasi (default: `'pending'`) |
| `message` | text | Ucapan/doa dari tamu |
| `guest_count` | integer | Jumlah orang yang dibawa (default: 1, null jika tidak hadir) |
| `is_message_public` | boolean | `true` = ucapan tampil publik; `false` = hanya owner (default: `true`) |
| `created_at` | timestamptz | |

**RLS:**
- Owner: bisa select / insert / update / delete tamu dari undangan sendiri
- Publik: bisa insert RSVP ke undangan yang sudah dipublish
- Publik: bisa baca tamu dari undangan yang sudah dipublish (untuk tampil ucapan)

---

## View

### `invitation_stats`
Agregasi statistik per undangan. Dipakai di dashboard.

Dibuat dengan `security_invoker = true` — RLS pada tabel `invitations` tetap aktif saat view di-query, mencegah kebocoran data antar user.

| Kolom | Keterangan |
|---|---|
| `invitation_id` | ID undangan |
| `user_id` | Pemilik |
| `slug` | Slug undangan |
| `bride_name` | Nama mempelai wanita |
| `groom_name` | Nama mempelai pria |
| `event_date` | Tanggal acara |
| `is_published` | Status publish |
| `view_count` | Total kunjungan halaman |
| `total_guests` | Total tamu terdaftar |
| `attending` | Jumlah konfirmasi hadir |
| `not_attending` | Jumlah konfirmasi tidak hadir |
| `pending` | Jumlah belum konfirmasi |
| `total_seats` | Total kursi (sum `guest_count` dari tamu yang hadir) |

---

## RPC Functions

### `increment_view_count(p_invitation_id uuid)`
Tambah `view_count` pada undangan yang sudah dipublish secara atomik.

- `SECURITY DEFINER` — anon bisa memanggil tanpa akses langsung ke tabel
- Hanya update jika `is_published = true`
- Grant EXECUTE ke `anon` dan `authenticated`

Dipanggil dari `invite/page.tsx` setiap kali halaman undangan dibuka.

---

## Storage Buckets

| Bucket | Isi | Max Size |
|---|---|---|
| `covers` | Foto cover + foto galeri undangan | 5 MB per file |
| `music` | File musik background | 8 MB |

Format cover/galeri: JPEG, PNG, WebP  
Format musik: MP3

Setup bucket ada di [`supabase/storage-setup.sql`](../supabase/storage-setup.sql).

---

## Migrasi Live Database

Setup fresh: jalankan `supabase/schema.sql` (sudah include semua kolom + view + RPC).

Untuk database yang sudah berjalan, jalankan file migrasi secara berurutan:

| File | Tanggal | Isi |
|---|---|---|
| `supabase/migrations/001_additional_columns.sql` | 23 Mei 2026 | `timezone`, `rsvp_closes_at`, `gallery_url_4/5/6` di invitations; `is_message_public` di guests |
| `supabase/migrations/002_cascade_rls_analytics.sql` | 25 Mei 2026 | ON DELETE CASCADE pada guests FK; `view_count` di invitations; `invitation_stats` view dengan `security_invoker = true`; RPC `increment_view_count` |
