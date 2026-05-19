-- ============================================
-- UNCANNY MVP — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_date date NOT NULL,
  set_order int NOT NULL CHECK (set_order BETWEEN 1 AND 5),
  image_url text NOT NULL,
  answer text NOT NULL CHECK (answer IN ('ai', 'real')),
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  context_short text NOT NULL,
  ai_prompt text,
  source_credit text,
  guesses_ai int NOT NULL DEFAULT 0,
  guesses_real int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (set_date, set_order)
);

ALTER TABLE challenges 
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS photographer_name text,
  ADD COLUMN IF NOT EXISTS photographer_url text,
  ADD COLUMN IF NOT EXISTS unsplash_url text,
  ADD COLUMN IF NOT EXISTS download_location text;

-- 2. Create index on set_date for fast daily lookups
CREATE INDEX IF NOT EXISTS idx_challenges_set_date ON challenges (set_date);

-- 3. Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- 4. Public read policy (only today and past dates)
DROP POLICY IF EXISTS "Public read" ON challenges;
CREATE POLICY "Public read" ON challenges
  FOR SELECT USING (set_date <= CURRENT_DATE);

-- 5. Submit guess RPC function (atomic counter increment + return result)
CREATE OR REPLACE FUNCTION submit_guess(
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
    UPDATE challenges SET guesses_ai = guesses_ai + 1 WHERE id = challenge_uuid;
  ELSE
    UPDATE challenges SET guesses_real = guesses_real + 1 WHERE id = challenge_uuid;
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
  FROM challenges c WHERE c.id = challenge_uuid;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Challenge not found: %', challenge_uuid;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA — 3 days × 5 challenges each
-- Replace image_url with your Supabase Storage URLs
-- ============================================

-- Day 1 (use today's date)
INSERT INTO challenges (set_date, set_order, image_url, answer, difficulty, context_short, ai_prompt, source_credit) VALUES
  (CURRENT_DATE, 1, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'real', 1, 'A real sunset over the Swiss Alps. Nature doesn''t need a GPU.', NULL, 'Unsplash / Samuel Ferrara'),
  (CURRENT_DATE, 2, 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800', 'real', 2, 'Real waves crashing on a rocky shore. Every droplet is physics, not pixels.', NULL, 'Unsplash / Matt Hardy'),
  (CURRENT_DATE, 3, 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', 'real', 3, 'A real nebula captured by the Hubble telescope. Space is stranger than AI.', NULL, 'NASA/ESA Hubble Heritage'),
  (CURRENT_DATE, 4, 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800', 'real', 4, 'Real bioluminescent plankton lighting up the shore. Nature''s own LED display.', NULL, 'Unsplash / Ishan @seefromthesky'),
  (CURRENT_DATE, 5, 'https://images.unsplash.com/photo-1516298773066-dec3cd46dcfd?w=800', 'real', 5, 'A real lenticular cloud that looks completely artificial. But it''s 100% atmosphere.', NULL, 'Unsplash / USGS')
ON CONFLICT (set_date, set_order) DO NOTHING;

-- Day 2 (tomorrow)
INSERT INTO challenges (set_date, set_order, image_url, answer, difficulty, context_short, ai_prompt, source_credit) VALUES
  (CURRENT_DATE + 1, 1, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', 'real', 1, 'A foggy forest at dawn. Real light filtering through real trees.', NULL, 'Unsplash / Lukasz Szmigiel'),
  (CURRENT_DATE + 1, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'real', 2, 'A real portrait with perfect natural lighting. No prompt needed.', NULL, 'Unsplash / Joseph Gonzalez'),
  (CURRENT_DATE + 1, 3, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'real', 3, 'Earth from space. This image was captured by a real satellite.', NULL, 'Unsplash / NASA'),
  (CURRENT_DATE + 1, 4, 'https://images.unsplash.com/photo-1494587416117-f102a2ac0a8d?w=800', 'real', 4, 'A perfectly symmetrical flower. Evolution is the original designer.', NULL, 'Unsplash / Annie Spratt'),
  (CURRENT_DATE + 1, 5, 'https://images.unsplash.com/photo-1518882174711-1de40238921b?w=800', 'real', 5, 'Northern lights over Iceland. No AI has matched this yet.', NULL, 'Unsplash / Jonatan Pie')
ON CONFLICT (set_date, set_order) DO NOTHING;

-- Day 3 (day after tomorrow)
INSERT INTO challenges (set_date, set_order, image_url, answer, difficulty, context_short, ai_prompt, source_credit) VALUES
  (CURRENT_DATE + 2, 1, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'real', 1, 'Mountain peaks at golden hour. Raw, untouched landscape.', NULL, 'Unsplash / Kalen Emsley'),
  (CURRENT_DATE + 2, 2, 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?w=800', 'real', 2, 'A macro shot of a butterfly wing. Millions of years of evolution in one frame.', NULL, 'Unsplash / Boris Smokrovic'),
  (CURRENT_DATE + 2, 3, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'real', 3, 'Starry night sky over a mountain range. Long exposure, no AI.', NULL, 'Unsplash / Benjamin Voros'),
  (CURRENT_DATE + 2, 4, 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'real', 4, 'Close-up of ice crystals on a window. Nature''s fractals.', NULL, 'Unsplash / Aaron Burden'),
  (CURRENT_DATE + 2, 5, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'real', 5, 'Patagonia landscape that looks CGI. It''s not. It''s Earth.', NULL, 'Unsplash / Pietro De Grandi')
ON CONFLICT (set_date, set_order) DO NOTHING;

-- ============================================
-- CONTENT CANDIDATES PIPELINE
-- ============================================

CREATE TABLE IF NOT EXISTS content_candidates (
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
  candidate_score int,
  suspicious_score int,
  difficulty_suggestion int,
  suggested_context text,
  license_note text,
  status text DEFAULT 'review',
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_candidates_source_photo_id ON content_candidates(source_photo_id);
