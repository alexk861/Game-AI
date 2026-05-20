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

async function test() {
  const row = {
    set_date: '2026-05-30',
    set_order: 11,
    image_url: 'https://example.com/test-11.jpg',
    answer: 'ai',
    difficulty: 5,
    context_short: 'Test slot 11',
    source_credit: 'Test credit'
  };

  console.log("Attempting to insert order=11 row...");
  const { data, error } = await supabase.from('challenges').insert([row]).select();
  if (error) {
    console.error("FAILED to insert order 11:", error.message);
  } else {
    console.log("SUCCESS inserted order 11! Data:", data);
    // Cleanup
    await supabase.from('challenges').delete().eq('id', data[0].id);
    console.log("Cleaned up successfully.");
  }
}

test().catch(console.error);
