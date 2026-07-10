const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local file
const envPath = path.resolve(__dirname, '../.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
const env = {};
envData.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      // Strip outer quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  try {
    // 1. Check total challenge count
    const { count, error: countErr } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.error('Error fetching challenge count:', countErr.message);
    } else {
      console.log('Total challenges in database:', count);
    }

    // 2. Check challenges by date
    const { data: dates, error: dateErr } = await supabase
      .from('challenges')
      .select('set_date, set_order')
      .order('set_date', { ascending: false });

    if (dateErr) {
      console.error('Error fetching dates:', dateErr.message);
    } else if (dates && dates.length > 0) {
      console.log('\nChallenges found in database:');
      const dateCounts = {};
      dates.forEach(row => {
        dateCounts[row.set_date] = (dateCounts[row.set_date] || 0) + 1;
      });
      console.table(Object.keys(dateCounts).map(date => ({
        Date: date,
        Count: dateCounts[date]
      })));
    } else {
      console.log('No challenges found in database.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkDatabase();
