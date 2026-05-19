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

async function checkRejectionReasonColumn(supabase: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_candidates')
      .select('rejection_reason')
      .limit(1);

    if (error) {
      if (
        error.code === 'PGRST100' || 
        (error.message && error.message.includes('rejection_reason')) ||
        (error.message && error.message.includes('column'))
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function DELETE(
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
  const hasRejectionReason = await checkRejectionReasonColumn(supabaseAdmin);
  
  const updatePayload: Record<string, any> = {
    status: 'deleted',
    reviewed_at: new Date().toISOString()
  };

  if (hasRejectionReason) {
    updatePayload.rejection_reason = 'manual_delete';
  } else {
    console.warn(`[admin/candidates] rejection_reason column is missing from DB. Skipping setting this field.`);
  }

  const { error } = await supabaseAdmin
    .from('content_candidates')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Candidate ${id} deleted.` });
}
