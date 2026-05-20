import fetch from 'node-fetch';

async function triggerAutoFill() {
  console.log('Triggering auto-fill...');
  try {
    const res = await fetch('http://localhost:3000/api/cron/auto-fill-content');
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Report output:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error triggering auto-fill:', err);
  }
}

triggerAutoFill();
