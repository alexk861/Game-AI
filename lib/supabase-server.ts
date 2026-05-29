import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY — never import this from client components
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('[supabase-server] Warning: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin operations will be disabled.');
      // Instantiate a safe placeholder admin client to prevent compilation type crashes
      _admin = createClient('https://placeholder-admin.supabase.co', 'placeholder-admin-key');
    } else {
      _admin = createClient(url, key);
    }
  }
  return _admin;
}
