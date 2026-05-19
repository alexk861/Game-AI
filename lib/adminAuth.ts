import { NextRequest } from 'next/server';

export function isAdminAuthorized(request: NextRequest | Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export function isCronAuthorized(request: NextRequest | Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}
