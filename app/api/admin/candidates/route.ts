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

  const statusParam = request.nextUrl.searchParams.get('status') || 'review';
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin
    .from('content_candidates')
    .select('*')
    .eq('status', statusParam)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: reviewCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'review');
    
  const { count: approvedCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');
    
  const { count: rejectedCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  const { count: autoApprovedCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'auto_approved');

  // Metadata calculations
  const { count: usableRealCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .or('source.eq.unsplash,source.eq.real,answer.eq.real')
    .in('status', ['review', 'approved', 'auto_approved'])
    .gte('candidate_score', 40);

  const { count: usableAiCount } = await supabaseAdmin
    .from('content_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'nano_banana')
    .eq('source_type', 'ai_generated')
    .eq('answer', 'ai')
    .eq('safety_status', 'safe')
    .eq('auto_approve_eligible', true)
    .gte('candidate_score', 75)
    .gte('suspicious_score', 70)
    .in('status', ['review', 'approved', 'auto_approved']);

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: scheduledChallenges } = await supabaseAdmin
    .from('challenges')
    .select('set_date, set_order')
    .gte('set_date', todayStr);

  const MAX_SLOTS = process.env.MAX_SCHEDULE_SLOTS ? parseInt(process.env.MAX_SCHEDULE_SLOTS, 10) : 11;
  const AI_MIN_BACKLOG = process.env.AI_MIN_BACKLOG ? parseInt(process.env.AI_MIN_BACKLOG, 10) : 20;

  const daysMap = new Map<string, Set<number>>();
  if (scheduledChallenges) {
    for (const c of scheduledChallenges) {
      if (!daysMap.has(c.set_date)) {
        daysMap.set(c.set_date, new Set());
      }
      daysMap.get(c.set_date)!.add(c.set_order);
    }
  }

  let scheduledDaysCoverage = 0;
  for (const slots of daysMap.values()) {
    if (slots.size >= MAX_SLOTS) {
      scheduledDaysCoverage++;
    }
  }

  const standard_mix_status = (usableRealCount || 0) >= 30 && (usableAiCount || 0) >= AI_MIN_BACKLOG && scheduledDaysCoverage >= 3 ? 'Healthy' : 'Deficit';
  const reflection_coverage_status = (usableAiCount || 0) >= 30 && scheduledDaysCoverage >= 3 ? 'Healthy' : 'Deficit';

  return NextResponse.json({ 
    candidates: data || [], 
    counts: {
      review: reviewCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      auto_approved: autoApprovedCount || 0
    },
    metadata: {
      usable_real_backlog: usableRealCount || 0,
      usable_ai_backlog: usableAiCount || 0,
      scheduled_days_coverage: scheduledDaysCoverage,
      standard_mix_status,
      reflection_coverage_status
    }
  });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      candidateId,
      curator_blessed,
      curator_priority,
      curator_locked,
      anomaly_tier,
      curator_notes,
      status
    } = body;

    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

    if (curator_blessed !== undefined) updatePayload.curator_blessed = curator_blessed;
    if (curator_priority !== undefined) updatePayload.curator_priority = parseInt(curator_priority, 10) || 0;
    if (curator_locked !== undefined) updatePayload.curator_locked = curator_locked;
    if (anomaly_tier !== undefined) {
      const tier = parseInt(anomaly_tier, 10);
      updatePayload.anomaly_tier = Math.max(0, Math.min(3, tier));
    }
    if (curator_notes !== undefined) updatePayload.curator_notes = curator_notes;
    if (status !== undefined) {
      const allowedStatus = ['draft', 'review', 'approved', 'rejected', 'auto_approved', 'deleted'];
      if (allowedStatus.includes(status)) {
        updatePayload.status = status;
      }
    }

    // Include reviewed_at timestamp if approved or rejected
    if (status === 'approved' || status === 'rejected' || status === 'auto_approved') {
      updatePayload.reviewed_at = new Date().toISOString();
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('content_candidates')
      .update(updatePayload)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, candidate: data });
  } catch (err: any) {
    console.error('PATCH candidates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


