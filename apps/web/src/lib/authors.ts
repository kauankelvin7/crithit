export type AvatarVariantKey =
  | 'avatar-byte'
  | 'avatar-tinta'
  | 'avatar-sakuga'
  | 'avatar-frame';

const AUTHOR_AVATAR_MAP: Record<string, AvatarVariantKey> = {
  'rafael mendes': 'avatar-byte',
  'marina costa': 'avatar-tinta',
  'lucas andrade': 'avatar-sakuga',
  'camila rocha': 'avatar-frame',
  'thiago sato': 'avatar-sakuga',
  'redação crithit!': 'avatar-byte',
};

const AVATAR_VARIANTS: readonly AvatarVariantKey[] = [
  'avatar-byte',
  'avatar-tinta',
  'avatar-sakuga',
  'avatar-frame',
] as const;

/**
 * Mapeamento determinístico e único de autor -> avatar HQ compartilhado
 * entre a Home, o Leitor de Matéria e qualquer card editorial.
 */
export function resolveAuthorAvatar(authorName: string): AvatarVariantKey {
  const normalized = authorName.trim().toLowerCase();
  if (normalized in AUTHOR_AVATAR_MAP) {
    return AUTHOR_AVATAR_MAP[normalized];
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
}
