import { NextRequest, NextResponse } from 'next/server';

export const ACCESS_TOKEN_COOKIE = 'crithit_access_token';
export const REFRESH_TOKEN_COOKIE = 'crithit_refresh_token';

export function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresInSeconds = 900,
): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, buildCookieOptions(expiresInSeconds));
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, buildCookieOptions(60 * 60 * 24 * 7));
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', buildCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', buildCookieOptions(0));
}

/**
 * Validação básica CSRF (Origin / Referer) para métodos mutáveis no BFF.
 */
export function isAllowedOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!origin && !referer) {
    return true;
  }

  const checkHeader = origin || referer;
  if (!checkHeader || !host) return false;

  try {
    const parsed = new URL(checkHeader);
    return parsed.host === host;
  } catch {
    return false;
  }
}
