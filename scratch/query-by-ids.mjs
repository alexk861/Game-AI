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

async function query() {
  const ids = [
    'bbcff52c-2f9a-4935-8064-9778150976f5',
    'df7349d6-a729-4ac1-8f72-9e5895562fa4',
    '12f55b87-b6c8-4a5d-b19c-b5d0f2d16138',
    'c1d02840-622d-4c74-bb40-c8c205af044c',
    'c5d7c3d6-a549-4cfa-b5f8-aacd44ecaf1c'
  ];

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Matched challenges in DB:");
    console.log(data);
  }
}
query().catch(console.error);
