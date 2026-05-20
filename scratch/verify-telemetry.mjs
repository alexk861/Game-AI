import fetch from 'node-fetch';

async function verifyTelemetry() {
  console.log('Fetching manual auto-fill to verify telemetry...');
  try {
    const res = await fetch('http://localhost:3000/api/admin/auto-fill-content', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('\n================ Telemetry Details ================');
    if (data.details && data.details.length > 0) {
      data.details.forEach(line => console.log(line));
    } else {
      console.log('No details found in report.');
    }
    
    console.log('\n================ Full Report Output ================');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during telemetry verification:', err);
  }
}

verifyTelemetry();
