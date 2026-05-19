-- ============================================
-- NANO-BANANA — Schema Migration for Text Candidates
-- Run this in Supabase SQL Editor to support text-based candidates from nano-banana.
-- ============================================

-- 1. Make image_url nullable (since nano-banana generates text-only candidates initially)
ALTER TABLE public.content_candidates ALTER COLUMN image_url DROP NOT NULL;

-- 2. Add nano-banana specific columns
ALTER TABLE public.content_candidates 
ADD COLUMN IF NOT EXISTS task_id UUID,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS hook TEXT;

-- 3. Update status check constraint to allow 'draft' (used by nano-banana) and 'auto_approved'
ALTER TABLE public.content_candidates DROP CONSTRAINT IF EXISTS content_candidates_status_check;
ALTER TABLE public.content_candidates
  ADD CONSTRAINT content_candidates_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'auto_approved'));
