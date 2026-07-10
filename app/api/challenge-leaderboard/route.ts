import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const set_date = searchParams.get('set');
    const device_id = searchParams.get('device_id');

    if (!set_date || !/^\d{4}-\d{2}-\d{2}$/.test(set_date)) {
      return NextResponse.json({ error: 'Invalid or missing set date parameter.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Top 20 Leaderboard entries
    const { data: topAttempts, error: fetchErr } = await supabaseAdmin
      .from('daily_set_attempts')
      .select('id, display_name, score, grid, completion_ms, device_id, created_at')
      .eq('set_date', set_date)
      .order('score', { ascending: false })
      .order('completion_ms', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchErr) {
      console.error('[challenge-leaderboard GET Fetch Error]:', fetchErr);
      return NextResponse.json({ error: 'Failed to retrieve standings.' }, { status: 500 });
    }

    const sanitizedTopAttempts = (topAttempts || []).map((attempt, index) => ({
      rank: index + 1,
      display_name: attempt.display_name,
      score: attempt.score,
      grid: attempt.grid,
      completion_ms: attempt.completion_ms,
      is_self: device_id ? attempt.device_id === device_id : false,
      created_at: attempt.created_at
    }));

    // 2. Resolve current player rank if device_id is provided
    let playerAttempt = null;
    let playerRank = null;

    if (device_id) {
      // Check if player is already in Top 20
      const selfInTop = sanitizedTopAttempts.find(attempt => attempt.is_self);
      if (selfInTop) {
        playerRank = selfInTop.rank;
        playerAttempt = selfInTop;
      } else {
        // Query player's personal attempt
        const { data: personalAttempt, error: selfErr } = await supabaseAdmin
          .from('daily_set_attempts')
          .select('display_name, score, grid, completion_ms, created_at')
          .eq('set_date', set_date)
          .eq('device_id', device_id)
          .maybeSingle();

        if (!selfErr && personalAttempt) {
          // Calculate rank based on standard order sorting:
          // count of players with higher score OR (equal score and faster completion) OR (equal score, equal time, earlier creation)
          const { count, error: countErr } = await supabaseAdmin
            .from('daily_set_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('set_date', set_date)
            .or(`score.gt.${personalAttempt.score},and(score.eq.${personalAttempt.score},completion_ms.lt.${personalAttempt.completion_ms}),and(score.eq.${personalAttempt.score},completion_ms.eq.${personalAttempt.completion_ms},created_at.lt.${personalAttempt.created_at})`);

          if (!countErr && count !== null) {
            playerRank = count + 1;
            playerAttempt = {
              rank: playerRank,
              display_name: personalAttempt.display_name,
              score: personalAttempt.score,
              grid: personalAttempt.grid,
              completion_ms: personalAttempt.completion_ms,
              is_self: true,
              created_at: personalAttempt.created_at
            };
          }
        }
      }
    }

    return NextResponse.json({
      leaderboard: sanitizedTopAttempts,
      playerAttempt,
      playerRank
    });

  } catch (err) {
    console.error('[challenge-leaderboard GET API Error]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
