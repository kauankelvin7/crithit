import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface StoredMediaResult {
  filename: string;
  publicPath: string;
  mimeType: string;
  size: number;
}

export interface MediaStorageAdapter {
  save(buffer: Buffer, ext: string, mimeType: string): Promise<StoredMediaResult>;
  read(filename: string): Promise<Buffer>;
}

const LOCAL_UPLOAD_DIR = path.join(os.tmpdir(), 'crithit-uploads');

/**
 * Armazenamento local temporário indicado para desenvolvimento ou instância única.
 * Em produção escalada, substituir por adaptador S3 / Cloudflare R2 / GCS implementando MediaStorageAdapter.
 */
class LocalTempMediaStorage implements MediaStorageAdapter {
  async save(buffer: Buffer, ext: string, mimeType: string): Promise<StoredMediaResult> {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const targetPath = path.join(LOCAL_UPLOAD_DIR, filename);
    await writeFile(targetPath, buffer);
    return {
      filename,
      publicPath: `/api/media/${filename}`,
      mimeType,
      size: buffer.length,
    };
  }

  async read(filename: string): Promise<Buffer> {
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    return readFile(filePath);
  }
}

const localStorageInstance = new LocalTempMediaStorage();

export function resolveMediaStorage(): MediaStorageAdapter {
  const driver = (process.env.MEDIA_STORAGE_DRIVER || 'local').trim().toLowerCase();
  if (driver === 'local') {
    return localStorageInstance;
  }
  throw new Error(
    `MEDIA_STORAGE_DRIVER="${driver}" ainda não possui adaptador configurado. Configure S3/R2 ou utilize "local".`,
  );
}
