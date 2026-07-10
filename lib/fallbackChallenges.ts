// ── Uncanny Shared Fallback Challenges Pool ──

export interface FallbackChallenge {
  id: string;
  image_url: string;
  answer: 'ai' | 'real';
  difficulty: number;
  set_order: number;
  context_short: string;
  ai_prompt: string | null;
  source_credit: string;
  photographer_name?: string | null;
  photographer_url?: string | null;
  unsplash_url?: string | null;
}

// A large, high-fidelity pool of primary challenge candidates to select from.
// 20 Real and 20 AI items (40 total) with premium, copywriter-approved metadata.
export const FALLBACK_POOL: FallbackChallenge[] = [
  // --- REAL PHOTOS (20) ---
  {
    id: 'fb-real-1',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'A real sunset over the Swiss Alps. Nature doesn\'t need a GPU.',
    ai_prompt: null,
    source_credit: 'Unsplash / Samuel Ferrara'
  },
  {
    id: 'fb-real-2',
    image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
    answer: 'real',
    difficulty: 3,
    set_order: 0,
    context_short: 'A real nebula captured by the Hubble telescope. Space is stranger than AI.',
    ai_prompt: null,
    source_credit: 'NASA/ESA Hubble Heritage'
  },
  {
    id: 'fb-real-3',
    image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'Real Tokyo street at night. Blade Runner wishes it looked this good.',
    ai_prompt: null,
    source_credit: 'Unsplash / Jezael Melgoza'
  },
  {
    id: 'fb-real-4',
    image_url: 'https://images.unsplash.com/photo-1494587416117-f102a2ac0a8d?w=800',
    answer: 'real',
    difficulty: 4,
    set_order: 0,
    context_short: 'A perfectly symmetrical flower. Evolution is the original designer.',
    ai_prompt: null,
    source_credit: 'Unsplash / Annie Spratt'
  },
  {
    id: 'fb-real-5',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'A real portrait with perfect natural lighting. No prompt needed.',
    ai_prompt: null,
    source_credit: 'Unsplash / Joseph Gonzalez'
  },
  {
    id: 'fb-real-6',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    answer: 'real',
    difficulty: 1,
    set_order: 0,
    context_short: 'Mountain peaks at golden hour. Raw, untouched landscape.',
    ai_prompt: null,
    source_credit: 'Unsplash / Kalen Emsley'
  },
  {
    id: 'fb-real-7',
    image_url: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800',
    answer: 'real',
    difficulty: 4,
    set_order: 0,
    context_short: 'Real bioluminescent plankton lighting up the shore. Nature\'s own LED display.',
    ai_prompt: null,
    source_credit: 'Unsplash / Ishan @seefromthesky'
  },
  {
    id: 'fb-real-8',
    image_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'Close-up of ice crystals on a window. Nature\'s fractals.',
    ai_prompt: null,
    source_credit: 'Unsplash / Aaron Burden'
  },
  {
    id: 'fb-real-9',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    answer: 'real',
    difficulty: 1,
    set_order: 0,
    context_short: 'Sunlight filtering through a deep green forest. Real canopy.',
    ai_prompt: null,
    source_credit: 'Unsplash / Thomas Kinto'
  },
  {
    id: 'fb-real-10',
    image_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
    answer: 'real',
    difficulty: 3,
    set_order: 0,
    context_short: 'A quiet tropical lagoon from above. Veritable water patterns.',
    ai_prompt: null,
    source_credit: 'Unsplash / Ishan @seefromthesky'
  },
  {
    id: 'fb-real-11',
    image_url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'A real sunset on a calm beach. Golden light refraction is organic.',
    ai_prompt: null,
    source_credit: 'Unsplash / Quino Al'
  },
  {
    id: 'fb-real-12',
    image_url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800',
    answer: 'real',
    difficulty: 3,
    set_order: 0,
    context_short: 'Authentic astrophotography capture of the night sky. Organic star clusters.',
    ai_prompt: null,
    source_credit: 'Unsplash / Vincentiu Solomon'
  },
  {
    id: 'fb-real-13',
    image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'Chicago skyline during winter twilight. Notice the real water ice patterns.',
    ai_prompt: null,
    source_credit: 'Unsplash / Pedro Lastra'
  },
  {
    id: 'fb-real-14',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    answer: 'real',
    difficulty: 1,
    set_order: 0,
    context_short: 'Yosemite valley in early autumn. Authentic geological erosion.',
    ai_prompt: null,
    source_credit: 'Unsplash / Anneliese Phillips'
  },
  {
    id: 'fb-real-15',
    image_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800',
    answer: 'real',
    difficulty: 3,
    set_order: 0,
    context_short: 'A real sand dune ripples under strong afternoon light.',
    ai_prompt: null,
    source_credit: 'Unsplash / Aaron Burden'
  },
  {
    id: 'fb-real-16',
    image_url: 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?w=800',
    answer: 'real',
    difficulty: 4,
    set_order: 0,
    context_short: 'Organic macro snowflake structure. Nature\'s perfect geometry.',
    ai_prompt: null,
    source_credit: 'Unsplash / Michael Dziedzic'
  },
  {
    id: 'fb-real-17',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    answer: 'real',
    difficulty: 1,
    set_order: 0,
    context_short: 'A real sunbeam slicing through clear ocean water. Genuine fluid light ray.',
    ai_prompt: null,
    source_credit: 'Unsplash / Sean Oulashin'
  },
  {
    id: 'fb-real-18',
    image_url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'The snow-covered peaks of Mount Everest. Authentic wind-swept ridges.',
    ai_prompt: null,
    source_credit: 'Unsplash / Benjamin Voros'
  },
  {
    id: 'fb-real-19',
    image_url: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800',
    answer: 'real',
    difficulty: 2,
    set_order: 0,
    context_short: 'Real Venice canal reflection at sunrise. Notice the natural water distortion.',
    ai_prompt: null,
    source_credit: 'Unsplash / Henrique Ferreira'
  },
  {
    id: 'fb-real-20',
    image_url: 'https://images.unsplash.com/photo-1548625361-155de0cbb558?w=800',
    answer: 'real',
    difficulty: 3,
    set_order: 0,
    context_short: 'St. Vitus Cathedral interior. Real stonemasonry age and weathering.',
    ai_prompt: null,
    source_credit: 'Unsplash / Jonathan Nackstrand'
  },

  // --- AI IMAGES (20) ---
  {
    id: 'fb-ai-1',
    image_url: 'https://images.unsplash.com/photo-1534996858221-380b92700493?w=800',
    answer: 'ai',
    difficulty: 3,
    set_order: 0,
    context_short: 'This portrait was generated by AI. Every pore, every strand of hair is artificial.',
    ai_prompt: 'hyperrealistic portrait, studio lighting, 8k --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-2',
    image_url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI-generated landscape. The water reflections gave it away.',
    ai_prompt: 'misty mountain lake, golden hour --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-3',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    answer: 'ai',
    difficulty: 3,
    set_order: 0,
    context_short: 'This plate of food never existed. Every grain of rice was computed.',
    ai_prompt: 'overhead food photography, michelin star dish --v 6',
    source_credit: 'DALL-E 3'
  },
  {
    id: 'fb-ai-4',
    image_url: 'https://images.unsplash.com/photo-1518882174711-1de40238921b?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI aurora borealis. The colors are too perfect — that\'s the tell.',
    ai_prompt: 'northern lights over snowy mountains --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-5',
    image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    answer: 'ai',
    difficulty: 5,
    set_order: 0,
    context_short: 'This Patagonia-style landscape was generated in under a minute. Zero cameras used.',
    ai_prompt: 'dramatic patagonia landscape, photorealistic --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-6',
    image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    answer: 'ai',
    difficulty: 5,
    set_order: 0,
    context_short: 'Indistinguishable from real. This starry sky was generated in 30 seconds.',
    ai_prompt: 'astrophotography, milky way over mountains --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-7',
    image_url: 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?w=800',
    answer: 'ai',
    difficulty: 3,
    set_order: 0,
    context_short: 'AI-generated macro insect. The wings are mathematically perfect — too perfect.',
    ai_prompt: 'macro butterfly wing, extreme detail --v 6',
    source_credit: 'Leonardo AI'
  },
  {
    id: 'fb-ai-8',
    image_url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'Cyberpunk cityscape. The neon signage has distorted, unreadable text.',
    ai_prompt: 'futuristic city at night, neon lights --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-9',
    image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800',
    answer: 'ai',
    difficulty: 2,
    set_order: 0,
    context_short: 'Cozy A-frame cabin in snow. The chimney smoke splits unnaturally.',
    ai_prompt: 'cozy a-frame cabin, winter forest --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-10',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
    answer: 'ai',
    difficulty: 5,
    set_order: 0,
    context_short: 'Minimalist concrete curves. The shadow lines intersect impossibly.',
    ai_prompt: 'minimalist architecture concrete curves, harsh shadows --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-11',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI generated modern villa. The double glass reflections don\'t align.',
    ai_prompt: 'modern glass villa, architectural digest style --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-12',
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
    answer: 'ai',
    difficulty: 5,
    set_order: 0,
    context_short: 'Synthetic underwater habitat. The air bubbles are perfectly round rings.',
    ai_prompt: 'underwater futuristic bio-dome habitat --v 6',
    source_credit: 'DALL-E 3'
  },
  {
    id: 'fb-ai-13',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    answer: 'ai',
    difficulty: 3,
    set_order: 0,
    context_short: 'AI generated morning coffee mug. The shadow cast by the handle goes the wrong way.',
    ai_prompt: 'cozy morning coffee, flat lay, soft lighting --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-14',
    image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    answer: 'ai',
    difficulty: 3,
    set_order: 0,
    context_short: 'AI portrait of a glowing kitten. The whiskers merge into the fur patterns.',
    ai_prompt: 'adorable glowing kitten, cybernetic whiskers, photorealistic --v 6',
    source_credit: 'Leonardo AI'
  },
  {
    id: 'fb-ai-15',
    image_url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI vintage sports car. The letters on the registration badge are distorted.',
    ai_prompt: 'red vintage sports car, wet street at night --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-16',
    image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    answer: 'ai',
    difficulty: 2,
    set_order: 0,
    context_short: 'A synthetic forest cabin in autumn. The tree branches pass *through* the roof rails.',
    ai_prompt: 'autumn forest cozy cabin, light fog --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-17',
    image_url: 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI bullet train platform. The perspective lines of the tracks cross impossibly.',
    ai_prompt: 'futuristic bullet train station, high-speed, architectural rendering --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-18',
    image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    answer: 'ai',
    difficulty: 5,
    set_order: 0,
    context_short: 'AI glowing crystal cave. The lighting is completely physically impossible.',
    ai_prompt: 'glowing crystal cavern, fantasy atmosphere --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-19',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI generated 70s lounge room. The vinyl player needle is floating.',
    ai_prompt: 'seventies retro lounge room, warm vintage lighting --v 6',
    source_credit: 'Midjourney v6'
  },
  {
    id: 'fb-ai-20',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
    answer: 'ai',
    difficulty: 4,
    set_order: 0,
    context_short: 'AI concrete museum interior. The arches support nothing and end in void.',
    ai_prompt: 'brutalist museum interior, abstract concrete arches --v 6',
    source_credit: 'Midjourney v6'
  }
];

