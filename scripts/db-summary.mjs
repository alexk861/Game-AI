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

async function summarize() {
  console.log("Checking DB Summary...");

  // 1. Challenges counts
  const { data: challenges, error: chalError } = await supabase
    .from('challenges')
    .select('id, set_date, set_order, answer');

  if (chalError) {
    console.error("Error fetching challenges:", chalError);
  } else {
    console.log(`\n--- Challenges ---`);
    console.log(`Total count: ${challenges.length}`);
    const byDate = {};
    challenges.forEach(c => {
      byDate[c.set_date] = (byDate[c.set_date] || 0) + 1;
    });
    console.log("Challenges by date:", byDate);
  }

  // 2. Candidates counts
  const { data: candidates, error: candError } = await supabase
    .from('content_candidates')
    .select('id, status, source, answer');

  if (candError) {
    console.error("Error fetching content_candidates:", candError);
  } else {
    console.log(`\n--- Content Candidates ---`);
    console.log(`Total count: ${candidates.length}`);
    const byStatus = {};
    const bySource = {};
    candidates.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      bySource[c.source] = (bySource[c.source] || 0) + 1;
    });
    console.log("Candidates by status:", byStatus);
    console.log("Candidates by source:", bySource);
  }
}

summarize().catch(console.error);
