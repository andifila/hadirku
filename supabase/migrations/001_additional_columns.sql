-- Migration: Add timezone, RSVP cutoff, private messages, gallery expansion
-- Run in Supabase SQL Editor (Dashboard > SQL > New query)

-- #2 / #11 — Timezone field on invitations
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS timezone text
    NOT NULL DEFAULT 'WIB'
    CHECK (timezone IN ('WIB', 'WITA', 'WIT'));

-- #6 — RSVP cutoff date
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS rsvp_closes_at timestamptz;

-- #12 — Private message toggle on guests (is_message_public = false means host only)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_message_public boolean NOT NULL DEFAULT true;

-- #13 — Gallery expansion (photos 4, 5, 6)
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS gallery_url_4 text,
  ADD COLUMN IF NOT EXISTS gallery_url_5 text,
  ADD COLUMN IF NOT EXISTS gallery_url_6 text;

