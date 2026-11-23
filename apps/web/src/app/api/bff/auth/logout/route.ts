import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import { ACCESS_TOKEN_COOKIE, clearAuthCookies, isAllowedOrigin } from '@/lib/bff-utils';

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/admin/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });
    } catch {
      // Limpa os cookies locais mesmo se a API estiver temporariamente inacessível
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
