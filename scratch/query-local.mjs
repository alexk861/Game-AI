import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Parse .env.local manually
const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
console.log("Local URL:", url);
const supabase = createClient(url, key);

async function query() {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*');

  if (error) {
    console.error("Error querying challenges:", error);
  } else {
    console.log(`Found ${challenges.length} local challenges:`);
    challenges.forEach(c => {
      console.log(`ID: ${c.id}, Date: ${c.set_date}, Order: ${c.set_order}, Answer: ${c.answer}, URL: ${c.image_url}`);
    });
  }

  const { data: candidates, error: candError } = await supabase
    .from('content_candidates')
    .select('*')
    .eq('status', 'approved');

  if (candError) {
    console.error("Error querying approved candidates:", candError);
  } else {
    console.log(`Found ${candidates.length} approved candidates:`);
    candidates.forEach(c => {
      console.log(`ID: ${c.id}, Score: ${c.candidate_score}, URL: ${c.image_url}`);
    });
  }
}

query().catch(console.error);
