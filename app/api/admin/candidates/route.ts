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

  return NextResponse.json({ 
    candidates: data || [], 
    counts: {
      review: reviewCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      auto_approved: autoApprovedCount || 0
    }
  });
}
