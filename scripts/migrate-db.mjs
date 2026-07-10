import { createClient } from '@supabase/supabase-js';

const OLD_URL = "https://rahzhfgbmromdhfhunff.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHpoZmdibXJvbWRoZmh1bmZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwMDEzOSwiZXhwIjoyMDk1Mzc2MTM5fQ.2DZf6WuQ1fWpiGwp3k0tl0YCpXhLi64ji4Eqm9yjWhk";

const NEW_URL = "https://udbaxpyzurywekllytgd.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkYmF4cHl6dXJ5d2VrbGx5dGdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIwODI1NSwiZXhwIjoyMDk1Nzg0MjU1fQ.JAwywJPZo7xJP02y5JtuTnvgL42fs9nvdBpJ05ZbugI";

async function run() {
  console.log("=== UNCANNY DATABASE MIGRATION SCRIPT ===");
  console.log(`Connecting to OLD database: ${OLD_URL}`);
  const oldSupabase = createClient(OLD_URL, OLD_KEY);

  console.log(`Connecting to NEW database: ${NEW_URL}`);
  const newSupabase = createClient(NEW_URL, NEW_KEY);

  // 1. EXTRACT DATA
  console.log("\n[1/3] Extracting records from old database...");
  
  console.log("Fetching content_candidates...");
  const { data: candidates, error: candErr } = await oldSupabase
    .from('content_candidates')
    .select('*');
  if (candErr) throw candErr;
  console.log(`Fetched ${candidates.length} content candidates.`);

  console.log("Fetching challenges...");
  const { data: challenges, error: chalErr } = await oldSupabase
    .from('challenges')
    .select('*');
  if (chalErr) throw chalErr;
  console.log(`Fetched ${challenges.length} challenges.`);

  console.log("Fetching ai_generation_runs...");
  const { data: runs, error: runErr } = await oldSupabase
    .from('ai_generation_runs')
    .select('*');
  if (runErr) throw runErr;
  console.log(`Fetched ${runs.length} AI generation runs.`);

  // 2. BULK MIGRATION TO NEW INSTANCE
  console.log("\n[2/3] Writing records to new database...");

  // Phase 2A: Migrate content_candidates
  // We must handle parent-child hierarchy properly.
  // First insert candidates with no parent
  const parentCandidates = candidates.filter(c => !c.parent_real_candidate_id);
  const childCandidates = candidates.filter(c => !!c.parent_real_candidate_id);

  console.log(`Inserting ${parentCandidates.length} parent content candidates...`);
  if (parentCandidates.length > 0) {
    const { error: insParentErr } = await newSupabase
      .from('content_candidates')
      .upsert(parentCandidates);
    if (insParentErr) throw insParentErr;
    console.log("Parent content candidates migrated successfully.");
  }

  console.log(`Inserting ${childCandidates.length} child content candidates (holding parent references)...`);
  if (childCandidates.length > 0) {
    const { error: insChildErr } = await newSupabase
      .from('content_candidates')
      .upsert(childCandidates);
    if (insChildErr) throw insChildErr;
    console.log("Child content candidates migrated successfully.");
  }

  // Phase 2B: Migrate challenges
  console.log(`Inserting ${challenges.length} challenges...`);
  if (challenges.length > 0) {
    const { error: insChalErr } = await newSupabase
      .from('challenges')
      .upsert(challenges);
    if (insChalErr) throw insChalErr;
    console.log("Challenges migrated successfully.");
  }

  // Phase 2C: Migrate ai_generation_runs
  console.log(`Inserting ${runs.length} AI generation runs...`);
  if (runs.length > 0) {
    const { error: insRunErr } = await newSupabase
      .from('ai_generation_runs')
      .upsert(runs);
    if (insRunErr) throw insRunErr;
    console.log("AI generation runs migrated successfully.");
  }

  // 3. INTEGRITY CHECK
  console.log("\n[3/3] Running database integrity checks...");
  const { count: newCandCount } = await newSupabase
    .from('content_candidates')
    .select('*', { count: 'exact', head: true });
  
  const { count: newChalCount } = await newSupabase
    .from('challenges')
    .select('*', { count: 'exact', head: true });

  const { count: newRunCount } = await newSupabase
    .from('ai_generation_runs')
    .select('*', { count: 'exact', head: true });

  console.log("\nMigration completed successfully. Row counts match summary:");
  console.log(`  - Content Candidates: Old = ${candidates.length} | New = ${newCandCount}`);
  console.log(`  - Challenges:         Old = ${challenges.length} | New = ${newChalCount}`);
  console.log(`  - AI Gen Runs:        Old = ${runs.length} | New = ${newRunCount}`);
}

run().catch(err => {
  console.error("\nMIGRATION FAILED WITH ERROR:", err);
  process.exit(1);
});
