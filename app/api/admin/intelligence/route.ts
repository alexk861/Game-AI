import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  
  const searchSecret = request.nextUrl.searchParams.get('secret');
  if (searchSecret === secret) return true;
  
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Top Archive (Peak Ambiguity & High Slow Burn)
    const { data: topArchive, error: topError } = await supabaseAdmin
      .from('content_candidates')
      .select('*')
      .or('disagreement_score.gt.0.50,slow_burn_score.gt.0.35,curator_blessed.eq.true')
      .in('status', ['approved', 'auto_approved'])
      .order('slow_burn_score', { ascending: false })
      .order('disagreement_score', { ascending: false })
      .limit(50);

    if (topError) {
      console.error('Error fetching top archive:', topError);
    }

    // 2. Fetch Weak Content (Predictable / Obvious AI & Real / High Decay)
    const { data: weakContent, error: weakError } = await supabaseAdmin
      .from('content_candidates')
      .select('*')
      .gte('total_served_count', 5)
      .or('consensus_confidence.gte.0.85,consensus_confidence.lte.0.15,candidate_decay_score.gt.0.60')
      .in('status', ['approved', 'auto_approved'])
      .order('candidate_decay_score', { ascending: false })
      .limit(50);

    if (weakError) {
      console.error('Error fetching weak content:', weakError);
    }

    // 3. Fetch Rare Archive (Protected / Locked Records & Anomalies)
    const { data: rareArchive, error: rareError } = await supabaseAdmin
      .from('content_candidates')
      .select('*')
      .or('anomaly_tier.gt.0,curator_locked.eq.true')
      .in('status', ['approved', 'auto_approved', 'review'])
      .order('anomaly_tier', { ascending: false })
      .order('curator_priority', { ascending: false })
      .limit(50);

    if (rareError) {
      console.error('Error fetching rare archive:', rareError);
    }

    // 4. Fetch general Pipeline Health metrics
    const { count: totalAiBacklog } = await supabaseAdmin
      .from('content_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'ai_generated')
      .in('status', ['review', 'approved', 'auto_approved']);

    const { count: totalRealBacklog } = await supabaseAdmin
      .from('content_candidates')
      .select('*', { count: 'exact', head: true })
      .or('source.eq.unsplash,source.eq.real,answer.eq.real')
      .in('status', ['review', 'approved', 'auto_approved']);

    const { count: retiredCount } = await supabaseAdmin
      .from('content_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deleted');

    return NextResponse.json({
      top_archive: topArchive || [],
      weak_content: weakContent || [],
      rare_archive: rareArchive || [],
      pipeline_health: {
        total_ai_backlog: totalAiBacklog || 0,
        total_real_backlog: totalRealBacklog || 0,
        total_retired: retiredCount || 0,
      }
    });

  } catch (err: any) {
    console.error('[intelligence-api] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
