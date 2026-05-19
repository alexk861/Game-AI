-- Add columns to content_candidates table for AI generated images
ALTER TABLE public.content_candidates 
ADD COLUMN IF NOT EXISTS parent_real_candidate_id UUID REFERENCES public.content_candidates(id),
ADD COLUMN IF NOT EXISTS generation_seed TEXT,
ADD COLUMN IF NOT EXISTS generation_model TEXT,
ADD COLUMN IF NOT EXISTS generation_version TEXT;

-- Create ai_generation_runs table to track success/failures
CREATE TABLE IF NOT EXISTS public.ai_generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    parent_real_candidate_id UUID REFERENCES public.content_candidates(id),
    category TEXT NOT NULL,
    prompt_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is configured if needed (optional since we connect via service role for background tasks, but good practice)
ALTER TABLE public.ai_generation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for service role" ON public.ai_generation_runs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
