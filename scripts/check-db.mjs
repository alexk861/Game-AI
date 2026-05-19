import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
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

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkDb() {
  console.log("Connecting to Supabase at:", url);

  // 1. Check challenges
  const { data: challenges, error: chalError, count: chalCount } = await supabase
    .from('challenges')
    .select('*', { count: 'exact' });

  if (chalError) {
    console.error("Error fetching challenges:", chalError);
  } else {
    console.log(`\n--- Challenges Table (Total: ${chalCount}) ---`);
    console.log(JSON.stringify(challenges.slice(0, 10), null, 2));
  }

  // 2. Check content_candidates
  const { data: candidates, error: candError, count: candCount } = await supabase
    .from('content_candidates')
    .select('*', { count: 'exact' });

  if (candError) {
    console.error("Error fetching content_candidates:", candError);
  } else {
    console.log(`\n--- Content Candidates Table (Total: ${candCount}) ---`);
    console.log(JSON.stringify(candidates.slice(0, 10), null, 2));
  }
}

checkDb().catch(console.error);
