import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { FALLBACK_CHALLENGES, getDynamicFallbackChallenges } from '@/lib/fallbackChallenges';

export const dynamic = 'force-dynamic';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateString: string): boolean {
  if (!dateRegex.test(dateString)) return false;
  
  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) return false;
  
  const dateParts = dateString.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
  const day = parseInt(dateParts[2], 10);
  
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const setParam = searchParams.get('set');

  if (setParam && !isValidDate(setParam)) {
    return NextResponse.json(
      { error: 'Invalid date parameter' },
      { status: 400 }
    );
  }

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
      .select('id, image_url, difficulty, set_order, answer, photographer_name')
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

  let data: any[] = dbData || [];
  let usingFallback = false;

  if (!data || data.length < expectedCount) {
    console.warn(`[daily-set] Incomplete DB challenge set for date ${targetDate} (expected ${expectedCount}, got ${data?.length || 0}). Fallback triggered.`);
    data = getDynamicFallbackChallenges(levelIndex, targetDate);
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

  // Hard Check 3: Label Integrity Guardrail (Real must not be AI URL, AI must not be Unsplash URL)
  data.forEach((c: any) => {
    const isUnsplash = c.image_url && (c.image_url.includes('images.unsplash.com') || c.image_url.includes('unsplash.com'));
    const isAiUrl = c.image_url && (c.image_url.includes('/ai-generated/') || c.image_url.includes('/challenge-images/ai-generated/'));
    
    if (c.answer === 'ai' && isUnsplash) {
      validationErrors.push(`Challenge ${c.id} is labeled as AI but uses Unsplash URL: ${c.image_url}`);
    }
    if (c.answer === 'real' && isAiUrl) {
      validationErrors.push(`Challenge ${c.id} is labeled as Real but uses AI URL: ${c.image_url}`);
    }
  });

  // If hard validation fails, and we are not already using fallback, try falling back
  if (validationErrors.length > 0 && !usingFallback) {
    console.error(`\n================ DAILY SET HARD VALIDATION FAILED ================`);
    validationErrors.forEach(err => console.error(`  - ${err}`));
    console.error(`==================================================================\n`);
    
    console.warn(`[daily-set] Emergency fallback triggered due to validation failure.`);
    data = getDynamicFallbackChallenges(levelIndex, targetDate);
    usingFallback = true;
    
    // Clear validation errors for fallback set availability
    validationErrors.length = 0;
  }

  if (validationErrors.length > 0) {
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
  sanitizedChallenges.sort((a, b) => a.difficulty - b.difficulty);

  return NextResponse.json(
    { 
      date: targetDate, 
      challenges: sanitizedChallenges,
      isFallbackSet: usingFallback
    },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    }
  );
}
