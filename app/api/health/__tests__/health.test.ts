import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-server';

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: vi.fn(),
}));

describe('Health Check API Endpoint', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup healthy environment variables by default
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GEMINI_API_KEY = 'gemini-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns 200 and healthy status when database is fully connected and env is complete', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null });
    const mockFrom = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelect }) });
    
    vi.mocked(getSupabase).mockReturnValue({ from: mockFrom } as any);
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as any);

    const req = new Request('http://localhost/api/health');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.diagnostics.database.anon_client.status).toBe('connected');
    expect(body.diagnostics.database.admin_client.status).toBe('connected');
    expect(body.diagnostics.env.GEMINI_API_KEY).toBe('present');
  });

  it('returns 200 and degraded status when admin database query fails', async () => {
    const mockSelectSuccess = vi.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null });
    const mockFromSuccess = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelectSuccess }) });

    const mockSelectFail = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database query failed' } });
    const mockFromFail = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelectFail }) });

    vi.mocked(getSupabase).mockReturnValue({ from: mockFromSuccess } as any);
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFromFail } as any);

    const req = new Request('http://localhost/api/health');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.diagnostics.database.anon_client.status).toBe('connected');
    expect(body.diagnostics.database.admin_client.status).toBe('disconnected');
    expect(body.diagnostics.database.admin_client.error).toBe('Database query failed');
  });

  it('returns 503 and unhealthy status when anon database query fails', async () => {
    const mockSelectSuccess = vi.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null });
    const mockFromSuccess = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelectSuccess }) });

    const mockSelectFail = vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection timeout' } });
    const mockFromFail = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelectFail }) });

    vi.mocked(getSupabase).mockReturnValue({ from: mockFromFail } as any);
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFromSuccess } as any);

    const req = new Request('http://localhost/api/health');
    const res = await GET(req as any);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('unhealthy');
    expect(body.diagnostics.database.anon_client.status).toBe('disconnected');
    expect(body.diagnostics.database.anon_client.error).toBe('Connection timeout');
  });

  it('returns 200 and degraded status when critical env variables are missing', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null });
    const mockFrom = vi.fn().mockReturnValue({ select: () => ({ limit: mockSelect }) });
    
    vi.mocked(getSupabase).mockReturnValue({ from: mockFrom } as any);
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as any);

    // Delete a critical environment variable
    delete process.env.GEMINI_API_KEY;

    const req = new Request('http://localhost/api/health');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.diagnostics.env.GEMINI_API_KEY).toBe('missing');
  });
});
