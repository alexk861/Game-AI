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

const adminSecret = env.ADMIN_SECRET || 'my-admin-secret-123';
const baseUrl = 'http://localhost:3000';

async function triggerAutoFill() {
  console.log("Triggering Auto-Fill Content via HTTP POST...");
  try {
    const fillRes = await fetch(`${baseUrl}/api/admin/auto-fill-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminSecret}`
      }
    });

    const fillData = await fillRes.json();
    console.log("Auto-Fill response:", fillRes.status, JSON.stringify(fillData, null, 2));

  } catch (error) {
    console.error("Auto-Fill HTTP trigger failed:", error);
  }
}

triggerAutoFill().catch(console.error);
