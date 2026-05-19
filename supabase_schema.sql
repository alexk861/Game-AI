-- Create `challenges` table
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    answer TEXT NOT NULL CHECK (answer IN ('ai', 'real')),
    guesses_ai INTEGER NOT NULL DEFAULT 0,
    guesses_real INTEGER NOT NULL DEFAULT 0,
    set_date DATE NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 1,
    set_order INTEGER NOT NULL DEFAULT 1,
    context_short TEXT,
    ai_prompt TEXT,
    source_credit TEXT,
    photographer_name TEXT,
    photographer_url TEXT,
    unsplash_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create `content_candidates` table
CREATE TABLE public.content_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT,
    source_photo_id TEXT UNIQUE,
    image_url TEXT NOT NULL,
    image_thumb_url TEXT,
    photographer_name TEXT,
    photographer_url TEXT,
    unsplash_url TEXT,
    download_location TEXT,
    query TEXT,
    category TEXT,
    candidate_score NUMERIC,
    suspicious_score NUMERIC,
    difficulty_suggestion INTEGER,
    suggested_context TEXT,
    license_note TEXT,
    status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Create `submit_guess` RPC function
CREATE OR REPLACE FUNCTION public.submit_guess(challenge_uuid UUID, guess_type TEXT)
RETURNS TABLE (
    answer TEXT,
    context_short TEXT,
    ai_prompt TEXT,
    source_credit TEXT,
    photographer_name TEXT,
    photographer_url TEXT,
    unsplash_url TEXT,
    guesses_ai INTEGER,
    guesses_real INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment the appropriate guess count
    IF guess_type = 'ai' THEN
        UPDATE public.challenges
        SET guesses_ai = guesses_ai + 1
        WHERE id = challenge_uuid;
    ELSIF guess_type = 'real' THEN
        UPDATE public.challenges
        SET guesses_real = guesses_real + 1
        WHERE id = challenge_uuid;
    END IF;

    -- Return the updated challenge data
    RETURN QUERY
    SELECT 
        c.answer,
        c.context_short,
        c.ai_prompt,
        c.source_credit,
        c.photographer_name,
        c.photographer_url,
        c.unsplash_url,
        c.guesses_ai,
        c.guesses_real
    FROM public.challenges c
    WHERE c.id = challenge_uuid;
END;
$$;
