import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { isCronAuthorized } from '@/lib/adminAuth';
import { generateAiCandidates } from '@/lib/aiCandidateGenerator';

export const maxDuration = 300; // Vercel maximum execution time in seconds (5 minutes)

export async function GET(req: Request) {
  try {
    if (!isCronAuthorized(req)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(await generateAiCandidates(getSupabaseAdmin()));

  } catch (err: unknown) {
    console.error('Error in cron job:', err);
    return NextResponse.json({ error: (err as Error).message || 'Internal error' }, { status: 500 });
  }
}
