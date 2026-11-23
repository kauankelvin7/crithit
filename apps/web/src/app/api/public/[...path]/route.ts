import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';
import { isAllowedOrigin } from '@/lib/bff-utils';

async function handlePublicProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  }

  const { path } = await context.params;
  if (!path || path.length === 0) {
    return NextResponse.json({ message: 'Rota pública inválida.' }, { status: 400 });
  }

  const safePath = path.map((s) => encodeURIComponent(s)).join('/');
  const query = request.nextUrl.search;
  const targetUrl = `${getApiBaseUrl()}/api/v1/${safePath}${query}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  const visitorHeader = request.headers.get('x-visitor-id');
  if (visitorHeader) headers['X-Visitor-Id'] = visitorHeader;

  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
  const bodyText = hasBody ? await request.text() : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyText,
      cache: 'no-store',
    });

    const text = await upstream.text();
    const response = new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });

    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'API indisponível no momento.' },
      { status: 503 },
    );
  }
}

export const GET = handlePublicProxy;
export const POST = handlePublicProxy;
