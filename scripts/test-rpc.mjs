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

async function testSystemCatalog() {
  console.log("Testing if we can read system catalogs or run custom queries via Supabase client...");
  
  // Try querying a non-public schema or system view
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .limit(5);

  if (error) {
    console.log("❌ Failed to query pg_proc directly:", error.message);
  } else {
    console.log("✅ Success! Queried pg_proc:", data);
  }
}

testSystemCatalog().catch(console.error);
