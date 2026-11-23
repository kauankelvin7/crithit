import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  isAllowedOrigin,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/lib/bff-utils';

async function forwardAdminRequest(
  request: NextRequest,
  pathSegments: string[],
  token: string,
  bodyText: string | undefined,
): Promise<Response> {
  const safePath = pathSegments.map((s) => encodeURIComponent(s)).join('/');
  const query = request.nextUrl.search;
  const targetUrl = `${getApiBaseUrl()}/api/v1/admin/${safePath}${query}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: bodyText,
    cache: 'no-store',
  });
}

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  }

  const { path } = await context.params;
  if (!path || path.length === 0) {
    return NextResponse.json({ message: 'Caminho administrativo inválido.' }, { status: 400 });
  }

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
  const bodyText = hasBody ? await request.text() : undefined;

  let refreshedTokens: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds?: number;
  } | null = null;

  const tryRefresh = async () => {
    if (!refreshToken) return null;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresInSeconds?: number;
    };
  };

  try {
    if (!accessToken && refreshToken) {
      refreshedTokens = await tryRefresh();
      if (!refreshedTokens) {
        const res = NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
        clearAuthCookies(res);
        return res;
      }
      accessToken = refreshedTokens.accessToken;
    }

    let upstream = await forwardAdminRequest(request, path, accessToken!, bodyText);

    if (upstream.status === 401 && refreshToken && !refreshedTokens) {
      refreshedTokens = await tryRefresh();
      if (refreshedTokens) {
        accessToken = refreshedTokens.accessToken;
        upstream = await forwardAdminRequest(request, path, accessToken, bodyText);
      } else {
        const res = NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
        clearAuthCookies(res);
        return res;
      }
    }

    const responseText = await upstream.text();
    const response = new NextResponse(responseText || null, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });

    if (refreshedTokens) {
      setAuthCookies(
        response,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken,
        refreshedTokens.expiresInSeconds ?? 900,
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Falha ao comunicar com a API editorial.' },
      { status: 503 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
