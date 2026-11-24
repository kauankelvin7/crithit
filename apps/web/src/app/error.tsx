'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="conteudo-principal" className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded border-2 border-border-strong bg-surface-alt shadow-hard-sm">
        <AlertTriangle className="h-7 w-7 text-brand" strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-4xl">
        Serviço editorial temporariamente indisponível
      </h1>
      <p className="mt-3 font-reading text-base leading-relaxed text-ink-secondary">
        Não foi possível carregar os dados mais recentes da redação neste momento. Tente novamente
        em alguns segundos.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="tactile-btn inline-flex items-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-5 py-2.5 font-sans text-sm font-bold text-white shadow-hard-sm"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="tactile-btn inline-flex items-center gap-2 rounded border-2 border-border-strong bg-surface px-5 py-2.5 font-sans text-sm font-bold text-ink-primary shadow-hard-sm"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Ir para a Capa
        </Link>
      </div>
    </main>
  );
}
