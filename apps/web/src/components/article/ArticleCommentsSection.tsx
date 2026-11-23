'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { AlertCircle, MessageSquare, Send } from 'lucide-react';
import {
  fetchArticleComments,
  MAX_COMMENT_BODY_LENGTH,
  postArticleComment,
  validateCommentInput,
} from '@/lib/comments-api';
import { formatRelativeDate } from '@/lib/format';
import type { CommentDto } from '@/lib/types';

interface ArticleCommentsSectionProps {
  articleId: string;
  initialCount: number;
}

export function ArticleCommentsSection({
  articleId,
  initialCount,
}: ArticleCommentsSectionProps) {
  const headingId = useId();
  const authorId = useId();
  const bodyId = useId();
  const errorId = useId();

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchArticleComments(articleId)
      .then((list) => {
        if (active) setComments(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [articleId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateCommentInput(authorDisplayName, body);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await postArticleComment(articleId, validation.cleanName, validation.cleanBody);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setComments((prev) => [result.comment, ...prev]);
    setBody('');
  };

  const totalDisplay = Math.max(initialCount, comments.length);

  return (
    <section
      aria-labelledby={headingId}
      className="mt-8 rounded-lg border-2 border-border-strong bg-surface-alt p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand" strokeWidth={2} aria-hidden="true" />
          <h2
            id={headingId}
            className="font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary"
          >
            Comentários da Comunidade
          </h2>
        </div>
        <span className="rounded bg-surface px-2.5 py-0.5 font-mono text-xs font-bold text-ink-secondary">
          {totalDisplay}
        </span>
      </div>

      {/* Formulário inline */}
      <form onSubmit={handleSubmit} noValidate className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor={authorId}
              className="mb-1 block font-mono text-[11px] font-bold uppercase text-ink-secondary"
            >
              Seu nome
            </label>
            <input
              id={authorId}
              type="text"
              maxLength={60}
              value={authorDisplayName}
              onChange={(e) => setAuthorDisplayName(e.target.value)}
              placeholder="Ex.: Lucas M."
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary placeholder:text-ink-placeholder"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor={bodyId}
                className="font-mono text-[11px] font-bold uppercase text-ink-secondary"
              >
                Comentário
              </label>
              <span className="font-mono text-[11px] text-ink-muted">
                {body.length}/{MAX_COMMENT_BODY_LENGTH}
              </span>
            </div>
            <textarea
              id={bodyId}
              rows={2}
              maxLength={MAX_COMMENT_BODY_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              placeholder="Deixe sua análise sobre esta pauta..."
              className="w-full resize-none rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm text-ink-primary placeholder:text-ink-placeholder"
            />
          </div>
        </div>

        {error && (
          <div
            id={errorId}
            role="alert"
            className="flex items-center gap-2 rounded px-3 py-2 font-sans text-xs font-medium"
            style={{
              backgroundColor: 'var(--status-error-soft)',
              color: 'var(--ink-on-error-soft)',
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="tactile-btn inline-flex items-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-4 py-2 font-sans text-sm font-bold text-white shadow-hard-sm hover:opacity-95 disabled:opacity-60"
          >
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {submitting ? 'Publicando...' : 'Publicar comentário'}
          </button>
        </div>
      </form>

      {/* Lista de comentários */}
      {loading ? (
        <p className="font-mono text-xs text-ink-muted">Carregando comentários...</p>
      ) : comments.length === 0 ? (
        <p className="rounded border border-dashed border-border-subtle bg-surface p-5 text-center font-reading text-sm text-ink-secondary">
          Nenhum comentário publicado ainda. Seja o primeiro leitor a comentar.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded border border-border-subtle bg-surface p-3.5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-ink-primary">
                  {comment.authorDisplayName}
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {formatRelativeDate(comment.createdAt)}
                </span>
              </div>
              <p className="font-reading text-sm leading-relaxed text-ink-secondary">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
