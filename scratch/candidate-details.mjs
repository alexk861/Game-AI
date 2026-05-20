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
  const ids = [
    '40e1b6ed-e90b-44a9-9cc4-50c8891980c2', // AI candidate
    'fef7a7d5-084d-4391-b07b-68080c4cb95e', // AI candidate
    '750820b0-b5cf-4352-b735-bbfc1bd740c5'  // Real candidate
  ];

  const { data, error } = await supabase
    .from('content_candidates')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Candidate details:");
    console.log(JSON.stringify(data, null, 2));
  }
}
check().catch(console.error);
