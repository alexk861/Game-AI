import { getSupabaseAdmin } from '../lib/supabase-server.js';
import { generateAiCandidates } from '../lib/aiCandidateGenerator.js';
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
  console.log('Running generateAiCandidates...');
  const result = await generateAiCandidates(supabase);
  console.log('\n================ AI GENERATION RUN RESULT ================');
  console.log(JSON.stringify(result, null, 2));
}

trigger().catch(console.error);
