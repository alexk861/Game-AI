import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function isAuthorized(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  
  const searchSecret = request.nextUrl.searchParams.get('secret');
  if (searchSecret === secret) return true;
  
  return false;
}

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  
  const { error } = await supabaseAdmin
    .from('content_candidates')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Candidate ${id} rejected.` });
}
