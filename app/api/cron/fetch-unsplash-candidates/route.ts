import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fetchUnsplashCandidates } from '@/lib/unsplash';
import { scoreUnsplashCandidate } from '@/lib/contentScoring';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  'bizarre nature',
  'strange architecture',
  'surreal landscape',
  'unusual animal',
  'macro insect',
  'abandoned building',
  'optical illusion',
  'weird science',
  'liminal space',
  'deep sea'
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret to prevent unauthorized execution
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let totalAdded = 0;
    const errors: string[] = [];

    const realFetchPerCategory = process.env.REAL_FETCH_PER_CATEGORY
      ? parseInt(process.env.REAL_FETCH_PER_CATEGORY, 10)
      : 4;

    // 2. Iterate through categories and fetch candidates each
    for (const category of CATEGORIES) {
      try {
        const photos = await fetchUnsplashCandidates(category, realFetchPerCategory);
        
        for (const photo of photos) {
          // Score the candidate
          const score = scoreUnsplashCandidate(photo, category);
          
          // Prepare DB record
          const candidateRecord = {
            source: 'unsplash',
            source_photo_id: photo.id,
            image_url: photo.urls.regular,
            image_thumb_url: photo.urls.thumb,
            photographer_name: photo.user.name,
            photographer_url: photo.user.portfolio_url || photo.user.links.html,
            unsplash_url: photo.links.html,
            download_location: photo.links.download_location,
            query: category,
            category: category,
            candidate_score: score.candidateScore,
            suspicious_score: score.suspiciousScore,
            difficulty_suggestion: score.difficultySuggestion,
            suggested_context: score.suggestedContext,
            license_note: 'Unsplash License',
            status: 'review'
          };
          
          // Insert into database (ignoring duplicates via unique constraint / on conflict)
          // Since Supabase JS doesn't have an easy "insert ignore", we'll just insert and catch the error, 
          // or use upsert with onConflict.
          const { error } = await supabaseAdmin
            .from('content_candidates')
            .upsert(candidateRecord, { onConflict: 'source_photo_id', ignoreDuplicates: true });
            
          if (error) {
            console.error(`Error inserting candidate ${photo.id}:`, error);
          } else {
            totalAdded++;
          }
        }
      } catch (err) {
        console.error(`Error fetching category ${category}:`, err);
        errors.push(`Category ${category} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed Unsplash candidates.`,
      added: totalAdded,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Fatal error in cron job:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
