import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

interface RevalidatePayload {
  slug?: string;
  tags?: string[];
  paths?: string[];
}

export async function POST(request: NextRequest) {
  const configuredSecret =
    process.env.REVALIDATE_SECRET || 'crithit-dev-revalidate-secret-change-me';
  const providedSecret = request.headers.get('x-revalidate-secret');

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ message: 'Segredo de revalidação inválido.' }, { status: 401 });
  }

  let body: RevalidatePayload = {};
  try {
    body = (await request.json()) as RevalidatePayload;
  } catch {
    // Corpo vazio revalida feeds globais
  }

  const tagsToRevalidate = new Set<string>(['home', 'home-feed', 'reels', 'reels-feed', 'articles-list']);
  const pathsToRevalidate = new Set<string>(['/', '/reels']);

  if (body.slug && typeof body.slug === 'string') {
    tagsToRevalidate.add(`article:${body.slug}`);
    pathsToRevalidate.add(`/noticia/${body.slug}`);
  }

  if (Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        tagsToRevalidate.add(tag.trim());
      }
    }
  }

  if (Array.isArray(body.paths)) {
    for (const p of body.paths) {
      if (typeof p === 'string' && p.startsWith('/')) {
        pathsToRevalidate.add(p);
      }
    }
  }

  for (const tag of tagsToRevalidate) {
    revalidateTag(tag);
  }
  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tags: Array.from(tagsToRevalidate),
    paths: Array.from(pathsToRevalidate),
    timestamp: new Date().toISOString(),
  });
}
