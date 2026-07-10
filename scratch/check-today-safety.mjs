import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkSafety() {
  const today = '2026-06-01';
  console.log(`Checking daily set for date: ${today}`);

  // 1. Fetch today's challenges
  const { data: challenges, error: challengesError } = await supabase
    .from('challenges')
    .select('*')
    .eq('set_date', today)
    .order('set_order', { ascending: true });

  if (challengesError) {
    console.error("❌ Error fetching challenges:", challengesError);
    return;
  }

  console.log(`\nFound ${challenges.length} challenges for today.`);
  
  // 2. Check each challenge details
  const imageUrls = challenges.map(c => c.image_url);
  console.log("Image URLs:", imageUrls);

  // 3. Inspect table columns by trying to query all columns including parent_real_candidate_id if it exists
  console.log("\nChecking challenges table columns...");
  const { data: colTest, error: colError } = await supabase
    .from('challenges')
    .select('parent_real_candidate_id')
    .limit(1);

  if (colError) {
    console.log("⚠️ Column 'parent_real_candidate_id' DOES NOT exist in 'challenges' table. Error message:", colError.message);
  } else {
    console.log("✅ Column 'parent_real_candidate_id' exists in 'challenges' table.");
  }

  // 4. Verify candidate status for today's image URLs (if any exist in content_candidates)
  if (imageUrls.length > 0) {
    console.log("\nVerifying corresponding content candidates status...");
    const { data: candidates, error: candError } = await supabase
      .from('content_candidates')
      .select('id, image_url, status')
      .in('image_url', imageUrls);

    if (candError) {
      console.error("❌ Error fetching candidates:", candError);
    } else {
      console.log(`Found ${candidates.length} corresponding candidates in 'content_candidates'.`);
      candidates.forEach(cand => {
        console.log(`- Candidate ${cand.id}: Status = ${cand.status}, Image = ${cand.image_url.substring(0, 60)}...`);
        if (cand.status === 'deleted' || cand.status === 'rejected') {
          console.error(`🔴 WARNING: Active daily set challenge contains a deleted/rejected candidate! ID: ${cand.id}`);
        }
      });
    }
  }
}

checkSafety().catch(console.error);
