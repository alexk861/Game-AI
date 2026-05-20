import fetch from 'node-fetch';

async function verifyAdminMetadata() {
  console.log('Querying admin candidates endpoint for metadata telemetry...');
  try {
    const res = await fetch('http://localhost:3000/api/admin/candidates?status=review', {
      headers: {
        'Authorization': 'Bearer test-secret'
      }
    });
    
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('\n================ Metadata Telemetry ================');
    console.log(JSON.stringify(data.metadata, null, 2));
    
    console.log('\n================ Counts ================');
    console.log(JSON.stringify(data.counts, null, 2));
  } catch (err) {
    console.error('Error during metadata verification:', err);
  }
}

verifyAdminMetadata();
