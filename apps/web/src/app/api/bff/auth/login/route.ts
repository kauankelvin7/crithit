import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import { isAllowedOrigin, setAuthCookies } from '@/lib/bff-utils';

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ message: 'Payload JSON inválido.' }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { message: 'Informe e-mail e senha para autenticar.' },
      { status: 400 },
    );
  }

  const baseUrl = getApiBaseUrl();
  try {
    const upstream = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: body.email, password: body.password }),
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
      return NextResponse.json(
        { message: data.message || 'Credenciais inválidas.' },
        { status: upstream.status === 200 ? 401 : upstream.status },
      );
    }

    const response = NextResponse.json({ user: data.user }, { status: 200 });
    setAuthCookies(response, data.accessToken, data.refreshToken, data.expiresInSeconds ?? 900);
    return response;
  } catch {
    return NextResponse.json(
      { message: 'Serviço de autenticação indisponível no momento.' },
      { status: 503 },
    );
  }
}
