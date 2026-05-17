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

    const { data, error } = await supabaseAdmin.rpc('submit_guess', {
      challenge_uuid: challengeId,
      guess_type: guess,
    });

    if (error) {
      console.error('Guess submission error:', error);
      return NextResponse.json(
        { error: 'Failed to submit guess' },
        { status: 500 }
      );
    }

    const result = data as {
      answer: string;
      context_short: string;
      ai_prompt: string | null;
      source_credit: string | null;
      guesses_ai: number;
      guesses_real: number;
    };

    return NextResponse.json({
      correct: result.answer === guess,
      answer: result.answer,
      context_short: result.context_short,
      ai_prompt: result.ai_prompt,
      source_credit: result.source_credit,
      guesses_ai: result.guesses_ai,
      guesses_real: result.guesses_real,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
