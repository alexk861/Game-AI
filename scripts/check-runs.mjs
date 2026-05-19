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

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkRuns() {
  console.log("Connecting to Supabase at:", url);

  const { data: runs, error, count } = await supabase
    .from('ai_generation_runs')
    .select('*', { count: 'exact' });

  if (error) {
    console.error("Error fetching ai_generation_runs:", error);
  } else {
    console.log(`\n--- AI Generation Runs (Total: ${count}) ---`);
    console.log(JSON.stringify(runs, null, 2));
  }
}

checkRuns().catch(console.error);
