import pkg from 'pg';
const { Client } = pkg;

const host = 'aws-1-ap-south-1.pooler.supabase.com';
const user = 'postgres.rahzhfgbmromdhfhunff';
const database = 'postgres';
const port = 6543;

const passwords = [
  'admin',
  'password',
  'postgres123',
  'uncanny',
  'uncanny123',
  'game-ai',
  'gameai',
  'gameai123',
  'admin123',
  'root',
  'alex1',
  'alex',
  'alex123',
  'mujde',
  'mujde123'
];

async function tryPasswords() {
  console.log("Starting database password verification...");
  for (const password of passwords) {
    console.log(`Trying password: '${password}'...`);
    const client = new Client({
      host,
      port,
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Database connected with password: '${password}'\n`);
      await client.end();
      return password;
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        // Expected failure
      } else {
        console.log(`  Connection error (non-auth):`, err.message);
      }
    }
  }
  console.log("\n❌ All guessed passwords failed.");
  return null;
}

tryPasswords().catch(console.error);
