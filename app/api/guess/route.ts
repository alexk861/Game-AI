import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { FALLBACK_CHALLENGES } from '@/lib/fallbackChallenges';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, guess } = body;

    if (!challengeId || !guess || !['ai', 'real'].includes(guess)) {
      return NextResponse.json(
        { error: 'Invalid request. Need challengeId and guess (ai|real).' },
        { status: 400 }
      );
    }

    // ── Fallback Challenge Matching Layer ──
    let challenge = null;
    let isFallback = false;

    // Find challenge in fallback structures
    for (const levelData of Object.values(FALLBACK_CHALLENGES)) {
      const match = levelData.find(c => c.id === challengeId);
      if (match) {
        challenge = match;
        isFallback = true;
        break;
      }
    }

    let updatedGuessesAi = 0;
    let updatedGuessesReal = 0;

    if (isFallback && challenge) {
      updatedGuessesAi = guess === 'ai' ? 1 : 0;
      updatedGuessesReal = guess === 'real' ? 1 : 0;
    } else {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: dbChallenge, error: fetchError } = await supabaseAdmin
        .from('challenges')
        .select('answer, context_short, ai_prompt, source_credit, photographer_name, photographer_url, unsplash_url, guesses_ai, guesses_real')
        .eq('id', challengeId)
        .single();

      if (fetchError || !dbChallenge) {
        console.error('Error fetching challenge for guess:', fetchError);
        return NextResponse.json(
          { error: 'Challenge not found' },
          { status: 404 }
        );
      }

      challenge = dbChallenge;

      const incrementField = guess === 'ai' ? 'guesses_ai' : 'guesses_real';
      const updatedCount = (challenge[incrementField] || 0) + 1;

      const { error: updateError } = await supabaseAdmin
        .from('challenges')
        .update({ [incrementField]: updatedCount })
        .eq('id', challengeId);

      if (updateError) {
        console.error('Error updating guess counter:', updateError);
      }

      updatedGuessesAi = guess === 'ai' ? updatedCount : (challenge.guesses_ai || 0);
      updatedGuessesReal = guess === 'real' ? updatedCount : (challenge.guesses_real || 0);
    }

    return NextResponse.json({
      correct: challenge.answer === guess,
      answer: challenge.answer,
      context_short: challenge.context_short,
      ai_prompt: challenge.ai_prompt,
      source_credit: challenge.source_credit,
      photographer_name: challenge.photographer_name,
      photographer_url: challenge.photographer_url,
      unsplash_url: challenge.unsplash_url,
      guesses_ai: updatedGuessesAi,
      guesses_real: updatedGuessesReal,
    });
  } catch (error) {
    console.error('[guess-api] Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
