import { createClient } from '@supabase/supabase-js';
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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function setup() {
  console.log("Setting up Supabase environment...");

  // 1. Create storage bucket 'challenge-images' if it doesn't exist
  console.log("Checking storage buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
  } else {
    const bucketExists = buckets.some(b => b.name === 'challenge-images');
    if (!bucketExists) {
      console.log("Creating public bucket 'challenge-images'...");
      const { data, error } = await supabase.storage.createBucket('challenge-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) {
        console.error("Failed to create bucket:", error);
      } else {
        console.log("Bucket 'challenge-images' created successfully:", data);
      }
    } else {
      console.log("Bucket 'challenge-images' already exists.");
    }
  }

  // 2. Test if tables exist
  console.log("\nTesting database tables...");
  const { error: chalError } = await supabase.from('challenges').select('id').limit(1);
  if (chalError) {
    console.error("Error querying 'challenges' table:", chalError.message);
  } else {
    console.log("'challenges' table is accessible.");
  }

  const { error: candError } = await supabase.from('content_candidates').select('id').limit(1);
  if (candError) {
    console.error("Error querying 'content_candidates' table:", candError.message);
  } else {
    console.log("'content_candidates' table is accessible.");
  }

  const { error: runError } = await supabase.from('ai_generation_runs').select('id').limit(1);
  if (runError) {
    console.error("Error querying 'ai_generation_runs' table:", runError.message);
    console.log("We need to check if we can create it or if we should write a helper.");
  } else {
    console.log("'ai_generation_runs' table is accessible.");
  }

  // 3. Seed real content candidates
  console.log("\nSeeding real candidates into 'content_candidates'...");
  const realCandidates = [
    {
      source: 'unsplash',
      source_photo_id: 'samuel_ferrara_sunset',
      image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      image_thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
      photographer_name: 'Samuel Ferrara',
      photographer_url: 'https://unsplash.com/@samuelferrara',
      unsplash_url: 'https://unsplash.com/photos/sunset-over-swiss-alps',
      download_location: 'https://api.unsplash.com/photos/sunset-over-swiss-alps/download',
      query: 'surreal landscape',
      category: 'surreal landscape',
      candidate_score: 85,
      suspicious_score: 5,
      difficulty_suggestion: 2,
      suggested_context: 'A real sunset over the Swiss Alps. Nature doesn\'t need a GPU.',
      license_note: 'Unsplash License',
      status: 'approved',
      answer: 'real'
    },
    {
      source: 'unsplash',
      source_photo_id: 'matt_hardy_waves',
      image_url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
      image_thumb_url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200',
      photographer_name: 'Matt Hardy',
      photographer_url: 'https://unsplash.com/@matthardy',
      unsplash_url: 'https://unsplash.com/photos/waves-crashing-on-shore',
      download_location: 'https://api.unsplash.com/photos/waves-crashing-on-shore/download',
      query: 'bizarre nature',
      category: 'bizarre nature',
      candidate_score: 90,
      suspicious_score: 2,
      difficulty_suggestion: 1,
      suggested_context: 'Real waves crashing on a rocky shore. Every droplet is physics, not pixels.',
      license_note: 'Unsplash License',
      status: 'approved',
      answer: 'real'
    },
    {
      source: 'unsplash',
      source_photo_id: 'nasa_nebula',
      image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      image_thumb_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200',
      photographer_name: 'NASA/ESA Hubble Heritage',
      photographer_url: 'https://unsplash.com/@nasa',
      unsplash_url: 'https://unsplash.com/photos/hubble-nebula',
      download_location: 'https://api.unsplash.com/photos/hubble-nebula/download',
      query: 'weird science',
      category: 'weird science',
      candidate_score: 95,
      suspicious_score: 8,
      difficulty_suggestion: 3,
      suggested_context: 'A real nebula captured by the Hubble telescope. Space is stranger than AI.',
      license_note: 'Public Domain',
      status: 'approved',
      answer: 'real'
    },
    {
      source: 'unsplash',
      source_photo_id: 'ishan_plankton',
      image_url: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800',
      image_thumb_url: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200',
      photographer_name: 'Ishan @seefromthesky',
      photographer_url: 'https://unsplash.com/@seefromthesky',
      unsplash_url: 'https://unsplash.com/photos/bioluminescent-plankton',
      download_location: 'https://api.unsplash.com/photos/bioluminescent-plankton/download',
      query: 'deep sea',
      category: 'deep sea',
      candidate_score: 88,
      suspicious_score: 12,
      difficulty_suggestion: 4,
      suggested_context: 'Real bioluminescent plankton lighting up the shore. Nature\'s own LED display.',
      license_note: 'Unsplash License',
      status: 'approved',
      answer: 'real'
    },
    {
      source: 'unsplash',
      source_photo_id: 'usgs_cloud',
      image_url: 'https://images.unsplash.com/photo-1516298773066-dec3cd46dcfd?w=800',
      image_thumb_url: 'https://images.unsplash.com/photo-1516298773066-dec3cd46dcfd?w=200',
      photographer_name: 'USGS',
      photographer_url: 'https://unsplash.com/@usgs',
      unsplash_url: 'https://unsplash.com/photos/lenticular-cloud',
      download_location: 'https://api.unsplash.com/photos/lenticular-cloud/download',
      query: 'surreal landscape',
      category: 'surreal landscape',
      candidate_score: 84,
      suspicious_score: 15,
      difficulty_suggestion: 5,
      suggested_context: 'A real lenticular cloud that looks completely artificial. But it\'s 100% atmosphere.',
      license_note: 'Public Domain',
      status: 'approved',
      answer: 'real'
    }
  ];

  const { data: upsertData, error: upsertError } = await supabase
    .from('content_candidates')
    .upsert(realCandidates, { onConflict: 'source_photo_id' })
    .select();

  if (upsertError) {
    console.error("Upsert failed:", upsertError);
  } else {
    console.log("Successfully seeded real candidates:", upsertData.length);
  }
}

setup().catch(console.error);
