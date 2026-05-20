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
  console.log(`Fetching all challenges...`);
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .order('set_date', { ascending: true })
    .order('set_order', { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${challenges.length} challenges total.`);
  challenges.forEach(c => {
    console.log(`${c.set_date} Slot ${c.set_order}: Answer=${c.answer}, Difficulty=${c.difficulty}, Credit=${c.source_credit}, Image=${c.image_url.substring(0, 60)}...`);
  });
}

check().catch(console.error);
