'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  EyeOff,
  FileEdit,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import { EditorialCoverArt } from '@/components/EditorialCoverArt';
import { formatCompactNumber, formatFullDate } from '@/lib/format';
import type { AdminArticleSummary } from '@/lib/types';

export interface PublishedArticlesTabProps {
  articles: AdminArticleSummary[];
  busy?: boolean;
  onEdit: (articleId: string) => void;
  onPromoteMainHeadline: (articleId: string) => Promise<void> | void;
  onUnpublish: (articleId: string, reason?: string) => Promise<void> | void;
  onRepublish: (articleId: string) => Promise<void> | void;
}

export function PublishedArticlesTab({
  articles,
  busy = false,
  onEdit,
  onPromoteMainHeadline,
  onUnpublish,
  onRepublish,
}: PublishedArticlesTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');
  const [search, setSearch] = useState('');
  const [confirmUnpublishId, setConfirmUnpublishId] = useState<string | null>(null);
  const [unpublishReason, setUnpublishReason] = useState('');
  const cancelUnpublishBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmUnpublishId) {
      cancelUnpublishBtnRef.current?.focus();
    }
  }, [confirmUnpublishId]);

  const filtered = articles.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.headline.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.attribution.sourceName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm">
        <div role="group" aria-label="Filtrar por status editorial" className="flex items-center gap-2">
          {(['ALL', 'PUBLISHED', 'UNPUBLISHED'] as const).map((st) => {
            const active = statusFilter === st;
            const label =
              st === 'ALL' ? 'Todas' : st === 'PUBLISHED' ? 'Publicadas' : 'Retiradas do ar';
            return (
              <button
                key={st}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(st)}
                className={`rounded border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                  active
                    ? 'border-border-strong bg-highlight text-ink-highlight'
                    : 'border-border-subtle bg-surface-alt text-ink-secondary hover:border-border-strong'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filtrar matérias publicadas"
            placeholder="Filtrar por manchete ou slug..."
            className="w-full rounded border-2 border-border-input bg-surface py-1.5 pl-9 pr-3 font-sans text-sm text-ink-primary placeholder:text-ink-placeholder"
          />
        </div>
      </div>

      {/* Lista de Matérias */}
      {filtered.length === 0 ? (
        <div className="rounded border-2 border-border-strong bg-surface p-8 text-center">
          <p className="font-reading text-sm text-ink-secondary">
            Nenhuma matéria encontrada para o filtro atual.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isConfirming = confirmUnpublishId === item.id;
            const isPublished = item.status === 'PUBLISHED';

            return (
              <div
                key={item.id}
                className="rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded border-2 border-border-strong">
                      <EditorialCoverArt
                        coverImageUrl={item.coverImageUrl}
                        coverArtKey={item.coverArtKey}
                        category={item.category}
                        alt={item.headline}
                        aspectClass="h-full w-full"
                        compact
                        decorative
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={item.category} />
                      <span
                        className="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase"
                        style={{
                          backgroundColor: isPublished
                            ? 'var(--status-success-soft)'
                            : 'var(--status-warning-soft)',
                          color: isPublished
                            ? 'var(--ink-on-success-soft)'
                            : 'var(--ink-on-warning-soft)',
                        }}
                      >
                        {item.status}
                      </span>
                      {item.isMainHeadline && (
                        <span className="inline-flex items-center gap-1 rounded border border-border-strong bg-highlight px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink-highlight">
                          <Star className="h-3.5 w-3.5 fill-current" strokeWidth={2} aria-hidden="true" />
                          Manchete Principal
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans text-base font-bold text-ink-primary">
                      {item.headline}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-muted">
                      <span>Por {item.attribution.authorName}</span>
                      <span>Fonte: {item.attribution.sourceName}</span>
                      {item.publishedAt && <span>Publicada: {formatFullDate(item.publishedAt)}</span>}
                      <span>Views: {formatCompactNumber(item.viewsCount)}</span>
                      <span>Curtidas: {formatCompactNumber(item.likesCount)}</span>
                    </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onEdit(item.id)}
                      className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:bg-surface-hover"
                    >
                      <FileEdit className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                      Editar
                    </button>

                    {isPublished && !item.isMainHeadline && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onPromoteMainHeadline(item.id)}
                        className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-highlight px-3 py-1.5 font-sans text-xs font-bold text-ink-highlight"
                      >
                        <Star className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        Definir como Manchete Principal
                      </button>
                    )}

                    {isPublished ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setConfirmUnpublishId(item.id);
                          setUnpublishReason('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded border-2 border-status-error bg-surface px-3 py-1.5 font-sans text-xs font-bold text-status-error hover:bg-surface-alt"
                      >
                        <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        Tirar do ar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRepublish(item.id)}
                        className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong px-3 py-1.5 font-sans text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--fill-success)',
                          color: 'var(--ink-on-fill-success)',
                        }}
                      >
                        <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        Republicar
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmação em 2 passos ao Tirar do Ar */}
                {isConfirming && (
                  <div
                    role="alertdialog"
                    aria-label="Confirmar retirada do ar"
                    className="mt-4 rounded border-2 border-status-error p-4"
                    style={{
                      backgroundColor: 'var(--status-error-soft)',
                      color: 'var(--ink-on-error-soft)',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="font-sans text-sm font-bold">
                            Confirmar retirada do ar? O histórico e as métricas serão preservados.
                          </p>
                          <p className="mt-1 font-reading text-xs">
                            A matéria deixará de aparecer na Home, nos Reels e retornará 404 em
                            /noticia/{item.slug}, podendo ser republicada depois.
                          </p>
                        </div>

                        <input
                          type="text"
                          value={unpublishReason}
                          onChange={(e) => setUnpublishReason(e.target.value)}
                          placeholder="Motivo opcional (ex.: correção da fonte primária)"
                          aria-label="Motivo da retirada do ar"
                          className="w-full rounded border border-border-input bg-surface px-3 py-1.5 font-sans text-xs text-ink-primary"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            ref={cancelUnpublishBtnRef}
                            type="button"
                            onClick={() => setConfirmUnpublishId(null)}
                            className="rounded border-2 border-border-strong bg-surface px-3 py-1.5 font-sans text-xs font-bold text-ink-primary"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              await onUnpublish(item.id, unpublishReason.trim() || undefined);
                              setConfirmUnpublishId(null);
                            }}
                            className="rounded border-2 border-border-strong px-3 py-1.5 font-sans text-xs font-bold"
                            style={{
                              backgroundColor: 'var(--fill-error)',
                              color: 'var(--ink-on-fill-error)',
                            }}
                          >
                            Confirmar retirada do ar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
