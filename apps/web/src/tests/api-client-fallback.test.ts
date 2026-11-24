import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHomeData, isMockFallbackEnabled } from '@/lib/api-client';

describe('isMockFallbackEnabled — Controle de fallback em produção vs desenvolvimento', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('desativa o fallback de mock-data.ts por padrão quando NODE_ENV === "production"', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_MOCK_FALLBACK', '');

    expect(isMockFallbackEnabled()).toBe(false);
  });

  it('permite habilitar o fallback em produção apenas quando ENABLE_MOCK_FALLBACK="true" ou "1"', () => {
    vi.stubEnv('NODE_ENV', 'production');

    vi.stubEnv('ENABLE_MOCK_FALLBACK', 'true');
    expect(isMockFallbackEnabled()).toBe(true);

    vi.stubEnv('ENABLE_MOCK_FALLBACK', '1');
    expect(isMockFallbackEnabled()).toBe(true);

    vi.stubEnv('ENABLE_MOCK_FALLBACK', 'false');
    expect(isMockFallbackEnabled()).toBe(false);
  });

  it('propaga erro de API em produção quando o fallback está desativado em vez de exibir notícias fictícias', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_MOCK_FALLBACK', '');
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

    await expect(fetchHomeData()).rejects.toThrow('Connection refused');
  });
});
