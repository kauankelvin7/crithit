import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, isAllowedOrigin } from '@/lib/bff-utils';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: 'Origem não autorizada para upload.' }, { status: 403 });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Sessão editorial expirada ou ausente.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Nenhum arquivo de imagem enviado.' }, { status: 400 });
    }

    const ext = ALLOWED_MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { message: 'Formato não suportado. Use JPG, PNG, WebP ou AVIF.' },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: 'A imagem deve ter no máximo 5 MB.' },
        { status: 400 },
      );
    }

    const uploadDir = path.join(os.tmpdir(), 'crithit-uploads');
    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const targetPath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, buffer);

    const origin = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, '');
    const url = `${origin}/api/media/${filename}`;

    return NextResponse.json(
      {
        url,
        filename,
        mimeType: file.type,
        size: file.size,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Erro ao processar o envio da imagem de capa.' },
      { status: 500 },
    );
  }
}
