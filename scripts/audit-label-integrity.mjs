import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env.local file
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
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runAudit() {
  console.log("====================================================");
  console.log("🔍 UNCANNY — Database Label & Data Integrity Audit");
  console.log("====================================================\n");

  let scannedCount = 0;
  let violationsCount = 0;
  const violationsList = [];

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // --- 1. Audit Challenges Table ---
  console.log("📋 Auditing 'challenges' table...");
  const { data: challenges, error: chalError } = await supabase
    .from('challenges')
    .select('*')
    .order('set_date', { ascending: true })
    .order('set_order', { ascending: true });

  if (chalError) {
    console.error("❌ Failed to query challenges table:", chalError.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${challenges.length} challenge records.`);
  challenges.forEach(c => {
    scannedCount++;
    
    // Check missing properties
    if (!c.image_url) {
      violationsCount++;
      violationsList.push(`[challenges] Challenge ${c.id} on ${c.set_date} has missing 'image_url'`);
      return;
    }
    if (!c.answer) {
      violationsCount++;
      violationsList.push(`[challenges] Challenge ${c.id} on ${c.set_date} has missing 'answer'`);
      return;
    }

    // Only strictly audit today and future challenges for label/URL mismatch
    const isTodayOrFuture = c.set_date >= today;
    if (isTodayOrFuture) {
      const isUnsplash = c.image_url.includes('images.unsplash.com') || c.image_url.includes('unsplash.com');
      const isAiUrl = c.image_url.includes('/ai-generated/') || c.image_url.includes('/challenge-images/ai-generated/');

      // Mismatches check
      if (c.answer === 'ai' && isUnsplash) {
        violationsCount++;
        violationsList.push(`🔴 Violation [challenges]: Challenge ${c.id} on ${c.set_date} is labeled 'ai' but uses Unsplash URL: ${c.image_url}`);
      }
      if (c.answer === 'real' && isAiUrl) {
        violationsCount++;
        violationsList.push(`🔴 Violation [challenges]: Challenge ${c.id} on ${c.set_date} is labeled 'real' but uses AI URL: ${c.image_url}`);
      }
    }
  });

  // --- 2. Audit Content Candidates Table ---
  console.log("\n📋 Auditing 'content_candidates' table...");
  const { data: candidates, error: candError } = await supabase
    .from('content_candidates')
    .select('*')
    .in('status', ['approved', 'auto_approved']);

  if (candError) {
    console.error("❌ Failed to query content_candidates table:", candError.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${candidates.length} approved/auto_approved candidate records.`);
  candidates.forEach(c => {
    scannedCount++;

    if (!c.image_url) {
      violationsCount++;
      violationsList.push(`[candidates] Candidate ${c.id} has missing 'image_url'`);
      return;
    }
    
    // Deduce ground truth answer from source if field is null
    const derivedAnswer = c.answer || ((c.source === 'unsplash' || c.source === 'real') ? 'real' : null);
    
    if (!derivedAnswer) {
      violationsCount++;
      violationsList.push(`[candidates] Candidate ${c.id} has missing 'answer' and cannot be derived from source: ${c.source}`);
      return;
    }

    const isUnsplash = c.image_url.includes('images.unsplash.com') || c.image_url.includes('unsplash.com');
    const isAiUrl = c.image_url.includes('/ai-generated/') || c.image_url.includes('/challenge-images/ai-generated/');

    if (derivedAnswer === 'ai' && isUnsplash) {
      violationsCount++;
      violationsList.push(`🔴 Violation [candidates]: Candidate ${c.id} is labeled 'ai' but uses Unsplash URL: ${c.image_url}`);
    }
    if (derivedAnswer === 'real' && isAiUrl) {
      violationsCount++;
      violationsList.push(`🔴 Violation [candidates]: Candidate ${c.id} is labeled 'real' but uses AI URL: ${c.image_url}`);
    }
  });

  // --- 3. Check Schedule Integrity (Next 3 Days) ---
  console.log("\n📅 Checking Schedule Gaps for the next 3 days...");
  const targetDates = [today, tomorrow, dayAfter];

  targetDates.forEach(date => {
    const dayRows = challenges.filter(c => c.set_date === date);
    const standardSet = dayRows.filter(c => c.set_order <= 5);
    const reflectionSet = dayRows.filter(c => c.set_order >= 6 && c.set_order <= 11);

    console.log(`- Date: ${date} -> Scheduled Slots: ${dayRows.map(r => r.set_order).join(', ') || 'NONE'}`);
    if (standardSet.length < 5) {
      console.warn(`  ⚠️ Warning: Standard set for ${date} is incomplete (${standardSet.length}/5 slots filled).`);
    } else {
      console.log(`  ✅ Standard set is fully filled.`);
    }
    console.log(`  - Reflection Slots: ${reflectionSet.length}/6 filled.`);
  });

  // --- 4. Final Summary ---
  console.log("\n====================================================");
  console.log("📊 AUDIT RESULTS SUMMARY");
  console.log("====================================================");
  console.log(`Total Rows Scanned: ${scannedCount}`);
  console.log(`Violations Found: ${violationsCount}`);
  console.log("====================================================");

  if (violationsCount > 0) {
    console.error("\n❌ AUDIT FAILED: Data integrity violations were detected!");
    violationsList.forEach(v => console.error(v));
    process.exit(1);
  } else {
    console.log("\n🎉 AUDIT PASSED: No label integrity mismatches found. Data is pristine!");
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error("❌ Unexpected audit error:", err);
  process.exit(1);
});
