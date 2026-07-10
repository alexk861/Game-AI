import { getSupabaseAdmin } from '../lib/supabase-server.js';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
envData.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
});

async function cleanup() {
  const supabase = getSupabaseAdmin();
  console.log('Starting cleanup of scheduled candidates...');

  // 1. Fetch all scheduled URLs
  const { data: challenges, error: err1 } = await supabase
    .from('challenges')
    .select('image_url')
    .not('image_url', 'is', null);

  if (err1) {
    console.error('Failed to query challenges:', err1.message);
    return;
  }

  const scheduledUrls = Array.from(new Set(challenges.map(c => c.image_url)));
  console.log(`Found ${scheduledUrls.length} scheduled challenge URLs.`);

  // 2. Fetch candidates matching these URLs that are still in 'review' or 'approved'
  let updatedCount = 0;
  const chunkSize = 50;

  for (let i = 0; i < scheduledUrls.length; i += chunkSize) {
    const chunk = scheduledUrls.slice(i, i + chunkSize);
    const { data: matches, error: err2 } = await supabase
      .from('content_candidates')
      .select('id, status')
      .in('image_url', chunk)
      .in('status', ['review', 'approved']);

    if (err2) {
      console.error('Failed to query matches:', err2.message);
      continue;
    }

    if (matches && matches.length > 0) {
      const idsToUpdate = matches.map(m => m.id);
      const { error: err3 } = await supabase
        .from('content_candidates')
        .update({ status: 'auto_approved', reviewed_at: new Date().toISOString() })
        .in('id', idsToUpdate);

      if (err3) {
        console.error('Failed to update candidates:', err3.message);
      } else {
        updatedCount += idsToUpdate.length;
        console.log(`Updated ${idsToUpdate.length} candidates in chunk.`);
      }
    }
  }

  console.log(`\nCleanup complete. Updated status of ${updatedCount} scheduled candidates to 'auto_approved'.`);
}

cleanup().catch(console.error);
