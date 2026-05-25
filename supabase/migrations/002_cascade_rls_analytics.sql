-- Migration 002: ON DELETE CASCADE, RLS view, view_count analytics
-- Run in Supabase SQL Editor (Dashboard > SQL > New query)

-- Fix guests FK — add ON DELETE CASCADE for existing databases.
-- (schema.sql already has this; running ALTER on a fresh DB is a no-op if constraint name matches.)
ALTER TABLE guests
  DROP CONSTRAINT IF EXISTS guests_invitation_id_fkey;
ALTER TABLE guests
  ADD CONSTRAINT guests_invitation_id_fkey
    FOREIGN KEY (invitation_id)
    REFERENCES invitations(id)
    ON DELETE CASCADE;

-- Analytics: page-view counter per invitation
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Recreate invitation_stats view with security_invoker so RLS on invitations
-- is applied when the view is queried (prevents cross-user data leakage).
-- Also exposes view_count for the dashboard.
-- Must DROP first because CREATE OR REPLACE cannot reorder/add mid-list columns.
DROP VIEW IF EXISTS invitation_stats;
CREATE VIEW invitation_stats
WITH (security_invoker = true) AS
SELECT
  i.id              AS invitation_id,
  i.user_id,
  i.slug,
  i.bride_name,
  i.groom_name,
  i.event_date,
  i.is_published,
  i.view_count,
  count(g.id)                                                                         AS total_guests,
  count(g.id) FILTER (WHERE g.rsvp_status = 'attending')                              AS attending,
  count(g.id) FILTER (WHERE g.rsvp_status = 'not_attending')                          AS not_attending,
  count(g.id) FILTER (WHERE g.rsvp_status = 'pending')                                AS pending,
  coalesce(sum(g.guest_count) FILTER (WHERE g.rsvp_status = 'attending'), 0)          AS total_seats
FROM invitations i
LEFT JOIN guests g ON g.invitation_id = i.id
GROUP BY i.id;

-- RPC: atomically increment view_count.
-- SECURITY DEFINER so it runs with owner privileges regardless of caller auth.
-- Only increments for published invitations — unpublished = preview, not counted.
CREATE OR REPLACE FUNCTION increment_view_count(p_invitation_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE invitations
  SET view_count = view_count + 1
  WHERE id = p_invitation_id
    AND is_published = true;
$$;

-- Allow anonymous visitors (public invite page) to call this RPC.
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;
