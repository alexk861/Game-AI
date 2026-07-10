import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('NEXT_PUBLIC_SUPABASE_URL=')[1].replace(/['"]/g, '').trim();
    }
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.split('NEXT_PUBLIC_SUPABASE_ANON_KEY=')[1].replace(/['"]/g, '').trim();
    }
  }
} catch (err) {
  console.error('Error reading .env.local file:', err);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key missing from environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getStats() {
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('guesses_ai, guesses_real');

    if (error) {
      console.error('Error fetching challenges:', error);
      process.exit(1);
    }

    let totalGuesses = 0;
    if (challenges) {
      for (const ch of challenges) {
        totalGuesses += (ch.guesses_ai || 0) + (ch.guesses_real || 0);
      }
    }

    const estimatedGames = Math.round(totalGuesses / 5);
    console.log(`JSON_OUTPUT: {"total_guesses": ${totalGuesses}, "estimated_games": ${estimatedGames}}`);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

getStats();
