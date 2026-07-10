-- ============================================================
-- UNCANNY — Missing Columns, Indexes & Leaderboard Schema
-- Run this in your new Supabase SQL Editor
-- (https://supabase.com/dashboard/project/udbaxpyzurywekllytgd/sql/new)
-- ============================================================

-- 1. Add missing columns to content_candidates (from 20260519172550)
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS prompt_used text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS negative_prompt_used text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS intended_ai_tells text[];
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS parent_real_candidate_id uuid;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS matched_real_category text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS safety_status text default 'pending';
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS safety_flags text[];
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS auto_approve_eligible boolean default false;

-- Update constraints on content_candidates status
ALTER TABLE public.content_candidates DROP CONSTRAINT IF EXISTS content_candidates_status_check;
ALTER TABLE public.content_candidates
  ADD CONSTRAINT content_candidates_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'auto_approved', 'deleted'));

-- Update foreign key constraint on content_candidates
ALTER TABLE public.content_candidates DROP CONSTRAINT IF EXISTS content_candidates_parent_real_candidate_id_fkey;
ALTER TABLE public.content_candidates
  ADD CONSTRAINT content_candidates_parent_real_candidate_id_fkey
  FOREIGN KEY (parent_real_candidate_id) REFERENCES public.content_candidates(id);

-- Create index for AI eligible status
CREATE INDEX IF NOT EXISTS idx_content_candidates_ai_eligible
  ON public.content_candidates (status, source, source_type, answer, safety_status, auto_approve_eligible);


-- 2. Add curation and telemetry columns to content_candidates (from 20260520235500)
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS curator_blessed boolean NOT NULL DEFAULT false;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS curator_priority integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS curator_notes text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS curator_locked boolean NOT NULL DEFAULT false;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS anomaly_tier integer NOT NULL DEFAULT 0 CHECK (anomaly_tier BETWEEN 0 AND 3);

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_served_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_correct_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_wrong_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_timeout_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS average_decision_ms integer NOT NULL DEFAULT 0;

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS disagreement_score numeric(5, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS consensus_confidence numeric(5, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS suspicion_accuracy numeric(5, 4) NOT NULL DEFAULT 0.0000;

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_reflection_unlocks integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS reflection_unlock_rate numeric(5, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_replay_clicks integer NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS replay_interest_score numeric(5, 4) NOT NULL DEFAULT 0.0000;

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_guess_confidence_sum bigint NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_guess_confidence_sq_sum numeric NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_answer_change_count bigint NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_investigation_duration_ms bigint NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS total_reflection_duration_ms bigint NOT NULL DEFAULT 0;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS average_reflection_duration_ms integer NOT NULL DEFAULT 0;

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS confidence_variance_score numeric(5, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS slow_burn_score numeric(5, 4) NOT NULL DEFAULT 0.0000;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS candidate_decay_score numeric(5, 4) NOT NULL DEFAULT 0.0000;

ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS composition_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS emotional_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS lighting_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS perspective_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS scene_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS object_fingerprint text;
ALTER TABLE public.content_candidates ADD COLUMN IF NOT EXISTS texture_fingerprint text;

-- Create Performance Index
CREATE INDEX IF NOT EXISTS idx_candidates_disagreement_intelligence 
  ON public.content_candidates (disagreement_score, slow_burn_score, confidence_variance_score, candidate_decay_score, status);


-- 3. Partial Unique Index on source_photo_id (from 20260520191400)
DROP INDEX IF EXISTS public.idx_content_candidates_source_photo_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_candidates_source_photo_id
  ON public.content_candidates(source_photo_id)
  WHERE source_photo_id IS NOT NULL;


-- 4. Create daily_set_attempts table and leaderboard (from 20260531_create_leaderboard.sql)
CREATE TABLE IF NOT EXISTS public.daily_set_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_date date NOT NULL,
  device_id text NOT NULL,
  display_name varchar(20),
  score int NOT NULL CHECK (score BETWEEN 0 AND 5),
  grid varchar(20) NOT NULL, -- Holds spoiler-free grid symbols e.g. "▣ ☒ ▣ ▣ ⬚"
  completion_ms int NOT NULL,
  submission_count int NOT NULL DEFAULT 1, -- Tracks submissions per device/date for rate-limiting
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (set_date, device_id)
);

-- Enable RLS
ALTER TABLE public.daily_set_attempts ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies
DROP POLICY IF EXISTS "Public read attempts" ON public.daily_set_attempts;
CREATE POLICY "Public read attempts" ON public.daily_set_attempts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.daily_set_attempts;
CREATE POLICY "Allow insert for all" ON public.daily_set_attempts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for owners" ON public.daily_set_attempts;
CREATE POLICY "Allow update for owners" ON public.daily_set_attempts
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create high-performance compound indexes for quick rankings and lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings 
ON public.daily_set_attempts (set_date, score DESC, completion_ms ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_device_lookup
ON public.daily_set_attempts (set_date, device_id);

-- Atomic Transaction Database RPC for safe Upserts
CREATE OR REPLACE FUNCTION public.upsert_leaderboard_attempt(
  p_set_date date,
  p_device_id text,
  p_display_name varchar,
  p_score int,
  p_grid varchar,
  p_completion_ms int
) RETURNS jsonb AS $$
DECLARE
  v_submission_count int;
  v_exists boolean;
BEGIN
  -- Verify if player entry already exists for this daily set
  SELECT EXISTS(
    SELECT 1 FROM public.daily_set_attempts 
    WHERE set_date = p_set_date AND device_id = p_device_id
  ) INTO v_exists;

  IF v_exists THEN
    SELECT submission_count FROM public.daily_set_attempts 
    WHERE set_date = p_set_date AND device_id = p_device_id
    INTO v_submission_count;

    -- Block if user has reached the submission cap (5 writes)
    IF v_submission_count >= 5 THEN
      RETURN jsonb_build_object('status', 'blocked');
    END IF;

    -- Update only if the new score is higher, or equal score with a faster completion time
    UPDATE public.daily_set_attempts SET
      submission_count = submission_count + 1,
      display_name = p_display_name,
      score = CASE 
        WHEN p_score > score THEN p_score
        WHEN p_score = score AND p_completion_ms < completion_ms THEN p_score
        ELSE score
      END,
      grid = CASE 
        WHEN p_score > score THEN p_grid
        WHEN p_score = score AND p_completion_ms < completion_ms THEN p_grid
        ELSE grid
      END,
      completion_ms = CASE 
        WHEN p_score > score THEN p_completion_ms
        WHEN p_score = score AND p_completion_ms < completion_ms THEN p_completion_ms
        ELSE completion_ms
      END,
      updated_at = CASE 
        WHEN p_score > score OR (p_score = score AND p_completion_ms < completion_ms) THEN now()
        ELSE updated_at
      END
    WHERE set_date = p_set_date AND device_id = p_device_id;
    
    RETURN jsonb_build_object('status', 'updated');
  ELSE
    -- First time entry
    INSERT INTO public.daily_set_attempts (
      set_date, device_id, display_name, score, grid, completion_ms, submission_count
    ) VALUES (
      p_set_date, p_device_id, p_display_name, p_score, p_grid, p_completion_ms, 1
    );
    
    RETURN jsonb_build_object('status', 'inserted');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
