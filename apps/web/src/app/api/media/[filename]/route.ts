import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaStorage } from '@/lib/media-storage';

const SAFE_FILENAME_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif)$/i;

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!SAFE_FILENAME_REGEX.test(filename)) {
    return NextResponse.json({ message: 'Arquivo inválido.' }, { status: 400 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = EXT_TO_MIME[ext] ?? 'application/octet-stream';

  try {
    const storage = resolveMediaStorage();
    const data = await storage.read(filename);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Imagem não encontrada.' }, { status: 404 });
  }
}
