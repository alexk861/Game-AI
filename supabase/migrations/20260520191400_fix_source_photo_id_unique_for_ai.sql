-- Migration: Fix source_photo_id unique constraint for AI-generated candidates
-- The old unique index blocks multiple AI candidates because they all have NULL source_photo_id.
-- Replace with a partial unique index that only enforces uniqueness on non-null values.

DROP INDEX IF EXISTS idx_content_candidates_source_photo_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_candidates_source_photo_id
  ON content_candidates(source_photo_id)
  WHERE source_photo_id IS NOT NULL;
