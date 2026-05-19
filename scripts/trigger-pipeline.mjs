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

async function triggerPipeline() {
  console.log("Triggering AI Candidate Generation...");
  try {
    const genRes = await fetch(`${baseUrl}/api/admin/generate-ai-candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminSecret}`
      },
      body: JSON.stringify({ count: 5 })
    });
    
    const genData = await genRes.json();
    console.log("AI Candidate Generation response:", genRes.status, genData);
    
    if (!genRes.ok) {
      throw new Error(`Generation failed with status ${genRes.status}`);
    }

    console.log("\nTriggering Auto-Fill Content...");
    const fillRes = await fetch(`${baseUrl}/api/admin/auto-fill-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminSecret}`
      }
    });

    const fillData = await fillRes.json();
    console.log("Auto-Fill response:", fillRes.status, fillData);

  } catch (error) {
    console.error("Pipeline trigger failed:", error);
  }
}

triggerPipeline().catch(console.error);
