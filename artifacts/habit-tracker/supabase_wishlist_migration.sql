-- Run this in your Supabase project → SQL Editor
-- Creates the wishlist_items table with Row Level Security

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  title            TEXT NOT NULL,
  target_amount    NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_savings  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  image_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON public.wishlist_items (user_id);

-- Enable Row Level Security
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see and modify their own rows
CREATE POLICY "Users manage own wishlist"
  ON public.wishlist_items
  FOR ALL
  USING  (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
