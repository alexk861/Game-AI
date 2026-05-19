import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('challenges')
    .select('id, image_url, difficulty, set_order, answer')
    .eq('set_date', today)
    .lte('set_order', 5)
    .order('set_order', { ascending: true });

  if (error) {
    console.error('Daily set fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily set' },
      { status: 500 }
    );
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

  // Hard Check 1: Exactly 5 public cards exist
  if (data.length !== 5) {
    validationErrors.push(`Expected exactly 5 challenges, but found ${data.length}`);
  }

  // Hard Check 2: set_order 1-5 all present without gaps
  const sortedByOrder = [...data].sort((a, b) => a.set_order - b.set_order);
  const orders = sortedByOrder.map(c => c.set_order);
  const expectedOrders = [1, 2, 3, 4, 5];
  const hasAllOrders = expectedOrders.every((val, index) => orders[index] === val);
  if (!hasAllOrders) {
    validationErrors.push(`Expected set_order values to be exactly 1, 2, 3, 4, 5, but got [${orders.join(', ')}]`);
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

  // Hard Check 6: No deleted/rejected candidates
  if (imageUrls.length > 0) {
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

  // Soft Check 1: At least 2 real and 2 AI
  const realCount = data.filter(c => c.answer === 'real').length;
  const aiCount = data.filter(c => c.answer === 'ai').length;
  if (realCount < 2 || aiCount < 2) {
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
    const { answer, ...rest } = c;
    return rest;
  });

  // Re-sort by difficulty ascending for dramatic pacing:
  // Easy(1) → Medium(2) → Surprising(3) → Hard(4) → Extreme(5)
  // The user should gradually lose certainty across the session.
  sanitizedChallenges.sort((a, b) => a.difficulty - b.difficulty);

  return NextResponse.json(
    { date: today, challenges: sanitizedChallenges },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    }
  );
}
