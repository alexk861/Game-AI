async function test() {
  const url = 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/50fce744-231e-472d-8e03-b4f4f9b2c1cb.jpg';
  try {
    const res = await fetch(url);
    console.log(`Status for ${url}:`, res.status);
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
  }
}
test();
