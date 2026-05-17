import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();

  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('id, guesses_ai, guesses_real, answer, image_url')
      .lte('set_date', new Date().toISOString().split('T')[0]); // Only past & present challenges

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        total_guesses: 0,
        global_failure_rate: 0,
        most_misleading: null
      });
    }

    let totalGuesses = 0;
    let totalFailures = 0;
    let mostMisleading = null;
    let highestFailureRate = -1;

    for (const challenge of challenges) {
      const challengeTotal = challenge.guesses_ai + challenge.guesses_real;
      if (challengeTotal === 0) continue;

      const correctGuesses = challenge.answer === 'ai' ? challenge.guesses_ai : challenge.guesses_real;
      const failures = challengeTotal - correctGuesses;
      const failureRate = failures / challengeTotal;

      totalGuesses += challengeTotal;
      totalFailures += failures;

      if (failureRate > highestFailureRate) {
        highestFailureRate = failureRate;
        mostMisleading = {
          id: challenge.id,
          image_url: challenge.image_url,
          failure_rate: failureRate,
          total_guesses: challengeTotal
        };
      }
    }

    const globalFailureRate = totalGuesses > 0 ? (totalFailures / totalGuesses) : 0;

    return NextResponse.json({
      total_guesses: totalGuesses,
      global_failure_rate: globalFailureRate,
      most_misleading: mostMisleading
    }, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });

  } catch (err) {
    console.error('Leaderboard unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
