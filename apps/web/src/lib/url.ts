/**
 * Validação defensiva estrita para URLs externas (sourceUrl, coverImageUrl, RSS).
 * Aceita exclusivamente os protocolos http:// e https://.
 */
export function isValidHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSafeHttpUrl(value: string | null | undefined): string | null {
  if (!isValidHttpUrl(value)) return null;
  return value!.trim();
}
