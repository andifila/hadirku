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
| `groom_name` | text | Nama mempelai pria |
| `event_date` | date | Tanggal acara |
| `event_time` | time | Jam acara |
| `venue_name` | text | Nama gedung/tempat |
| `venue_address` | text | Alamat lengkap |
| `cover_image_url` | text | URL foto cover (Supabase Storage) |
| `music_url` | text | URL musik background (Supabase Storage) |
| `custom_message` | text | Kutipan/pesan kustom |
| `is_published` | boolean | Apakah undangan bisa diakses publik |
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
| `created_at` | timestamptz | |

**RLS:**
- Owner: bisa select / insert / update / delete tamu dari undangan sendiri
- Publik: bisa insert RSVP ke undangan yang sudah dipublish
- Publik: bisa baca tamu dari undangan yang sudah dipublish (untuk tampil ucapan)

---

## View

### `invitation_stats`
Agregasi statistik per undangan. Dipakai di dashboard.

| Kolom | Keterangan |
|---|---|
| `invitation_id` | ID undangan |
| `user_id` | Pemilik |
| `slug` | Slug undangan |
| `bride_name` | Nama mempelai wanita |
| `groom_name` | Nama mempelai pria |
| `event_date` | Tanggal acara |
| `is_published` | Status publish |
| `total_guests` | Total tamu terdaftar |
| `attending` | Jumlah konfirmasi hadir |
| `not_attending` | Jumlah konfirmasi tidak hadir |
| `pending` | Jumlah belum konfirmasi |

---

## Storage Buckets

| Bucket | Isi | Max Size |
|---|---|---|
| `covers` | Foto cover undangan | 5 MB |
| `music` | File musik background | 8 MB |

Format cover: JPEG, PNG, WebP  
Format musik: MP3

Setup bucket ada di [`supabase/storage-setup.sql`](../supabase/storage-setup.sql).
