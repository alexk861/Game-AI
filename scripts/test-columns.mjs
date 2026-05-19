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

async function testColumns() {
  const columns = [
    'id', 'set_date', 'set_order', 'image_url', 'answer', 'difficulty',
    'context_short', 'ai_prompt', 'source_credit', 'guesses_ai', 'guesses_real',
    'created_at', 'source_type', 'photographer_name', 'photographer_url',
    'unsplash_url', 'download_location'
  ];

  console.log("Testing columns in 'challenges' table:");
  for (const col of columns) {
    const { error } = await supabase.from('challenges').select(col).limit(1);
    if (error) {
      console.log(`  - ${col}: FAILED (${error.message})`);
    } else {
      console.log(`  - ${col}: OK`);
    }
  }

  console.log("\nTesting columns in 'content_candidates' table:");
  const candCols = [
    'id', 'source', 'source_photo_id', 'image_url', 'image_thumb_url',
    'photographer_name', 'photographer_url', 'unsplash_url', 'download_location',
    'query', 'category', 'candidate_score', 'suspicious_score', 'difficulty_suggestion',
    'suggested_context', 'license_note', 'status', 'answer', 'source_type',
    'prompt_used', 'safety_status', 'safety_flags', 'auto_approve_eligible', 'rejection_reason'
  ];
  for (const col of candCols) {
    const { error } = await supabase.from('content_candidates').select(col).limit(1);
    if (error) {
      console.log(`  - ${col}: FAILED (${error.message})`);
    } else {
      console.log(`  - ${col}: OK`);
    }
  }
}

testColumns().catch(console.error);
