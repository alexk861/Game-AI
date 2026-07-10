import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const blockedWords = ['shit', 'fuck', 'cunt', 'asshole', 'bitch', 'bastard', 'nigger', 'kike', 'faggot'];

function containsProfanity(name: string): boolean {
  const lowerName = name.toLowerCase();
  return blockedWords.some(word => lowerName.includes(word));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { set_date, device_id, display_name, guesses, completion_ms } = body;

    // 1. Structural Validation
    if (!set_date || !device_id || !Array.isArray(guesses) || guesses.length !== 5 || typeof completion_ms !== 'number') {
      return NextResponse.json({ error: 'Invalid challenge attempt parameters.' }, { status: 400 });
    }

    // 2. Anti-Cheat Velocity Check (Speed Limit)
    if (completion_ms < 2000) {
      return NextResponse.json({ error: 'Suspicious completion velocity detected.' }, { status: 400 });
    }

    // 3. Date format validation (strict calendar date checks)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(set_date)) {
      return NextResponse.json({ error: 'Invalid date format YYYY-MM-DD.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 4. Fetch the target daily set answers to prevent client-side answer spoofing
    const { data: challenges, error: fetchErr } = await supabaseAdmin
      .from('challenges')
      .select('id, answer, set_order')
      .eq('set_date', set_date)
      .order('set_order', { ascending: true });

    if (fetchErr || !challenges || challenges.length !== 5) {
      return NextResponse.json({ error: 'Requested daily challenge set is incomplete or unavailable.' }, { status: 404 });
    }

    // 5. Evaluate the player's choices server-side
    let score = 0;
    const gridSymbols: string[] = [];

    for (const challenge of challenges) {
      const userGuess = guesses.find(g => g.challengeId === challenge.id || g.challenge_id === challenge.id);
      if (!userGuess || userGuess.guess === 'timeout' || userGuess.is_timeout) {
        gridSymbols.push('⬚');
      } else {
        const isCorrect = userGuess.guess === challenge.answer;
        if (isCorrect) {
          score++;
          gridSymbols.push('▣');
        } else {
          gridSymbols.push('☒');
        }
      }
    }

    const grid = gridSymbols.join(' ');
    let sanitizedName = (display_name || '').replace(/<[^>]*>/g, '').trim().slice(0, 20);
    
    if (!sanitizedName || containsProfanity(sanitizedName)) {
      sanitizedName = `Player ${device_id.slice(-4)}`;
    }

    // 6. Execute atomic check-and-upsert using the RPC
    const { data: rpcResult, error: upsertErr } = await supabaseAdmin.rpc('upsert_leaderboard_attempt', {
      p_set_date: set_date,
      p_device_id: device_id,
      p_display_name: sanitizedName,
      p_score: score,
      p_grid: grid,
      p_completion_ms: completion_ms
    });

    if (upsertErr || !rpcResult) {
      console.error('Upsert RPC Failed:', upsertErr);
      return NextResponse.json({ error: 'Failed to record standings.' }, { status: 500 });
    }

    if (rpcResult.status === 'blocked') {
      return NextResponse.json({ error: 'Attempt upload limit reached (5 daily attempts max).' }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      score,
      grid,
      status: rpcResult.status,
      display_name: sanitizedName
    });

  } catch (err) {
    console.error('[challenge-attempt API Error]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
