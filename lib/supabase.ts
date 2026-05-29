import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('[supabase] Warning: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Database connections will be disabled.');
      // Instantiate a safe placeholder client to prevent compilation type crashes and unhandled throws
      _client = createClient('https://placeholder-anon.supabase.co', 'placeholder-anon-key');
    } else {
      _client = createClient(url, key);
    }
  }
  return _client;
}
