import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

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
  const filePath = path.join(os.tmpdir(), 'crithit-uploads', filename);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
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
