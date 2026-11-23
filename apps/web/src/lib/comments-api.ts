import { MOCK_COMMENTS } from './mock-data';
import type { CommentDto } from './types';

export const MAX_COMMENT_BODY_LENGTH = 500;

export function validateCommentInput(
  authorDisplayName: string,
  body: string,
): { valid: true; cleanName: string; cleanBody: string } | { valid: false; message: string } {
  const cleanName = authorDisplayName.trim();
  const cleanBody = body.trim();

  if (cleanName.length < 2) {
    return {
      valid: false,
      message: 'Informe um nome de exibição com pelo menos 2 caracteres.',
    };
  }

  if (cleanBody.length < 3 || cleanBody.length > MAX_COMMENT_BODY_LENGTH) {
    return {
      valid: false,
      message: `O comentário deve ter entre 3 e ${MAX_COMMENT_BODY_LENGTH} caracteres.`,
    };
  }

  return { valid: true, cleanName, cleanBody };
}

export async function fetchArticleComments(articleId: string): Promise<CommentDto[]> {
  try {
    const res = await fetch(`/api/public/articles/${encodeURIComponent(articleId)}/comments?size=20`);
    if (!res.ok) throw new Error('fallback');
    const data = (await res.json()) as { content?: CommentDto[] };
    return data.content ?? [];
  } catch {
    return MOCK_COMMENTS[articleId] ?? [];
  }
}

export async function postArticleComment(
  articleId: string,
  cleanName: string,
  cleanBody: string,
): Promise<{ ok: true; comment: CommentDto } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/public/articles/${encodeURIComponent(articleId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorDisplayName: cleanName, body: cleanBody }),
    });

    if (res.ok) {
      const created = (await res.json()) as CommentDto;
      return { ok: true, comment: created };
    }

    if (res.status === 503) {
      return {
        ok: true,
        comment: {
          id: `local-${Date.now()}`,
          articleId,
          authorDisplayName: cleanName,
          body: cleanBody,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const errData = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, message: errData.message || 'Não foi possível enviar o comentário.' };
  } catch {
    return { ok: false, message: 'Falha de conexão ao publicar comentário.' };
  }
}
