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

async function check() {
  const { count, error } = await supabase
    .from('content_candidates')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total content candidates in DB:", count);
  }

  // Check count by status
  const { data: statusData, error: statusError } = await supabase
    .from('content_candidates')
    .select('status');

  if (statusError) {
    console.error("Status error:", statusError);
  } else {
    const counts = {};
    statusData.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    console.log("Candidates by status:", counts);
  }
}
check().catch(console.error);
