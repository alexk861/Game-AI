import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { isCronAuthorized } from '@/lib/adminAuth';
import { generateAiCandidates } from '@/lib/aiCandidateGenerator';

export const maxDuration = 300; // Vercel maximum execution time in seconds (5 minutes)
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!isCronAuthorized(req)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(await generateAiCandidates(getSupabaseAdmin()));

  } catch (err: unknown) {
    console.error('Error in cron job:', err);
    const message = err instanceof Error
      ? err.message
      : (typeof err === 'object' && err !== null && 'message' in err)
        ? String((err as Record<string, unknown>).message)
        : JSON.stringify(err);
    return NextResponse.json({ error: message || 'Internal error' }, { status: 500 });
  }
}
