import Link from 'next/link';
import { Zap } from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { BreakingTickerItem } from '@/lib/types';

interface BreakingTickerProps {
  items: BreakingTickerItem[];
}

export function BreakingTicker({ items }: BreakingTickerProps) {
  if (!items || items.length === 0) return null;

  return (
    <section
      aria-label="Plantão Geek — Últimas notícias"
      className="ticker-marquee relative z-10 border-b-[3px] border-border-strong bg-surface-alt"
    >
      <div className="mx-auto flex max-w-7xl items-stretch">
        <div className="z-10 flex shrink-0 items-center gap-2 border-r-[3px] border-border-strong bg-brand-fill px-3 py-2 text-white sm:px-4">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="live-dot-ping absolute inline-flex h-full w-full rounded-full bg-highlight" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-highlight" />
          </span>
          <Zap className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="font-display text-base tracking-wider sm:text-lg">PLANTÃO GEEK</span>
        </div>

        <div className="ticker-viewport relative flex-1 overflow-hidden py-2">
          <div className="ticker-track items-center">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/noticia/${item.slug}`}
                className="inline-flex shrink-0 items-center gap-2 pr-8 font-sans text-xs font-semibold text-ink-primary hover:text-brand sm:text-sm"
              >
                <CategoryBadge category={item.category} />
                <span className="whitespace-nowrap">{item.headline}</span>
              </Link>
            ))}

            {/* Clones para loop contínuo sem salto (ocultos para leitores de tela e reduced-motion) */}
            {items.map((item) => (
              <Link
                key={`clone-${item.slug}`}
                href={`/noticia/${item.slug}`}
                aria-hidden="true"
                tabIndex={-1}
                className="ticker-clone inline-flex shrink-0 items-center gap-2 pr-8 font-sans text-xs font-semibold text-ink-primary hover:text-brand sm:text-sm"
              >
                <CategoryBadge category={item.category} />
                <span className="whitespace-nowrap">{item.headline}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
