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
  console.log("Fetching content candidates from Supabase...");
  const { data: candidates, error } = await supabase
    .from('content_candidates')
    .select('*');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${candidates.length} candidates.`);
  candidates.forEach((c, i) => {
    console.log(`\nCandidate #${i + 1}:`);
    console.log(`  ID: ${c.id}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Source: ${c.source}`);
    console.log(`  Source Type: ${c.source_type}`);
    console.log(`  Answer: ${c.answer}`);
    console.log(`  Candidate Score: ${c.candidate_score}`);
    console.log(`  Suspicious Score: ${c.suspicious_score}`);
    console.log(`  Auto Approve Eligible: ${c.auto_approve_eligible}`);
    console.log(`  Safety Status: ${c.safety_status}`);
    console.log(`  Prompt Used: ${c.prompt_used ? c.prompt_used.substring(0, 40) + '...' : null}`);
    console.log(`  Photographer Name: ${c.photographer_name}`);
    console.log(`  Image URL: ${c.image_url}`);
  });
}

check().catch(console.error);
