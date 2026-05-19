import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { runAutoFill } from '@/lib/autoFillEngine';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[admin/auto-fill] Manual auto-fill triggered by admin.');

    const supabaseAdmin = getSupabaseAdmin();
    const report = await runAutoFill(supabaseAdmin);

    return NextResponse.json(report, { status: report.success ? 200 : 500 });
  } catch (err) {
    console.error('[admin/auto-fill] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
