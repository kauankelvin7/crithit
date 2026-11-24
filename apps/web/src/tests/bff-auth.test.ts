import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as loginPost } from '@/app/api/bff/auth/login/route';
import { POST as logoutPost } from '@/app/api/bff/auth/logout/route';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/bff-utils';

describe('BFF Auth Route Handlers (/api/bff/auth/login e /api/bff/auth/logout)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('grava accessToken e refreshToken exclusivamente em cookies HttpOnly e nunca os expõe no JSON do login', async () => {
    const fakeAccessToken = 'eyJhbGciOiJIUzI1NiJ9.secret-access-token.signature';
    const fakeRefreshToken = 'eyJhbGciOiJIUzI1NiJ9.secret-refresh-token.signature';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: fakeAccessToken,
          refreshToken: fakeRefreshToken,
          expiresInSeconds: 900,
          user: {
            id: 'admin-1',
            email: 'admin@crithit.com.br',
            displayName: 'Editor-Chefe',
            role: 'ROLE_ADMIN',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const req = new NextRequest('http://localhost:3000/api/bff/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ email: 'admin@crithit.com.br', password: 'ChangeMe123!' }),
    });

    const res = await loginPost(req);
    const jsonBody = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    // O JSON retornado ao browser NÃO pode conter accessToken nem refreshToken
    expect(jsonBody).not.toHaveProperty('accessToken');
    expect(jsonBody).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(jsonBody)).not.toContain(fakeAccessToken);
    expect(JSON.stringify(jsonBody)).not.toContain(fakeRefreshToken);
    expect(jsonBody).toHaveProperty('user');

    // Cookies HttpOnly presentes na resposta
    const accessCookie = res.cookies.get(ACCESS_TOKEN_COOKIE);
    const refreshCookie = res.cookies.get(REFRESH_TOKEN_COOKIE);
    expect(accessCookie?.value).toBe(fakeAccessToken);
    expect(refreshCookie?.value).toBe(fakeRefreshToken);

    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    expect(setCookieHeader.toLowerCase()).toContain('httponly');
    expect(setCookieHeader.toLowerCase()).toContain('samesite=lax');
  });

  it('remove os cookies HttpOnly no logout limpando a sessão local', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }));

    const req = new NextRequest('http://localhost:3000/api/bff/auth/logout', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: `${ACCESS_TOKEN_COOKIE}=token-ativo; ${REFRESH_TOKEN_COOKIE}=refresh-ativo`,
      },
    });

    const res = await logoutPost(req);
    const jsonBody = (await res.json()) as { ok?: boolean };

    expect(res.status).toBe(200);
    expect(jsonBody.ok).toBe(true);
    expect(res.cookies.get(ACCESS_TOKEN_COOKIE)?.value).toBe('');
    expect(res.cookies.get(REFRESH_TOKEN_COOKIE)?.value).toBe('');
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
