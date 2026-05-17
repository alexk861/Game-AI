import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('challenges')
    .select('id, image_url, difficulty, set_order')
    .eq('set_date', today)
    .order('set_order', { ascending: true });

  if (error) {
    console.error('Daily set fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily set' },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'No challenges for today' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { date: today, challenges: data },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    }
  );
}
