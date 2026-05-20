import { getSupabaseAdmin } from '../lib/supabase-server.js';
import { runAutoFill } from '../lib/autoFillEngine.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAutoFill() {
  const supabase = getSupabaseAdmin();
  console.log('Running runAutoFill directly from node script...');
  const report = await runAutoFill(supabase);
  console.log('\n================ AUTO-FILL REPORT ================');
  console.log(JSON.stringify(report, null, 2));
}

testAutoFill();
