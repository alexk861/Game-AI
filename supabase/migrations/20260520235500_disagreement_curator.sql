-- 1. Safely add missing standard columns if not present
ALTER TABLE public.content_candidates 
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS download_location text;

-- 2. Add Curation Overrides
ALTER TABLE public.content_candidates
  ADD COLUMN IF NOT EXISTS curator_blessed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS curator_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS curator_notes text,
  ADD COLUMN IF NOT EXISTS curator_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anomaly_tier integer NOT NULL DEFAULT 0 CHECK (anomaly_tier BETWEEN 0 AND 3);

-- 3. Add Advanced Telemetry Counters & Analytics
ALTER TABLE public.content_candidates
  ADD COLUMN IF NOT EXISTS total_served_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_correct_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wrong_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_timeout_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_decision_ms integer NOT NULL DEFAULT 0,
  
  -- Disagreement & Consensus
  ADD COLUMN IF NOT EXISTS disagreement_score numeric(5, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS consensus_confidence numeric(5, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS suspicion_accuracy numeric(5, 4) NOT NULL DEFAULT 0.0000,
  
  -- Reflection Unlocks & Replay Interest
  ADD COLUMN IF NOT EXISTS total_reflection_unlocks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reflection_unlock_rate numeric(5, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS total_replay_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_interest_score numeric(5, 4) NOT NULL DEFAULT 0.0000,
  
  -- Advanced Curation Metrics
  ADD COLUMN IF NOT EXISTS total_guess_confidence_sum bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_guess_confidence_sq_sum numeric NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS total_answer_change_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_investigation_duration_ms bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reflection_duration_ms bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_reflection_duration_ms integer NOT NULL DEFAULT 0,
  
  -- Dynamic Scores
  ADD COLUMN IF NOT EXISTS confidence_variance_score numeric(5, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS slow_burn_score numeric(5, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS candidate_decay_score numeric(5, 4) NOT NULL DEFAULT 0.0000;

-- 4. Add Style Fingerprints for Entropy Protection
ALTER TABLE public.content_candidates
  ADD COLUMN IF NOT EXISTS composition_fingerprint text,
  ADD COLUMN IF NOT EXISTS emotional_fingerprint text,
  ADD COLUMN IF NOT EXISTS lighting_fingerprint text,
  ADD COLUMN IF NOT EXISTS perspective_fingerprint text,
  ADD COLUMN IF NOT EXISTS scene_fingerprint text,
  ADD COLUMN IF NOT EXISTS object_fingerprint text,
  ADD COLUMN IF NOT EXISTS texture_fingerprint text;

-- 5. Add Performance Index
CREATE INDEX IF NOT EXISTS idx_candidates_disagreement_intelligence 
  ON public.content_candidates (disagreement_score, slow_burn_score, confidence_variance_score, candidate_decay_score, status);
