import Link from 'next/link';
import { Globe, Rss, ShieldCheck } from 'lucide-react';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/categories';

export function SiteFooter() {
  return (
    <footer
      data-chrome="dark"
      className="mt-14 border-t-4 border-highlight bg-chrome text-chrome-ink"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-12">
        <div className="md:col-span-5 space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="rounded border-2 border-highlight bg-brand-fill px-3 py-1 font-display text-2xl tracking-wider text-white">
              CRITHIT!
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-chrome-muted">
              Jornalismo Geek Independente
            </span>
          </div>
          <p className="max-w-md font-reading text-sm leading-relaxed text-chrome-muted">
            Cobertura diária de games, quadrinhos, mangás, cinema, séries, animes e hardware.
            Operamos com curadoria automatizada de fontes nacionais e internacionais aliada a
            revisão humana obrigatória antes de cada publicação.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-xs text-chrome-muted">
            <ShieldCheck className="h-4 w-4 text-highlight" strokeWidth={1.75} aria-hidden="true" />
            <span>Zero clickbait. Atribuição completa em 100% das matérias.</span>
          </div>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h2 className="font-headline text-lg font-bold uppercase tracking-wide text-highlight">
            Editorias
          </h2>
          <ul className="space-y-2 font-sans text-sm">
            {CATEGORY_LIST.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/?category=${cat}`}
                  className="text-chrome-muted transition-colors hover:text-highlight"
                >
                  {CATEGORIES[cat].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h2 className="font-headline text-lg font-bold uppercase tracking-wide text-highlight">
            Plataforma
          </h2>
          <ul className="space-y-2 font-sans text-sm">
            <li>
              <Link href="/" className="text-chrome-muted transition-colors hover:text-highlight">
                Capa Editorial
              </Link>
            </li>
            <li>
              <Link
                href="/reels"
                className="text-chrome-muted transition-colors hover:text-highlight"
              >
                CritHit Reels 9:16
              </Link>
            </li>
            <li>
              <Link
                href="/#newsletter"
                className="text-chrome-muted transition-colors hover:text-highlight"
              >
                Newsletter Loot Diário
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h2 className="font-headline text-lg font-bold uppercase tracking-wide text-highlight">
            Transparência
          </h2>
          <p className="font-reading text-xs leading-relaxed text-chrome-muted">
            Todas as matérias de curadoria preservam o crédito ao veículo original com link externo
            verificado.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/"
              aria-label="Capa oficial CritHit!"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/20 bg-chrome-surface text-chrome-ink transition-colors hover:border-highlight hover:text-highlight"
            >
              <Globe className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link
              href="/reels"
              aria-label="Feed de Reels CritHit!"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/20 bg-chrome-surface text-chrome-ink transition-colors hover:border-highlight hover:text-highlight"
            >
              <Rss className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 font-mono text-[11px] text-chrome-muted sm:flex-row">
          <p>© 2026 CritHit! — Todos os direitos reservados.</p>
          <p>Jornalismo Geek Independente</p>
        </div>
      </div>
    </footer>
  );
}