export const FALLBACK_CHALLENGES: Record<number, FallbackChallenge[]> = {
  0: FALLBACK_POOL.slice(0, 20), // Keep static backward compatibility mapping to 20 items
  1: [ // reflection-1, set_order 6-8
    {
      id: 'fb-refl1-1',
      image_url: 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/50fce744-231e-472d-8e03-b4f4f9b2c1cb.jpg',
      answer: 'ai',
      difficulty: 3,
      set_order: 6,
      context_short: 'A modern chair sitting on a concrete patio in soft fog. Rendered synthetically.',
      ai_prompt: 'A modern designer chair sitting on a concrete patio, light fog, shot on 35mm film.',
      source_credit: 'AI Generated'
    },
    {
      id: 'fb-refl1-2',
      image_url: 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/061fad5f-4fea-4d13-8f88-765346af9b91.jpg',
      answer: 'ai',
      difficulty: 4,
      set_order: 7,
      context_short: 'A close up of mossy stones near a forest stream, damp and cold. Completely computer generated.',
      ai_prompt: 'A close-up photograph of mossy stones by a small forest stream, damp conditions, shot on digital macro lens.',
      source_credit: 'AI Generated'
    },
    {
      id: 'fb-refl1-3',
      image_url: 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/d4ac9c9b-91d0-4158-a4ee-cb739050c4c0.jpg',
      answer: 'ai',
      difficulty: 4,
      set_order: 8,
      context_short: 'A rustic key hanging from a rusty nail against weathered green wood. Entirely artificial.',
      ai_prompt: 'A rustic key hanging on a nail in a weathered green wooden door, soft overcast light.',
      source_credit: 'AI Generated'
    }
  ],
  2: [ // reflection-2, set_order 9-10
    {
      id: 'fb-refl2-1',
      image_url: 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/6714bc00-680a-4292-b717-817960b05fa6.jpg',
      answer: 'ai',
      difficulty: 5,
      set_order: 9,
      context_short: 'A worn-out wooden spoon resting on a speckled kitchen counter, morning light filtering in from a window. Entirely generated by AI.',
      ai_prompt: 'A worn-out wooden spoon resting on a speckled kitchen counter, morning light filtering in from a window, captured with a simple digital camera.',
      source_credit: 'AI Generated'
    },
    {
      id: 'fb-refl2-2',
      image_url: 'https://rahzhfgbmromdhfhunff.supabase.co/storage/v1/object/public/challenge-images/ai-generated/2026-05-19/21fdbfb1-9953-40a8-b6aa-e36e90df0131.jpg',
      answer: 'ai',
      difficulty: 5,
      set_order: 10,
      context_short: 'A quiet suburban street after rain, puddles reflecting the grey sky. Completely computed, every pixel artificial.',
      ai_prompt: 'A slightly blurry photo of a quiet suburban street after a light rain, puddles reflecting the grey sky, taken with a phone.',
      source_credit: 'AI Generated'
    }
  ],
  3: [ // reflection-3, set_order 11
    {
      id: 'fb-refl3-1',
      image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      answer: 'real',
      difficulty: 5,
      set_order: 11,
      context_short: 'A real deep space nebula captured by high-powered optical telescope. Perfectly organic chaos.',
      ai_prompt: null,
      source_credit: 'NASA / Unsplash',
      photographer_name: 'NASA',
      photographer_url: 'https://unsplash.com/@nasa',
      unsplash_url: 'https://unsplash.com/photos/starry-sky-photo'
    }
  ]
};

