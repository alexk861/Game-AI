import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { generateAiCandidates } from '@/lib/aiCandidateGenerator';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedCount = typeof body.count === 'number'
      ? Math.max(1, Math.min(20, Math.floor(body.count)))
      : undefined;

    const report = await generateAiCandidates(getSupabaseAdmin(), { requestedCount });
    return NextResponse.json(report);
  } catch (err) {
    console.error('[admin/generate-ai-candidates] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
