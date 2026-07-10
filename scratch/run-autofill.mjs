import { getSupabaseAdmin } from '../lib/supabase-server.js';
import { runAutoFill } from '../lib/autoFillEngine.js';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
envData.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
});

async function trigger() {
  const supabase = getSupabaseAdmin();
  const datesToClear = ['2026-07-09', '2026-07-10', '2026-07-11'];
  
  console.log('Clearing challenges for dates:', datesToClear);
  const { data: deleted, error: delErr } = await supabase
    .from('challenges')
    .delete()
    .in('set_date', datesToClear)
    .select();

  if (delErr) {
    console.error('Failed to clear challenges:', delErr.message);
    return;
  }
  console.log(`Successfully deleted ${deleted?.length || 0} old challenge rows.`);

  console.log('Running runAutoFill...');
  const report = await runAutoFill(supabase);
  console.log('\n================ AUTO-FILL REPORT ================');
  console.log(JSON.stringify(report, null, 2));
}

trigger().catch(console.error);
