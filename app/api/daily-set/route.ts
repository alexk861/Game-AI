import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { FALLBACK_CHALLENGES } from '@/lib/fallbackChallenges';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const setParam = searchParams.get('set');

  const isReflection1 = mode === 'reflection' || mode === 'reflection-1';
  const isReflection2 = mode === 'reflection-2';
  const isReflection3 = mode === 'reflection-3';
  const isReflection = isReflection1 || isReflection2 || isReflection3;

  let expectedOrders: number[] = [1, 2, 3, 4, 5];
  let expectedCount = 5;
  let levelIndex = 0;

  if (isReflection1) {
    expectedOrders = [6, 7, 8];
    expectedCount = 3;
    levelIndex = 1;
  } else if (isReflection2) {
    expectedOrders = [9, 10];
    expectedCount = 2;
    levelIndex = 2;
  } else if (isReflection3) {
    expectedOrders = [11];
    expectedCount = 1;
    levelIndex = 3;
  }

  const targetDate = setParam || new Date().toISOString().split('T')[0];
  const supabase = getSupabase();
  const isOffline = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let dbData = null;
  let error = null;

  if (!isOffline) {
    let query = supabase
      .from('challenges')
      .select('id, image_url, difficulty, set_order, answer')
      .eq('set_date', targetDate);

    if (isReflection) {
      query = query.in('set_order', expectedOrders);
    } else {
      query = query.lte('set_order', 5);
    }

    const { data, error: err } = await query.order('set_order', { ascending: true });
    dbData = data;
    error = err;

    if (error) {
      console.error('Daily set fetch error from database:', error);
    }
  } else {
    console.warn('[daily-set] Supabase client is offline. Falling back directly to local challenges.');
  }

  // Graceful fallback to pre-defined static challenges if DB has insufficient rows or errors
  let data = dbData || [];
  let usingFallback = false;

  if (!data || data.length < expectedCount) {
    console.warn(`[daily-set] Warning: Database returned ${data?.length ?? 0} challenges for mode ${mode || 'primary'}. Falling back to pre-defined challenges.`);
    data = FALLBACK_CHALLENGES[levelIndex] || [];
    usingFallback = true;
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'No challenges for today' },
      { status: 404 }
    );
  }

  // ── Hard and Soft Validation ──
  const validationErrors: string[] = [];
  const softWarnings: string[] = [];

  // Hard Check 1: Count check
  if (data.length !== expectedCount) {
    validationErrors.push(`Expected exactly ${expectedCount} challenges, but found ${data.length}`);
  }

  // Hard Check 2: set_order values checking without gaps
  const sortedByOrder = [...data].sort((a, b) => a.set_order - b.set_order);
  const orders = sortedByOrder.map(c => c.set_order);
  const hasAllOrders = expectedOrders.every((val, index) => orders[index] === val);
  if (!hasAllOrders) {
    validationErrors.push(`Expected set_order values to be exactly [${expectedOrders.join(', ')}], but got [${orders.join(', ')}]`);
  }

  // Hard Check 3: No duplicate challenge IDs
  const challengeIds = data.map(c => c.id).filter(Boolean);
  const uniqueIds = new Set(challengeIds);
  if (uniqueIds.size !== challengeIds.length) {
    validationErrors.push(`Duplicate challenge IDs detected in scheduled challenges: count = ${challengeIds.length}, unique = ${uniqueIds.size}`);
  }

  // Hard Check 4: No duplicate image_url
  const imageUrls = data.map(c => c.image_url).filter(Boolean);
  const uniqueUrls = new Set(imageUrls);
  if (uniqueUrls.size !== imageUrls.length) {
    validationErrors.push(`Duplicate image_url detected in scheduled challenges: count = ${imageUrls.length}, unique = ${uniqueUrls.size}`);
  }

  // Hard Check 5: image_url exists for all cards
  const hasMissingImageUrl = data.some(c => !c.image_url);
  if (hasMissingImageUrl) {
    validationErrors.push(`One or more challenges are missing their image_url value.`);
  }

  // Hard Check 6: No deleted/rejected candidates (only when database queries succeed and we're not using fallback)
  if (!usingFallback && imageUrls.length > 0 && !isOffline) {
    const { data: candidates, error: candError } = await supabase
      .from('content_candidates')
      .select('image_url, status')
      .in('image_url', imageUrls);

    if (candError) {
      console.error('[daily-set] Warning: Failed to query candidates for safety validation:', candError);
    } else if (candidates) {
      const invalidCandidates = candidates.filter(c => c.status === 'deleted' || c.status === 'rejected');
      if (invalidCandidates.length > 0) {
        validationErrors.push(`Scheduled challenges contain candidates with deleted or rejected status: ${invalidCandidates.map(c => c.image_url).join(', ')}`);
      }
    }
  }

  // Soft Check 1: At least 2 real and 2 AI (only for primary set)
  const realCount = data.filter(c => c.answer === 'real').length;
  const aiCount = data.filter(c => c.answer === 'ai').length;
  if (!isReflection && (realCount < 2 || aiCount < 2)) {
    softWarnings.push(`Expected at least 2 real and 2 AI challenges, but found: ${realCount} real, ${aiCount} AI`);
  }

  // Soft Check 2: Ideal difficulty progression
  const difficultySequence = sortedByOrder.map(c => c.difficulty);
  let isIdealProgression = true;
  for (let i = 1; i < difficultySequence.length; i++) {
    if (difficultySequence[i] < difficultySequence[i - 1]) {
      isIdealProgression = false;
      break;
    }
  }
  if (!isIdealProgression) {
    softWarnings.push(`Difficulty sequence [${difficultySequence.join(', ')}] is not in ascending order`);
  }

  // ── Logging ──
  console.log(`[daily-set validation] Validation summary:
    - real_count: ${realCount}
    - ai_count: ${aiCount}
    - difficulty_sequence: [${difficultySequence.join(', ')}]
    - soft_warnings: ${softWarnings.length > 0 ? JSON.stringify(softWarnings) : 'None'}
  `);

  if (softWarnings.length > 0) {
    console.warn(`[daily-set validation] Soft requirements warnings:\n${softWarnings.map(w => `  - ${w}`).join('\n')}`);
  }

  // If hard validation fails, refuse to serve the daily set
  if (validationErrors.length > 0) {
    console.error(`\n================ DAILY SET HARD VALIDATION FAILED ================`);
    validationErrors.forEach(err => console.error(`  - ${err}`));
    console.error(`==================================================================\n`);
    
    return NextResponse.json(
      { 
        error: 'Failed validation: incomplete or invalid daily challenge set',
        reasons: validationErrors 
      },
      { status: 500 }
    );
  }

  // ── Sanitization ──
  // Strip out answer before sending to the client to prevent cheating
  const sanitizedChallenges = data.map(c => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { answer, ...rest } = c;
    return rest;
  });

  // Re-sort by difficulty ascending for dramatic pacing:
  // Easy(1) → Medium(2) → Surprising(3) → Hard(4) → Extreme(5)
  // The user should gradually lose certainty across the session.
  sanitizedChallenges.sort((a, b) => a.difficulty - b.difficulty);

  return NextResponse.json(
    { 
      date: targetDate, 
      challenges: sanitizedChallenges
    },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    }
  );
}
