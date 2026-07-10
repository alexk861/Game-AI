import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  // 1. Check database connectivity using the public anon client
  let anonDbSuccess = false;
  let anonDbError: string | null = null;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('challenges').select('id').limit(1);
    if (error) {
      anonDbError = error.message;
    } else {
      anonDbSuccess = true;
    }
  } catch (err: any) {
    anonDbError = err?.message || String(err);
  }

  // 2. Check database connectivity using the admin client
  let adminDbSuccess = false;
  let adminDbError: string | null = null;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('challenges').select('id').limit(1);
    if (error) {
      adminDbError = error.message;
    } else {
      adminDbSuccess = true;
    }
  } catch (err: any) {
    adminDbError = err?.message || String(err);
  }

  // 3. Inspect status of key environment variables
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'present' : 'missing',
  };

  // Determine overall status
  // - unhealthy: The main public database client is failing (user facing app cannot function)
  // - degraded: The public client works, but the admin client fails or some critical env vars are missing
  // - healthy: Both clients work and all critical env vars are present
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (!anonDbSuccess) {
    status = 'unhealthy';
  } else if (!adminDbSuccess || Object.values(env).includes('missing')) {
    status = 'degraded';
  }

  const responseBody = {
    status,
    timestamp,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    diagnostics: {
      database: {
        anon_client: {
          status: anonDbSuccess ? 'connected' : 'disconnected',
          error: anonDbError,
        },
        admin_client: {
          status: adminDbSuccess ? 'connected' : 'disconnected',
          error: adminDbError,
        },
      },
      env,
      system: {
        node_version: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
    },
  };

  const statusCode = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(responseBody, { status: statusCode });
}
