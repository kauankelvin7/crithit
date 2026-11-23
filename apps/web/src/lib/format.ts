import type { AdminArticleUpsertRequest } from './types';
import { isValidHttpUrl } from './url';

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Agora';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `Há ${diffDays}d`;

  return formatFullDate(isoDate);
}

export function formatFullDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  return String(value);
}

export interface ArticleValidationErrors {
  headline?: string;
  lead?: string;
  bodyParagraphs?: string;
  reelsSummary?: string;
  authorName?: string;
  sourceName?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
}

export function validateAdminArticleForm(
  data: Partial<AdminArticleUpsertRequest>,
): ArticleValidationErrors {
  const errors: ArticleValidationErrors = {};

  if (!data.headline || data.headline.trim().length < 5) {
    errors.headline = 'A manchete deve ter pelo menos 5 caracteres.';
  }

  if (!data.lead || data.lead.trim().length < 20) {
    errors.lead = 'O lead deve ter pelo menos 20 caracteres.';
  }

  const paragraphs = (data.bodyParagraphs ?? []).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length < 1) {
    errors.bodyParagraphs = 'Informe ao menos um parágrafo no corpo da matéria.';
  }

  if (!data.reelsSummary || data.reelsSummary.trim().length < 20) {
    errors.reelsSummary = 'O resumo para Reels deve ter entre 20 e 320 caracteres.';
  } else if (data.reelsSummary.trim().length > 320) {
    errors.reelsSummary = 'O resumo para Reels não pode exceder 320 caracteres.';
  }

  if (!data.authorName || data.authorName.trim().length < 2) {
    errors.authorName = 'Nome do autor é obrigatório (mínimo 2 caracteres).';
  }

  if (!data.sourceName || data.sourceName.trim().length < 2) {
    errors.sourceName = 'Nome da fonte é obrigatório (mínimo 2 caracteres).';
  }

  if (!data.sourceUrl || !isValidHttpUrl(data.sourceUrl)) {
    errors.sourceUrl = 'URL da fonte obrigatória e deve iniciar com http:// ou https://.';
  }

  if (data.coverImageUrl && data.coverImageUrl.trim().length > 0 && !isValidHttpUrl(data.coverImageUrl)) {
    errors.coverImageUrl = 'URL da imagem de capa deve iniciar com http:// ou https://.';
  }

  return errors;
}
