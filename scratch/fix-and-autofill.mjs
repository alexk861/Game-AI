import { getSupabaseAdmin } from '../lib/supabase-server.js';
import { runAutoFill } from '../lib/autoFillEngine.js';
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

async function fixAndAutoFill() {
  const supabase = getSupabaseAdmin();
  const datesToClear = ['2026-06-01', '2026-06-02', '2026-06-03'];
  
  console.log(`\n================ Fixing Database Challenge Sets ================`);
  console.log(`Target Dates to clear and reschedule:`, datesToClear);

  // 1. Delete rows for target dates
  console.log(`Deleting existing challenges for target dates...`);
  const { data: deleted, error: delErr } = await supabase
    .from('challenges')
    .delete()
    .in('set_date', datesToClear)
    .select();

  if (delErr) {
    console.error("❌ Delete error:", delErr.message);
    return;
  }
  
  console.log(`Successfully cleared ${deleted?.length || 0} old/mislabeled challenge rows.`);

  // 2. Trigger runAutoFill orchestrator
  console.log(`\nTriggering runAutoFill scheduler...`);
  const report = await runAutoFill(supabase);
  
  console.log('\n================ AUTO-FILL REPORT ================');
  console.log(JSON.stringify(report, null, 2));

  // 3. Verify newly scheduled challenges for today
  console.log(`\n================ Verifying New Challenges for 2026-06-01 ================`);
  const { data: newChallenges, error: queryErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('set_date', '2026-06-01')
    .order('set_order', { ascending: true });

  if (queryErr) {
    console.error("❌ Verification fetch error:", queryErr.message);
    return;
  }

  console.log(`Found ${newChallenges.length} new challenges for today:`);
  newChallenges.forEach(c => {
    console.log(`Slot ${c.set_order}:
      - ID: ${c.id}
      - Answer: ${c.answer}
      - Source Credit: ${c.source_credit}
      - Image URL: ${c.image_url}`);
    
    // Safety check: is it an Unsplash URL labeled as AI?
    const isUnsplash = c.image_url.includes('images.unsplash.com');
    if (isUnsplash && c.answer === 'ai') {
      console.error(`🔴 CRITICAL ERROR: Found Unsplash image marked as AI!`);
    } else {
      console.log(`✅ Labeled Correctly.`);
    }
  });
}

fixAndAutoFill().catch(console.error);
