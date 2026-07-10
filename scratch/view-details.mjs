import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
const env = {};
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
      env[key] = value;
    }
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkCandidates() {
  const { data, error } = await supabase
    .from('content_candidates')
    .select('id, source, source_type, answer, status, safety_status, auto_approve_eligible, prompt_used')
    .in('status', ['approved', 'auto_approved']);

  if (error) {
    console.error("❌ Error fetching candidates:", error);
    return;
  }

  console.log(`Found ${data.length} approved/auto-approved candidates:`);
  data.forEach((c, i) => {
    console.log(`${i+1}. Candidate ${c.id}:
      - Source: ${c.source}
      - Source Type: ${c.source_type}
      - Answer: ${c.answer}
      - Status: ${c.status}
      - Safety Status: ${c.safety_status}
      - Auto-Approve Eligible: ${c.auto_approve_eligible}
      - Prompt Used: ${c.prompt_used}`);
  });
}

checkCandidates().catch(console.error);
