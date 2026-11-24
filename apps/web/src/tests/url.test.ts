import { describe, expect, it } from 'vitest';
import { getSafeHttpUrl, isValidHttpUrl } from '@/lib/url';

describe('url helpers — Validação estrita http:// e https://', () => {
  it('rejeita javascript:, data:, vbscript:, file: e strings malformadas', () => {
    const blockedPayloads = [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(document.cookie)',
      '   javascript:void(0)   ',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'data:image/svg+xml,<svg onload=alert(1)/>',
      'vbscript:msgbox("xss")',
      'file:///etc/passwd',
      'file:///C:/Windows/System32/drivers/etc/hosts',
      'ftp://files.example.com/archive.zip',
      '/rota-relativa/interna',
      'http://url com espaco.com/noticia',
      '',
      '   ',
      null,
      undefined,
    ];

    for (const payload of blockedPayloads) {
      expect(isValidHttpUrl(payload)).toBe(false);
      expect(getSafeHttpUrl(payload)).toBeNull();
    }
  });

  it('aceita exclusivamente http:// e https:// e normaliza espaços nas extremidades', () => {
    expect(isValidHttpUrl('https://www.gematsu.com/tag/capcom')).toBe(true);
    expect(isValidHttpUrl('http://localhost:8080/api/v1/home')).toBe(true);
    expect(getSafeHttpUrl('  https://www.theverge.com/tech  ')).toBe(
      'https://www.theverge.com/tech',
    );
  });
});
