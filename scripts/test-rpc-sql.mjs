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

async function testRpcs() {
  const rpcs = [
    { name: 'exec_sql', args: { sql: 'SELECT 1' } },
    { name: 'execute_sql', args: { sql: 'SELECT 1' } },
    { name: 'run_sql', args: { sql: 'SELECT 1' } },
    { name: 'exec_query', args: { query: 'SELECT 1' } }
  ];

  for (const rpc of rpcs) {
    console.log(`Testing RPC '${rpc.name}'...`);
    const { data, error } = await supabase.rpc(rpc.name, rpc.args);
    if (error) {
      console.log(`  ❌ ${rpc.name} failed:`, error.message);
    } else {
      console.log(`  ✅ ${rpc.name} SUCCEEDED:`, data);
    }
  }
}

testRpcs().catch(console.error);
