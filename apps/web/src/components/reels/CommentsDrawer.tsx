'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, MessageSquare, Send, X } from 'lucide-react';
import {
  fetchArticleComments,
  MAX_COMMENT_BODY_LENGTH,
  postArticleComment,
  validateCommentInput,
} from '@/lib/comments-api';
import { formatRelativeDate } from '@/lib/format';
import type { CommentDto } from '@/lib/types';

interface CommentsDrawerProps {
  open: boolean;
  articleId: string;
  articleHeadline: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onCommentAdded: (created?: CommentDto) => void;
}

export function CommentsDrawer({
  open,
  articleId,
  articleHeadline,
  triggerRef,
  onClose,
  onCommentAdded,
}: CommentsDrawerProps) {
  const titleId = useId();
  const errorId = useId();
  const authorId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Carrega comentários ao abrir
  useEffect(() => {
    if (!open || !articleId) return;
    let active = true;
    setLoading(true);
    setError('');

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
  }, [open, articleId]);

  // Focus trap + Escape devolvendo foco ao botão acionador
  useEffect(() => {
    if (!open) return;

    const prevFocused = triggerRef.current;
    closeBtnRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocused?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

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
    onCommentAdded(result.comment);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border-2 border-border-strong bg-surface text-ink-primary shadow-hard sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b-2 border-border-strong bg-surface-alt px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquare className="h-5 w-5 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
            <div className="min-w-0">
              <h2 id={titleId} className="font-headline text-xl font-extrabold uppercase tracking-tight">
                Comentários
              </h2>
              <p className="truncate font-mono text-[11px] text-ink-muted">{articleHeadline}</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar comentários"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border-subtle bg-surface text-ink-primary hover:bg-surface-hover"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Lista de comentários */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className="font-mono text-xs text-ink-muted">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="py-6 text-center font-reading text-sm text-ink-secondary">
              Nenhum comentário ainda. Seja o primeiro a participar da discussão.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded border border-border-subtle bg-surface-alt p-3"
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
              </div>
            ))
          )}
        </div>

        {/* Formulário de novo comentário */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3 border-t-2 border-border-strong bg-surface-alt p-4"
        >
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

          <div>
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
              rows={3}
              maxLength={MAX_COMMENT_BODY_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              placeholder="Compartilhe sua análise sobre esta notícia..."
              className="w-full resize-none rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm text-ink-primary placeholder:text-ink-placeholder"
            />
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

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-4 py-2.5 font-sans text-sm font-bold text-white shadow-hard-sm transition-colors hover:opacity-95 disabled:opacity-60"
          >
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {submitting ? 'Publicando...' : 'Publicar comentário'}
          </button>
        </form>
      </div>
    </div>
  );
}
