import { GET } from '../app/api/daily-set/route.ts';

// Set up environment variables locally for the test run
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    process.env[match[1]] = value.trim();
  }
});

async function runTest() {
  console.log("Running local daily-set route GET handler check...");
  
  const req = new Request('http://localhost:3000/api/daily-set?set=2026-06-01');
  const response = await GET(req);
  
  console.log("HTTP Status:", response.status);
  const data = await response.json();
  console.log("Response JSON:");
  console.log(JSON.stringify(data, null, 2));
}

runTest().catch(console.error);
