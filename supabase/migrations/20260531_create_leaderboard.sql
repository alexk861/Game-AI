-- ============================================
-- UNCANNY Growth Loop Sprint — Supabase Migration
-- Idempotent schema migration for daily_set_attempts
-- ============================================

-- 1. CreateAttempts Table
CREATE TABLE IF NOT EXISTS daily_set_attempts (
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
ALTER TABLE daily_set_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Create high-performance compound indexes for quick rankings and lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings 
ON daily_set_attempts (set_date, score DESC, completion_ms ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_device_lookup
ON daily_set_attempts (set_date, device_id);

-- 3. Atomic Transaction Database RPC for safe Upserts
CREATE OR REPLACE FUNCTION upsert_leaderboard_attempt(
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
    SELECT 1 FROM daily_set_attempts 
    WHERE set_date = p_set_date AND device_id = p_device_id
  ) INTO v_exists;

  IF v_exists THEN
    SELECT submission_count FROM daily_set_attempts 
    WHERE set_date = p_set_date AND device_id = p_device_id
    INTO v_submission_count;

    -- Block if user has reached the submission cap (5 writes)
    IF v_submission_count >= 5 THEN
      RETURN jsonb_build_object('status', 'blocked');
    END IF;

    -- Update only if the new score is higher, or equal score with a faster completion time
    UPDATE daily_set_attempts SET
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
    INSERT INTO daily_set_attempts (
      set_date, device_id, display_name, score, grid, completion_ms, submission_count
    ) VALUES (
      p_set_date, p_device_id, p_display_name, p_score, p_grid, p_completion_ms, 1
    );
    
    RETURN jsonb_build_object('status', 'inserted');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
