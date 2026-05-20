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

async function checkColumns() {
  console.log("Checking for new curation & telemetry columns in 'content_candidates'...");
  const newCols = [
    'curator_blessed', 'curator_priority', 'curator_notes', 'curator_locked', 'anomaly_tier',
    'total_served_count', 'total_correct_count', 'total_wrong_count', 'total_timeout_count',
    'average_decision_ms', 'disagreement_score', 'consensus_confidence', 'suspicion_accuracy',
    'total_reflection_unlocks', 'reflection_unlock_rate', 'total_replay_clicks', 'replay_interest_score',
    'total_guess_confidence_sum', 'total_guess_confidence_sq_sum', 'total_answer_change_count',
    'total_investigation_duration_ms', 'total_reflection_duration_ms', 'average_reflection_duration_ms',
    'confidence_variance_score', 'slow_burn_score', 'candidate_decay_score',
    'composition_fingerprint', 'emotional_fingerprint', 'lighting_fingerprint',
    'perspective_fingerprint', 'scene_fingerprint', 'object_fingerprint', 'texture_fingerprint'
  ];

  let missing = [];
  for (const col of newCols) {
    const { error } = await supabase.from('content_candidates').select(col).limit(1);
    if (error) {
      console.log(`❌ Column '${col}' check failed:`, error.message);
      missing.push(col);
    } else {
      console.log(`✅ Column '${col}' exists.`);
    }
  }

  if (missing.length === 0) {
    console.log("\n🎉 ALL new curator/telemetry/fingerprint columns are present in the database!");
  } else {
    console.log(`\n⚠️ Missing ${missing.length} columns in remote DB. They must be applied.`);
  }
}

checkColumns().catch(console.error);
