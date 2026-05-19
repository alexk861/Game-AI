import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { runAutoFill } from '@/lib/autoFillEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized execution
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV !== 'development' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[cron/auto-fill] Scheduled auto-fill started.');

    const supabaseAdmin = getSupabaseAdmin();
    const report = await runAutoFill(supabaseAdmin);

    console.log(
      `[cron/auto-fill] Finished. Triggered: ${report.triggered}, Scheduled: ${report.scheduled_count}, Days: ${report.days_filled}`
    );

    return NextResponse.json({
      success: report.success,
      triggered: report.triggered,
      scheduled_count: report.scheduled_count,
      auto_approved_count: report.auto_approved_count,
      days_filled: report.days_filled,
      errors: report.errors.length > 0 ? report.errors : undefined,
    });
  } catch (err) {
    console.error('[cron/auto-fill] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