// Generates daily-changing, highly balanced challenges deterministically based on date seed
export function getDynamicFallbackChallenges(levelIndex: number, dateString: string): FallbackChallenge[] {
  // Dynamically select primary challenge set (level 0) from the 40-item pool!
  if (levelIndex === 0) {
    // Parse numeric seed from date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
    }
    let seed = Math.abs(hash);

    // Simple LCG PRNG for determinism
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Seeded Fisher-Yates shuffle
    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    };

    // Separate pools to guarantee perfect balance (at least 10 Real, 10 AI)
    const realPool = FALLBACK_POOL.filter(c => c.answer === 'real');
    const aiPool = FALLBACK_POOL.filter(c => c.answer === 'ai');

    const shuffledReal = shuffle(realPool);
    const shuffledAi = shuffle(aiPool);

    // Pick exactly 5 balanced challenges (either 3 Real + 2 AI or 2 Real + 3 AI)
    const realCount = random() > 0.5 ? 3 : 2;
    const aiCount = 5 - realCount;

    const selectedReal = shuffledReal.slice(0, realCount);
    const selectedAi = shuffledAi.slice(0, aiCount);

    const selectedSet = [...selectedReal, ...selectedAi];

    // Re-sort by difficulty ascending to satisfy pacing and soft warnings
    selectedSet.sort((a, b) => a.difficulty - b.difficulty);

    // Map set_order 1 to 20
    return selectedSet.map((c, idx) => ({
      ...c,
      set_order: idx + 1
    }));
  }

  // Fallback for reflection rounds (levelIndex 1, 2, 3) shuffles/re-maps order deterministically
  const rawReflection = FALLBACK_CHALLENGES[levelIndex] || [];
  let expectedOrders = [6, 7, 8];
  if (levelIndex === 2) expectedOrders = [9, 10];
  if (levelIndex === 3) expectedOrders = [11];

  return rawReflection.map((c, idx) => ({
    ...c,
    set_order: expectedOrders[idx] || c.set_order
  }));
}
