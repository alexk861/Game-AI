-- ============================================
-- UNCANNY — Combined Database Migration Schema
-- Run this in your new Supabase SQL Editor
-- (https://supabase.com/dashboard/project/udbaxpyzurywekllytgd/sql/new)
-- ============================================

-- 1. Create content_candidates table (Inbound pipeline)
CREATE TABLE IF NOT EXISTS public.content_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text DEFAULT 'unsplash',
  source_photo_id text,
  image_url text,
  image_thumb_url text,
  photographer_name text,
  photographer_url text,
  unsplash_url text,
  download_location text,
  query text,
  category text,
  candidate_score numeric,
  suspicious_score numeric,
  difficulty_suggestion int,
  suggested_context text,
  license_note text,
  status text DEFAULT 'review',
  rejection_reason text,
  parent_real_candidate_id uuid REFERENCES public.content_candidates(id),
  generation_seed text,
  generation_model text,
  generation_version text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_candidates_source_photo_id ON public.content_candidates(source_photo_id);

-- 2. Create challenges table (Daily sets mapped to date and order)
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_date date NOT NULL,
  set_order int NOT NULL CHECK (set_order BETWEEN 1 AND 20), -- Supports 20 daily challenges
  image_url text NOT NULL,
  answer text NOT NULL CHECK (answer IN ('ai', 'real')),
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  context_short text NOT NULL,
  ai_prompt text,
  source_credit text,
  guesses_ai int NOT NULL DEFAULT 0,
  guesses_real int NOT NULL DEFAULT 0,
  source_type text DEFAULT 'manual',
  photographer_name text,
  photographer_url text,
  unsplash_url text,
  download_location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (set_date, set_order)
);

CREATE INDEX IF NOT EXISTS idx_challenges_set_date ON public.challenges (set_date);

-- 3. Create ai_generation_runs table (Background AI run tracking)
CREATE TABLE IF NOT EXISTS public.ai_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error_message text,
  parent_real_candidate_id uuid REFERENCES public.content_candidates(id),
  category text NOT NULL,
  prompt_used text,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_runs ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
DROP POLICY IF EXISTS "Public read" ON public.challenges;
CREATE POLICY "Public read" ON public.challenges
  FOR SELECT USING (set_date <= CURRENT_DATE);

DROP POLICY IF EXISTS "Allow all operations for service role" ON public.ai_generation_runs;
CREATE POLICY "Allow all operations for service role" ON public.ai_generation_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for service role" ON public.content_candidates;
CREATE POLICY "Allow all operations for service role" ON public.content_candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. submit_guess atomic increment RPC function
CREATE OR REPLACE FUNCTION public.submit_guess(
  challenge_uuid uuid,
  guess_type text
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Validate guess type
  IF guess_type NOT IN ('ai', 'real') THEN
    RAISE EXCEPTION 'Invalid guess type: %', guess_type;
  END IF;

  -- Atomically increment the appropriate counter
  IF guess_type = 'ai' THEN
    UPDATE public.challenges SET guesses_ai = guesses_ai + 1 WHERE id = challenge_uuid;
  ELSE
    UPDATE public.challenges SET guesses_real = guesses_real + 1 WHERE id = challenge_uuid;
  END IF;

  -- Return the challenge result
  SELECT json_build_object(
    'answer', c.answer,
    'context_short', c.context_short,
    'ai_prompt', c.ai_prompt,
    'source_credit', c.source_credit,
    'photographer_name', c.photographer_name,
    'photographer_url', c.photographer_url,
    'unsplash_url', c.unsplash_url,
    'guesses_ai', c.guesses_ai,
    'guesses_real', c.guesses_real
  ) INTO result
  FROM public.challenges c WHERE c.id = challenge_uuid;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Challenge not found: %', challenge_uuid;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
