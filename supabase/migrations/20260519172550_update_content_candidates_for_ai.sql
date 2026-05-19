ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS prompt_used text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS negative_prompt_used text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS intended_ai_tells text[];
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS parent_real_candidate_id uuid;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS matched_real_category text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS safety_status text default 'pending';
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS safety_flags text[];
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS auto_approve_eligible boolean default false;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS generation_seed text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS generation_model text;
ALTER TABLE content_candidates ADD COLUMN IF NOT EXISTS generation_version text;

ALTER TABLE content_candidates DROP CONSTRAINT IF EXISTS content_candidates_status_check;
ALTER TABLE content_candidates
  ADD CONSTRAINT content_candidates_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'auto_approved', 'deleted'));

ALTER TABLE content_candidates DROP CONSTRAINT IF EXISTS content_candidates_parent_real_candidate_id_fkey;
ALTER TABLE content_candidates
  ADD CONSTRAINT content_candidates_parent_real_candidate_id_fkey
  FOREIGN KEY (parent_real_candidate_id) REFERENCES content_candidates(id);

CREATE INDEX IF NOT EXISTS idx_content_candidates_ai_eligible
  ON content_candidates (status, source, source_type, answer, safety_status, auto_approve_eligible);

CREATE TABLE IF NOT EXISTS ai_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error_message text,
  parent_real_candidate_id uuid REFERENCES content_candidates(id),
  category text NOT NULL,
  prompt_used text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_generation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for service role" ON ai_generation_runs;
CREATE POLICY "Allow all operations for service role" ON ai_generation_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
