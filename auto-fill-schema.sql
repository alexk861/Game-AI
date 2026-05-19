-- ============================================
-- UNCANNY — Auto-Fill Schema Migration
-- Run this in Supabase SQL Editor BEFORE deploying auto-fill code.
-- Safe, non-destructive. Existing data is unaffected.
-- ============================================

-- 1. Expand set_order constraint from 1-5 to 1-9
--    Supports: Daily Set (1-5), Unstable Set (6-8), Black Archive (9)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_set_order_check;
ALTER TABLE challenges
  ADD CONSTRAINT challenges_set_order_check
  CHECK (set_order BETWEEN 1 AND 9);

-- 2. Add composite index for fast schedule gap detection
CREATE INDEX IF NOT EXISTS idx_challenges_set_date_order
  ON challenges (set_date, set_order);

-- 3. No constraint changes needed on content_candidates.
--    The 'auto_approved' status is handled at the application level.
--    Valid statuses: 'review', 'approved', 'rejected', 'auto_approved'
