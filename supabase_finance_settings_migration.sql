-- ============================================================
-- Horizon Hub — Finance Settings Migration
-- Run this in your Supabase project's SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_settings (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  income_categories JSONB       NOT NULL DEFAULT '["Salary","Freelance","Investment","Business","Gift","Other"]',
  expense_categories JSONB      NOT NULL DEFAULT '["Food","Transport","Rent","Health","Entertainment","Education","Shopping","Utilities","Other"]',
  account_sources   JSONB       NOT NULL DEFAULT '["Cash","BCA","Mandiri","BRI","BNI","GoPay","OVO","DANA","ShopeePay","Other"]',
  annual_target     BIGINT      NOT NULL DEFAULT 1000000000,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own finance settings"
  ON finance_settings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
