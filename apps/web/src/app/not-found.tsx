import Link from 'next/link';
import { ArrowLeft, FileWarning } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <>
      <main id="conteudo-principal" className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded border-2 border-border-strong bg-surface-alt shadow-hard">
          <FileWarning className="h-8 w-8 text-brand" strokeWidth={2} aria-hidden="true" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
          Erro 404 — Conteúdo indisponível
        </p>
        <h1 className="mt-2 font-headline text-4xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
          Matéria não encontrada
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-reading text-base leading-relaxed text-ink-secondary">
          A página solicitada não existe, foi movida ou ainda não está publicada na capa do
          CritHit!.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-5 py-2.5 font-sans text-sm font-bold text-white shadow-hard-sm transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Voltar para a Capa
          </Link>
          <Link
            href="/reels"
            className="inline-flex items-center gap-2 rounded border-2 border-border-strong bg-surface px-5 py-2.5 font-sans text-sm font-bold text-ink-primary shadow-hard-sm transition-colors hover:bg-surface-alt"
          >
            Explorar CritHit Reels
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
