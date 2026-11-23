import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/lib/bff-utils';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const baseUrl = getApiBaseUrl();

  if (accessToken) {
    try {
      const upstream = await fetch(`${baseUrl}/api/v1/admin/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (upstream.ok) {
        const user = await upstream.json();
        return NextResponse.json({ user }, { status: 200 });
      }
    } catch {
      return NextResponse.json({ message: 'API indisponível.' }, { status: 503 });
    }
  }

  if (refreshToken) {
    try {
      const refreshUpstream = await fetch(`${baseUrl}/api/v1/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (refreshUpstream.ok) {
        const data = (await refreshUpstream.json()) as {
          accessToken: string;
          refreshToken: string;
          expiresInSeconds?: number;
          user: unknown;
        };
        const response = NextResponse.json({ user: data.user }, { status: 200 });
        setAuthCookies(response, data.accessToken, data.refreshToken, data.expiresInSeconds ?? 900);
        return response;
      }
    } catch {
      return NextResponse.json({ message: 'API indisponível.' }, { status: 503 });
    }
  }

  const unauth = NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  clearAuthCookies(unauth);
  return unauth;
}
