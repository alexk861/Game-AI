async function checkCrons() {
  const endpoints = [
    'https://game-ai-one.vercel.app/api/cron/fetch-unsplash-candidates',
    'https://game-ai-one.vercel.app/api/cron/generate-ai-candidates',
    'https://game-ai-one.vercel.app/api/cron/auto-fill-content'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      console.log(`Endpoint: ${url}`);
      console.log(`Status: ${res.status}`);
      const body = await res.json().catch(() => null);
      console.log(`Body:`, body);
      console.log('---');
    } catch (err) {
      console.error(`Error pinging ${url}:`, err);
    }
  }
}

checkCrons();
