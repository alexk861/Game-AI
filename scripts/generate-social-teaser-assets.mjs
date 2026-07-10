import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments for a custom date (YYYY-MM-DD)
const customDateArg = process.argv[2];

// Manually parse .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};

try {
  if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf8');
    envData.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join('=').trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    });
  } else {
    console.warn("⚠️ .env.local not found. Falling back to system environment variables.");
    env = process.env;
  }
} catch (err) {
  console.error("❌ Failed to parse .env.local:", err.message);
  env = process.env;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing Supabase credentials. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

// Resolve target date (YYYY-MM-DD) in local time zone
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const targetDate = customDateArg || getLocalDateString();
console.log(`\n🎨 Generating UNCANNY social teaser assets for date: ${targetDate}`);

async function main() {
  // Create output directory
  const outputDir = path.resolve(process.cwd(), 'outputs', 'social');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Fetch daily set from database
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('set_date', targetDate)
    .order('set_order', { ascending: true });

  if (error) {
    console.error("❌ Failed to query database daily set:", error.message);
    process.exit(1);
  }

  let teaserImage = "";
  if (!challenges || challenges.length === 0) {
    console.warn(`⚠️ No daily set challenges scheduled in Supabase for ${targetDate}.`);
    console.warn("Using placeholder teaser graphic background.");
    teaserImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600";
  } else {
    // Pick the first image from standard set (set_order <= 5)
    const standardSet = challenges.filter(c => c.set_order <= 5);
    const chosenChallenge = standardSet[0] || challenges[0];
    teaserImage = chosenChallenge.image_url;
    console.log(`Fetched standard daily set. Using image from Order 0${chosenChallenge.set_order || 1} as teaser asset.`);
  }

  // Enforce zero leaks: clean challenge link
  const challengeLink = `https://www.uncanny.info/challenge/${targetDate}`;

  // 1. Generate Instagram/TikTok Story (1080 x 1920)
  const storySvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;600&amp;display=swap');
      .brand { font-family: 'Outfit', sans-serif; font-weight: 200; font-size: 54px; letter-spacing: 0.4em; fill: #ffffff; text-anchor: middle; }
      .kicker { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 24px; letter-spacing: 0.3em; fill: #c8963e; text-anchor: middle; text-transform: uppercase; }
      .question { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 42px; letter-spacing: 0.12em; fill: #ffffff; text-anchor: middle; }
      .sublabel { font-family: 'Outfit', sans-serif; font-weight: 200; font-size: 26px; letter-spacing: 0.2em; fill: #8a8d91; text-anchor: middle; text-transform: uppercase; }
      .cta-url { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 32px; letter-spacing: 0.15em; fill: #c8963e; text-anchor: middle; }
      .card-bg { fill: #18191c; stroke: rgba(255,255,255,0.06); stroke-width: 2; }
    </style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0b0c0e"/>
      <stop offset="100%" stop-color="#141619"/>
    </linearGradient>
    <clipPath id="imageClip">
      <rect x="140" y="520" width="800" height="800" rx="4" />
    </clipPath>
  </defs>

  <!-- Deep cinematic background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)" />

  <!-- Subtle aesthetic accent line -->
  <line x1="540" y1="120" x2="540" y2="220" stroke="#c8963e" stroke-width="2" opacity="0.3"/>

  <!-- Brand Headers -->
  <text x="560" y="320" class="brand">UNCANNY</text>
  <text x="540" y="380" class="kicker">// DAILY PERCEPTION TEST</text>

  <!-- Central Framed Teaser Card -->
  <rect x="110" y="490" width="860" height="860" rx="6" class="card-bg" />
  
  <!-- Single teaser image (spoiler-free) -->
  <g clip-path="url(#imageClip)">
    <image href="${teaserImage}" x="140" y="520" width="800" height="800" preserveAspectRatio="xMidYMid slice" opacity="0.85"/>
  </g>
  
  <!-- Subtle Vignette overlay inside card -->
  <rect x="140" y="520" width="800" height="800" rx="4" fill="black" opacity="0.1" pointer-events="none" />

  <!-- Question Core Text -->
  <text x="540" y="1460" class="question">Can you tell real from AI?</text>
  <text x="540" y="1520" class="sublabel">One of these five images is a trick.</text>

  <!-- Bottom CTA Area -->
  <rect x="190" y="1660" width="700" height="100" rx="3" fill="#18191c" stroke="rgba(200,150,62,0.2)" stroke-width="1.5"/>
  <text x="540" y="1720" class="cta-url">UNCANNY.INFO/CHALLENGE</text>

  <!-- Footnote -->
  <text x="540" y="1830" font-family="'Outfit', sans-serif" font-weight="200" font-size="18" fill="rgba(255,255,255,0.2)" text-anchor="middle" letter-spacing="0.1em">SCAN INSTINCT • NO SIGNS REQUIRED</text>
</svg>
`;

  // 2. Generate TikTok/Reels Video Poster (1080 x 1920) - with prominent center tension
  const tiktokSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;600&amp;display=swap');
      .brand { font-family: 'Outfit', sans-serif; font-weight: 200; font-size: 58px; letter-spacing: 0.45em; fill: #ffffff; text-anchor: middle; }
      .kicker { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 26px; letter-spacing: 0.35em; fill: #c8963e; text-anchor: middle; text-transform: uppercase; }
      .headline { font-family: 'Outfit', sans-serif; font-weight: 400; font-size: 46px; letter-spacing: 0.1em; fill: #ffffff; text-anchor: middle; }
      .cta-btn { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 28px; letter-spacing: 0.2em; fill: #121315; text-anchor: middle; }
      .card-bg { fill: #18191c; stroke: rgba(255,255,255,0.05); stroke-width: 2; }
    </style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#08090a"/>
      <stop offset="100%" stop-color="#111215"/>
    </linearGradient>
    <clipPath id="imageClip">
      <rect x="90" y="580" width="900" height="680" rx="3" />
    </clipPath>
  </defs>

  <!-- Deep background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)" />

  <!-- Grid aesthetics in background -->
  <line x1="90" y1="0" x2="90" y2="1920" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
  <line x1="990" y1="0" x2="990" y2="1920" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>

  <!-- Brand Headers -->
  <text x="564" y="300" class="brand">UNCANNY</text>
  <text x="540" y="360" class="kicker">// DAILY INSTINCT DUEL</text>

  <!-- Central Framed Teaser Card -->
  <rect x="70" y="560" width="940" height="720" rx="5" class="card-bg" />
  
  <!-- Single teaser image (spoiler-free) -->
  <g clip-path="url(#imageClip)">
    <image href="${teaserImage}" x="90" y="580" width="900" height="680" preserveAspectRatio="xMidYMid slice" opacity="0.8"/>
  </g>

  <!-- Text and prompt -->
  <text x="540" y="1400" class="headline">REAL OR AI GENERATED?</text>
  <text x="540" y="1465" font-family="'Outfit', sans-serif" font-weight="200" font-size="28" fill="#a0a4a8" text-anchor="middle" letter-spacing="0.1em">Average accuracy is only 60%.</text>

  <!-- Bottom CTA Area -->
  <rect x="240" y="1600" width="600" height="96" rx="3" fill="#f0ece9" />
  <text x="540" y="1656" class="cta-btn">PLAY DAILY SET</text>
  
  <text x="540" y="1740" font-family="'Outfit', sans-serif" font-weight="400" font-size="24" fill="#c8963e" text-anchor="middle" letter-spacing="0.15em">uncanny.info/challenge</text>
</svg>
`;

  // 3. Generate Feed Square (1080 x 1080)
  const feedSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;600&amp;display=swap');
      .brand { font-family: 'Outfit', sans-serif; font-weight: 200; font-size: 46px; letter-spacing: 0.35em; fill: #ffffff; }
      .kicker { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 16px; letter-spacing: 0.25em; fill: #c8963e; text-transform: uppercase; }
      .question { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 34px; letter-spacing: 0.1em; fill: #ffffff; }
      .cta-url { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 20px; letter-spacing: 0.12em; fill: #c8963e; text-anchor: end; }
      .card-bg { fill: #18191c; stroke: rgba(255,255,255,0.06); stroke-width: 1.5; }
    </style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1080" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0b0c0e"/>
      <stop offset="100%" stop-color="#141619"/>
    </linearGradient>
    <clipPath id="imageClip">
      <rect x="70" y="240" width="940" height="580" rx="3" />
    </clipPath>
  </defs>

  <!-- Deep background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />

  <!-- Top Header Row -->
  <g transform="translate(70, 90)">
    <text x="0" y="35" class="brand">UNCANNY</text>
    <text x="0" y="70" class="kicker">// INSTINCT STUDY</text>
  </g>

  <!-- Central Framed Teaser Card -->
  <rect x="50" y="220" width="980" height="620" rx="4" class="card-bg" />
  
  <!-- Single teaser image (spoiler-free) -->
  <g clip-path="url(#imageClip)">
    <image href="${teaserImage}" x="70" y="240" width="940" height="580" preserveAspectRatio="xMidYMid slice" opacity="0.8"/>
  </g>

  <!-- Bottom Metadata Row -->
  <g transform="translate(70, 940)">
    <text x="0" y="25" class="question">Can you tell real from AI?</text>
    <text x="0" y="55" font-family="'Outfit', sans-serif" font-weight="200" font-size="18" fill="#8a8d91" letter-spacing="0.1em">Daily Perception Test • 5 Images • Under 15s</text>
    
    <!-- Right-aligned Link -->
    <text x="940" y="35" class="cta-url">UNCANNY.INFO/CHALLENGE</text>
  </g>
</svg>
`;

  // 4. Generate Caption Text
  const captionText = `UNCANNY — Daily Perception Test // ${targetDate}

One of these five images is a trick. A camera captured most. A generator calculated others. 

Can your eyes tell real from AI, or will you be fooled?
Average players get 3 out of 5 correct. Let’s see what your instincts do.

Play today’s official set:
${challengeLink}

#uncanny #perceptiontest #realorai #instinct #aiphotography #computationalphotography #gameresults #spottheai #dailyquiz
`;

  // Write outputs
  fs.writeFileSync(path.join(outputDir, 'instagram_story_1080x1920.svg'), storySvg, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'tiktok_reels_1080x1920.svg'), tiktokSvg, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'feed_1080x1080.svg'), feedSvg, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'caption.txt'), captionText, 'utf8');

  console.log(`\n🎉 Successfully generated social teaser assets at:`);
  console.log(`  - 📱 Instagram Story: outputs/social/instagram_story_1080x1920.svg`);
  console.log(`  - 🎥 TikTok/Reels:    outputs/social/tiktok_reels_1080x1920.svg`);
  console.log(`  - 📰 Feed Post:       outputs/social/feed_1080x1080.svg`);
  console.log(`  - 📝 Teaser Caption:  outputs/social/caption.txt`);
  console.log(`\nAll assets are completely spoiler-free and ready for organic teaser distribution!`);
}

main().catch(err => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
