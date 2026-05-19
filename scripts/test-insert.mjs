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

async function testInsert() {
  console.log("Testing insert...");
  // Let's check if there are any challenges
  const { data: current } = await supabase.from('challenges').select('*');
  console.log("Current challenges count:", current?.length);

  const testRow = {
    set_date: '2026-05-30',
    set_order: 1,
    image_url: 'https://example.com/test.jpg',
    answer: 'real',
    difficulty: 1,
    context_short: 'Test context',
    source_credit: 'Test credit'
  };

  // Try 1: Insert without onConflict
  console.log("Try 1: plain insert...");
  const res1 = await supabase.from('challenges').insert([testRow]).select();
  console.log("Plain insert result:", res1.status, res1.error ? res1.error.message : "SUCCESS", res1.data);

  if (res1.data && res1.data.length > 0) {
    // Clean up
    console.log("Cleaning up test row...");
    const delRes = await supabase.from('challenges').delete().eq('id', res1.data[0].id);
    console.log("Delete status:", delRes.status);
  }

  // Try 2: Upsert onConflict: 'set_date,set_order'
  console.log("Try 2: upsert set_date,set_order...");
  const res2 = await supabase.from('challenges').upsert([testRow], { onConflict: 'set_date,set_order' });
  console.log("Upsert set_date,set_order result:", res2.status, res2.error ? res2.error.message : "SUCCESS");

  // Try 3: Upsert onConflict: 'id'
  console.log("Try 3: upsert id...");
  const res3 = await supabase.from('challenges').upsert([testRow], { onConflict: 'id' });
  console.log("Upsert id result:", res3.status, res3.error ? res3.error.message : "SUCCESS");
}

testInsert().catch(console.error);
