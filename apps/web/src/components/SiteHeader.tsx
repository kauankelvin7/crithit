'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Film, Newspaper, Search, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(searchParams?.get('q') ?? '');
  }, [searchParams]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/');
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    if (pathname === '/' && searchParams?.get('q')) {
      router.push('/');
    }
  };

  return (
    <header
      data-chrome="dark"
      className="sticky top-0 z-50 w-full shrink-0 border-b-[3px] border-highlight bg-chrome text-chrome-ink"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        {/* Marca CRITHIT! (Bangers restrita à marca) */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="CritHit! — Ir para a capa"
            className="inline-flex items-center gap-1 rounded border-2 border-highlight bg-brand-fill px-3 py-1 font-display text-2xl tracking-wider text-white shadow-hard-sm transition-transform hover:-translate-y-0.5"
          >
            CRITHIT!
          </Link>

          <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-sm font-semibold transition-colors ${
                pathname === '/'
                  ? 'bg-highlight text-ink-highlight'
                  : 'text-chrome-ink hover:bg-chrome-surface hover:text-highlight'
              }`}
            >
              <Newspaper className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Capa
            </Link>
            <Link
              href="/reels"
              aria-current={pathname === '/reels' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-sm font-semibold transition-colors ${
                pathname === '/reels'
                  ? 'bg-highlight text-ink-highlight'
                  : 'text-chrome-ink hover:bg-chrome-surface hover:text-highlight'
              }`}
            >
              <Film className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Reels 9:16
            </Link>
            <Link
              href="/#editorias"
              className="rounded px-3 py-1.5 font-sans text-sm font-semibold text-chrome-ink transition-colors hover:bg-chrome-surface hover:text-highlight"
            >
              Editorias
            </Link>
          </nav>
        </div>

        {/* Busca Desktop + Alternador de Tema */}
        <div className="flex items-center gap-2.5">
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="relative hidden lg:flex items-center"
          >
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-chrome-muted"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar notícias"
              placeholder="Buscar por título, editoria ou fonte..."
              className="w-64 rounded border-2 border-[var(--border-input)] bg-chrome-surface py-1.5 pl-9 pr-8 font-sans text-sm text-chrome-ink placeholder:text-chrome-muted focus:border-highlight focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpar busca"
                className="absolute right-2 rounded p-0.5 text-chrome-muted hover:text-highlight"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </form>

          <Link
            href="/reels"
            className="inline-flex md:hidden items-center gap-1 rounded border-2 border-highlight bg-chrome-surface px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-highlight"
          >
            <Film className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Reels
          </Link>

          <ThemeToggle />
        </div>
      </div>

      {/* Barra de Busca Dedicada Mobile/Tablet (oculta em /reels para liberar 100% da altura do player) */}
      {pathname !== '/reels' && (
        <div className="border-t border-white/10 bg-chrome-surface px-4 py-2 lg:hidden">
          <form role="search" onSubmit={handleSearchSubmit} className="relative mx-auto flex max-w-7xl items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-chrome-muted"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar notícias no celular"
              placeholder="Buscar por título, editoria ou fonte..."
              className="w-full rounded border border-[var(--border-input)] bg-chrome py-1.5 pl-9 pr-9 font-sans text-sm text-chrome-ink placeholder:text-chrome-muted focus:border-highlight focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpar busca"
                className="absolute right-2 rounded p-1 text-chrome-muted hover:text-highlight"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
}
