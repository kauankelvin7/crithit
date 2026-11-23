import { ExternalLink, GitFork, PenTool, ShieldCheck } from 'lucide-react';
import type { ContentType } from '@/lib/types';
import { getSafeHttpUrl } from '@/lib/url';

export interface AttributionBadgeProps {
  authorName: string;
  contentType: ContentType;
  sourceName: string;
  sourceUrl: string;
  variant?: 'compact' | 'detailed' | 'reels';
}

export function AttributionBadge({
  authorName,
  contentType,
  sourceName,
  sourceUrl,
  variant = 'compact',
}: AttributionBadgeProps) {
  const safeUrl = getSafeHttpUrl(sourceUrl);
  const isAutoral = contentType === 'AUTORAL';

  if (variant === 'reels') {
    return (
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-white/95">
        <span
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold uppercase tracking-wider"
          style={{
            backgroundColor: isAutoral ? '#065F46' : '#5B21B6',
            color: '#FFFFFF',
          }}
        >
          {isAutoral ? (
            <PenTool className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <GitFork className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          )}
          {contentType}
        </span>
        <span>Por {authorName}</span>
        <span aria-hidden="true">/</span>
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-[var(--highlight-comic)] underline-offset-2 hover:text-[var(--highlight-comic)]"
          >
            <span>Fonte: {sourceName}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        ) : (
          <span>Fonte: {sourceName}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 font-mono ${
        variant === 'detailed' ? 'text-xs' : 'text-[11px]'
      } text-ink-muted`}
    >
      <span
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold uppercase tracking-wider"
        style={{
          backgroundColor: isAutoral ? 'var(--accent-cinema-soft)' : 'var(--accent-tech-soft)',
          color: isAutoral ? 'var(--ink-on-cinema-soft)' : 'var(--ink-on-tech-soft)',
        }}
      >
        {isAutoral ? (
          <PenTool className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <GitFork className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        )}
        {contentType}
      </span>

      <span className="font-medium text-ink-secondary">Por {authorName}</span>

      <span aria-hidden="true" className="text-ink-muted">
        /
      </span>

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 inline-flex items-center gap-1 font-semibold text-ink-primary underline decoration-brand decoration-2 underline-offset-2 transition-colors hover:bg-highlight/25 hover:text-brand"
        >
          <span>Fonte: {sourceName}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      ) : (
        <span>Fonte: {sourceName}</span>
      )}
    </div>
  );
}

export interface TransparencyNoticeProps {
  contentType: ContentType;
  sourceName: string;
  sourceUrl: string;
}

export function TransparencyNotice({
  contentType,
  sourceName,
  sourceUrl,
}: TransparencyNoticeProps) {
  if (contentType !== 'CURADORIA') {
    return null;
  }

  const safeUrl = getSafeHttpUrl(sourceUrl);

  return (
    <aside
      aria-label="Transparência editorial"
      className="my-6 rounded border-y border-r border-border-subtle border-l-4 bg-surface-alt p-4"
      style={{ borderLeftColor: 'var(--accent-tech)' }}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: 'var(--accent-tech)' }}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="font-reading text-sm leading-relaxed text-ink-secondary">
          <strong className="font-semibold text-ink-primary">Transparência editorial:</strong> esta
          matéria foi adaptada para o português pela redação do CritHit! a partir da apuração
          original publicada por{' '}
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-ink-primary underline underline-offset-2 hover:text-brand"
            >
              <span>{sourceName}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          ) : (
            <strong className="font-semibold text-ink-primary">{sourceName}</strong>
          )}
          , com revisão humana antes da publicação.
        </p>
      </div>
    </aside>
  );
}
