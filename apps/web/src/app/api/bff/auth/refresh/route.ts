import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import {
  clearAuthCookies,
  isAllowedOrigin,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/lib/bff-utils';

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    const res = NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    const data = (await upstream.json().catch(() => ({}))) as {
      accessToken?: string;
      refreshToken?: string;
      expiresInSeconds?: number;
      user?: unknown;
      message?: string;
    };

    if (!upstream.ok || !data.accessToken || !data.refreshToken) {
      const res = NextResponse.json(
        { message: data.message || 'Sessão expirada.' },
        { status: 401 },
      );
      clearAuthCookies(res);
      return res;
    }

    const response = NextResponse.json({ user: data.user }, { status: 200 });
    setAuthCookies(response, data.accessToken, data.refreshToken, data.expiresInSeconds ?? 900);
    return response;
  } catch {
    return NextResponse.json({ message: 'Serviço de autenticação indisponível.' }, { status: 503 });
  }
}
