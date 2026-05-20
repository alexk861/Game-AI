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
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('challenges')
    .select('id, set_date, set_order, difficulty, answer, image_url')
    .eq('set_date', today)
    .order('set_order', { ascending: true });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Today's challenges:");
    console.log(data);
  }
}
check().catch(console.error);
