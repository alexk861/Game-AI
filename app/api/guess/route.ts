import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

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

    const supabaseAdmin = getSupabaseAdmin();

    const { data: challenge, error: fetchError } = await supabaseAdmin
      .from('challenges')
      .select('answer, context_short, ai_prompt, source_credit, photographer_name, photographer_url, unsplash_url, guesses_ai, guesses_real')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      console.error('Error fetching challenge for guess:', fetchError);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const incrementField = guess === 'ai' ? 'guesses_ai' : 'guesses_real';
    const updatedCount = (challenge[incrementField] || 0) + 1;

    const { error: updateError } = await supabaseAdmin
      .from('challenges')
      .update({ [incrementField]: updatedCount })
      .eq('id', challengeId);

    if (updateError) {
      console.error('Error updating guess counter:', updateError);
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
      guesses_ai: guess === 'ai' ? updatedCount : (challenge.guesses_ai || 0),
      guesses_real: guess === 'real' ? updatedCount : (challenge.guesses_real || 0),
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
