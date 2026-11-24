import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Film,
  Play,
  Radio,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { AttributionBadge } from '@/components/AttributionBadge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { EditorialAvatar, EditorialCoverArt } from '@/components/EditorialCoverArt';
import { SiteFooter } from '@/components/SiteFooter';
import { BreakingTicker } from '@/components/home/BreakingTicker';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { fetchHomeData, getSiteUrl, searchPublishedArticles } from '@/lib/api-client';
import { CATEGORIES, EDITORIAL_FORMAT_LABELS } from '@/lib/categories';
import { formatCompactNumber, formatRelativeDate } from '@/lib/format';
import type { Category } from '@/lib/types';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

const VALID_CATEGORIES = new Set<Category>(['GAMES', 'COMICS', 'CINEMA', 'ANIMES', 'TECH']);

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const queryText = (params.q ?? '').trim();
  const rawCategory = (params.category ?? '').toUpperCase() as Category;
  const activeCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : undefined;

  const isFiltered = Boolean(queryText || activeCategory);
  const [homeData, searchResults] = await Promise.all([
    fetchHomeData(),
    isFiltered ? searchPublishedArticles(queryText, activeCategory) : Promise.resolve(null),
  ]);

  const siteUrl = getSiteUrl();
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'CritHit!',
    url: siteUrl,
    description:
      'Portal independente de jornalismo geek com curadoria de fontes nacionais e internacionais e revisão humana obrigatória.',
  };

  // Deduplicação estrita da Dobra 1 (Hero + 3 Secundárias + Reels em Destaque + 2 Urgente na Redação)
  const foldUsedIds = new Set<string>();
  if (homeData.mainHeadline) {
    foldUsedIds.add(homeData.mainHeadline.id);
  }

  const allPool = [
    ...homeData.secondaryHeadlines,
    ...homeData.urgentNews,
    ...homeData.featuredReels,
    ...homeData.giroGeek,
    ...homeData.columnsAndReviews,
    ...homeData.mostRead,
  ];
  const uniqueById = <T extends { id: string }>(list: T[]): T[] => {
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };
  const dedupPool = uniqueById(allPool);

  const secondaryFold = uniqueById([
    ...homeData.secondaryHeadlines,
    ...dedupPool,
  ])
    .filter((item) => !foldUsedIds.has(item.id))
    .slice(0, 3);
  secondaryFold.forEach((item) => foldUsedIds.add(item.id));

  const featuredReel =
    homeData.featuredReels.find((r) => !foldUsedIds.has(r.id)) ??
    dedupPool.find((r) => !foldUsedIds.has(r.id)) ??
    homeData.featuredReels[0] ??
    homeData.mainHeadline;
  if (featuredReel) {
    foldUsedIds.add(featuredReel.id);
  }

  const urgentArticles = uniqueById([
    ...homeData.urgentNews,
    ...dedupPool,
  ])
    .filter((item) => !foldUsedIds.has(item.id))
    .slice(0, 2);
  urgentArticles.forEach((item) => foldUsedIds.add(item.id));

  const primaryEditorialColumns: Category[] = ['GAMES', 'COMICS', 'CINEMA'];
  const secondaryEditorialColumns: Category[] = ['ANIMES', 'TECH'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <BreakingTicker items={homeData.breakingTicker} />

      <main id="conteudo-principal" className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Resultados de Busca / Filtro de Editoria (substitui a capa enquanto ativo) */}
        {isFiltered && searchResults ? (
          <section
            aria-label="Resultados da busca editorial"
            className="mb-10 rounded border-2 border-border-strong bg-surface p-5 shadow-hard sm:p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-brand" strokeWidth={2} aria-hidden="true" />
                <h1 className="font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-3xl">
                  {queryText
                    ? `Resultados para "${queryText}"`
                    : `Editoria: ${CATEGORIES[activeCategory!].label}`}
                </h1>
                <span className="rounded bg-surface-alt px-2 py-0.5 font-mono text-xs font-bold text-ink-muted">
                  {searchResults.totalElements}
                </span>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface-alt px-3 py-1.5 font-mono text-xs font-bold uppercase text-ink-primary hover:bg-highlight hover:text-ink-highlight"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Limpar filtro
              </Link>
            </div>

            {searchResults.content.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-reading text-base text-ink-secondary">
                  Nenhuma matéria publicada foi encontrada com os critérios informados.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-highlight px-4 py-2 font-mono text-xs font-bold uppercase text-ink-highlight"
                >
                  Voltar para a capa
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.content.map((article) => (
                  <article
                    key={article.id}
                    className="editorial-card group flex flex-col overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
                  >
                    <Link href={`/noticia/${article.slug}`} className="block overflow-hidden">
                      <EditorialCoverArt
                        coverImageUrl={article.coverImageUrl}
                        coverArtKey={article.coverArtKey}
                        category={article.category}
                        alt={article.headline}
                      />
                    </Link>
                    <div className="flex flex-1 flex-col gap-2.5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryBadge category={article.category} />
                        <span className="font-mono text-[11px] text-ink-muted">
                          {formatRelativeDate(article.publishedAt)}
                        </span>
                      </div>
                      <h2 className="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
                        <Link href={`/noticia/${article.slug}`}>{article.headline}</Link>
                      </h2>
                      <p className="line-clamp-2 font-reading text-sm text-ink-secondary">
                        {article.lead}
                      </p>
                      <div className="mt-auto pt-2">
                        <AttributionBadge
                          authorName={article.attribution.authorName}
                          contentType={article.attribution.contentType}
                          sourceName={article.attribution.sourceName}
                          sourceUrl={article.attribution.sourceUrl}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>

        {/* DOBRA PRINCIPAL: HERO (8 cols) + COLUNA LATERAL REELS & URGENTE (4 cols) */}
        <section aria-label="Destaques principais da capa" className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {homeData.mainHeadline && (
              <article className="editorial-card group overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard">
                <Link href={`/noticia/${homeData.mainHeadline.slug}`} className="block overflow-hidden">
                  <EditorialCoverArt
                    coverImageUrl={homeData.mainHeadline.coverImageUrl}
                    coverArtKey={homeData.mainHeadline.coverArtKey}
                    category={homeData.mainHeadline.category}
                    alt={homeData.mainHeadline.headline}
                    aspectClass="aspect-[16/9]"
                  />
                </Link>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <CategoryBadge category={homeData.mainHeadline.category} size="sm" skewed />
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {homeData.mainHeadline.readingTimeMinutes} min de leitura
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      {formatRelativeDate(homeData.mainHeadline.publishedAt)}
                    </span>
                  </div>

                  {isFiltered ? (
                    <h2 className="font-headline text-3xl font-extrabold leading-[1.06] tracking-tight text-ink-primary sm:text-5xl">
                      <Link
                        href={`/noticia/${homeData.mainHeadline.slug}`}
                        className="hover:text-brand"
                      >
                        {homeData.mainHeadline.headline}
                      </Link>
                    </h2>
                  ) : (
                    <h1 className="font-headline text-3xl font-extrabold leading-[1.06] tracking-tight text-ink-primary sm:text-5xl">
                      <Link
                        href={`/noticia/${homeData.mainHeadline.slug}`}
                        className="hover:text-brand"
                      >
                        {homeData.mainHeadline.headline}
                      </Link>
                    </h1>
                  )}

                  <p className="font-reading text-base leading-relaxed text-ink-secondary sm:text-lg">
                    {homeData.mainHeadline.lead}
                  </p>

                  {homeData.mainHeadline.subheadlineBullets.length > 0 && (
                    <ul className="space-y-1.5 border-l-4 border-brand pl-4 font-reading text-sm text-ink-secondary">
                      {homeData.mainHeadline.subheadlineBullets.slice(0, 3).map((bullet, idx) => (
                        <li key={idx} className="leading-snug">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                    <AttributionBadge
                      authorName={homeData.mainHeadline.attribution.authorName}
                      contentType={homeData.mainHeadline.attribution.contentType}
                      sourceName={homeData.mainHeadline.attribution.sourceName}
                      sourceUrl={homeData.mainHeadline.attribution.sourceUrl}
                      variant="detailed"
                    />
                    <Link
                      href={`/noticia/${homeData.mainHeadline.slug}`}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand hover:underline"
                    >
                      Ler matéria
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* 3 Destaques Secundários */}
            <div className="grid gap-4 sm:grid-cols-3">
              {secondaryFold.map((article) => (
                <article
                  key={article.id}
                  className="editorial-card group flex flex-col overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
                >
                  <Link href={`/noticia/${article.slug}`} className="block overflow-hidden">
                    <EditorialCoverArt
                      coverImageUrl={article.coverImageUrl}
                      coverArtKey={article.coverArtKey}
                      category={article.category}
                      alt={article.headline}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <CategoryBadge category={article.category} />
                      <span className="font-mono text-[11px] text-ink-muted">
                        {formatRelativeDate(article.publishedAt)}
                      </span>
                    </div>
                    <h2 className="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
                      <Link href={`/noticia/${article.slug}`}>{article.headline}</Link>
                    </h2>
                    <p className="mt-auto font-mono text-[11px] text-ink-muted">
                      Fonte: {article.attribution.sourceName}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Coluna Lateral: Reels em Destaque + Urgente na Redação */}
          <aside aria-label="Reels em Destaque e Urgente na Redação" className="space-y-6 lg:col-span-4">
            {/* Box Reels em Destaque */}
            <div
              data-chrome="dark"
              className="overflow-hidden rounded border-2 border-border-strong bg-chrome text-chrome-ink shadow-hard"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-highlight" strokeWidth={2} aria-hidden="true" />
                  <h2 className="font-display text-xl tracking-wider text-highlight">
                    REELS EM DESTAQUE
                  </h2>
                </div>
                <Link
                  href="/reels"
                  className="font-mono text-[11px] font-bold uppercase tracking-wider text-chrome-ink hover:text-highlight"
                >
                  Abrir Reels
                </Link>
              </div>

              {featuredReel && (
                <Link
                  href={`/reels?id=${featuredReel.slug}`}
                  className="group relative block aspect-[4/5] w-full overflow-hidden"
                >
                  <EditorialCoverArt
                    coverImageUrl={featuredReel.coverImageUrl}
                    coverArtKey={featuredReel.coverArtKey}
                    category={featuredReel.category}
                    alt={featuredReel.headline}
                    aspectClass="h-full w-full"
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-5"
                    style={{
                      background:
                        'linear-gradient(to top, var(--scrim-reels) 0%, rgba(9,10,15,0.82) 55%, rgba(9,10,15,0.15) 100%)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <CategoryBadge category={featuredReel.category} />
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-highlight bg-brand-fill text-white transition-transform group-hover:scale-105">
                        <Play className="h-4 w-4 fill-current" strokeWidth={2} aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="font-headline text-2xl font-bold leading-tight text-white">
                      {featuredReel.headline}
                    </h3>
                    <p className="mt-2 line-clamp-2 font-reading text-xs leading-relaxed text-white/90">
                      {featuredReel.reelsSummary}
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {/* Box Urgente na Redação */}
            <div className="rounded border-2 border-border-strong bg-surface p-4 shadow-hard">
              <div className="mb-4 flex items-center justify-between border-b-2 border-border-strong pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-brand-fill px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
                    <Radio className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    URGENTE
                  </span>
                  <h2 className="font-headline text-xl font-extrabold uppercase tracking-tight text-ink-primary">
                    Na Redação
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-ink-muted">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="live-dot-ping absolute inline-flex h-full w-full rounded-full bg-brand-fill" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fill" />
                  </span>
                  AO VIVO
                </span>
              </div>

              <div className="space-y-4">
                {urgentArticles.map((item) => (
                    <article
                      key={item.id}
                      className="editorial-card group flex items-start gap-3 rounded border-2 border-border-strong bg-surface-alt p-3 shadow-hard-sm hover:bg-surface-hover"
                    >
                      <Link
                        href={`/noticia/${item.slug}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="h-20 w-20 shrink-0 overflow-hidden rounded border-2 border-border-strong"
                      >
                        <EditorialCoverArt
                          coverImageUrl={item.coverImageUrl}
                          coverArtKey={item.coverArtKey}
                          category={item.category}
                          alt={item.headline}
                          aspectClass="h-full w-full"
                          compact
                          decorative
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <CategoryBadge category={item.category} />
                          <span className="font-mono text-[11px] text-ink-muted">
                            {formatRelativeDate(item.publishedAt)}
                          </span>
                        </div>
                        <h3 className="line-clamp-3 font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand">
                          <Link href={`/noticia/${item.slug}`}>{item.headline}</Link>
                        </h3>
                        <p className="mt-1.5 font-mono text-[11px] text-ink-muted">
                          Fonte: {item.attribution.sourceName}
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          </aside>
        </section>

        {/* GIRO GEEK (2 linhas x 4 colunas) */}
        <section aria-labelledby="giro-geek-heading" className="mt-12">
          <div className="mb-5 flex items-end justify-between border-b-[3px] border-border-strong pb-2">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
                Radar de Notícias
              </p>
              <h2
                id="giro-geek-heading"
                className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary"
              >
                Giro Geek — Últimas do Radar
              </h2>
            </div>
            <Link
              href="/reels"
              className="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-ink-secondary hover:text-brand"
            >
              Ver em Reels
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeData.giroGeek.slice(0, 8).map((article) => (
              <article
                key={article.id}
                className="editorial-card group flex flex-col justify-between rounded border-2 border-border-strong bg-surface p-3.5 shadow-hard-sm"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/noticia/${article.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="h-16 w-16 shrink-0 overflow-hidden rounded border-2 border-border-strong"
                  >
                    <EditorialCoverArt
                      coverImageUrl={article.coverImageUrl}
                      coverArtKey={article.coverArtKey}
                      category={article.category}
                      alt={article.headline}
                      aspectClass="h-full w-full"
                      compact
                      decorative
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-1.5">
                      <CategoryBadge category={article.category} />
                      <span className="font-mono text-[11px] text-ink-muted">
                        {formatRelativeDate(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="line-clamp-3 font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand">
                      <Link href={`/noticia/${article.slug}`}>{article.headline}</Link>
                    </h3>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 font-mono text-[11px] text-ink-muted">
                  <span className="truncate">{article.attribution.sourceName}</span>
                  <span>{article.readingTimeMinutes} min</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* NEWSLETTER LOOT DIÁRIO */}
        <NewsletterSection />

        {/* COLUNAS & REVIEWS */}
        <section aria-labelledby="colunas-reviews-heading" className="mt-12">
          <div className="mb-5 flex items-end justify-between border-b-[3px] border-border-strong pb-2">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
                Opinião & Crítica
              </p>
              <h2
                id="colunas-reviews-heading"
                className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary"
              >
                Colunas & Reviews
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homeData.columnsAndReviews.slice(0, 4).map((article) => (
              <article
                key={article.id}
                className="editorial-card group flex flex-col overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
              >
                <div className="relative overflow-hidden">
                  <Link href={`/noticia/${article.slug}`} className="block overflow-hidden">
                    <EditorialCoverArt
                      coverImageUrl={article.coverImageUrl}
                      coverArtKey={article.coverArtKey}
                      category={article.category}
                      alt={article.headline}
                    />
                  </Link>
                  {article.reviewScore !== null && (
                    <div
                      aria-label={`Nota do review: ${article.reviewScore.toFixed(1)} de 10`}
                      className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded border-2 border-[#111111] bg-highlight px-2 py-0.5 font-display text-lg leading-none text-ink-highlight shadow-hard-sm"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" strokeWidth={2} aria-hidden="true" />
                      {article.reviewScore.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand">
                      {EDITORIAL_FORMAT_LABELS[article.editorialFormat]}
                    </span>
                    <CategoryBadge category={article.category} />
                  </div>
                  <h3 className="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
                    <Link href={`/noticia/${article.slug}`}>{article.headline}</Link>
                  </h3>
                  <p className="line-clamp-2 font-reading text-xs leading-relaxed text-ink-secondary">
                    {article.lead}
                  </p>
                  <div className="mt-auto flex items-center gap-3 border-t border-border-subtle pt-3">
                    <EditorialAvatar
                      authorName={article.attribution.authorName}
                      sizeClass="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <AttributionBadge
                        authorName={article.attribution.authorName}
                        contentType={article.attribution.contentType}
                        sourceName={article.attribution.sourceName}
                        sourceUrl={article.attribution.sourceUrl}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CARROSSEL HORIZONTAL DE REELS */}
        <section
          aria-labelledby="reels-carousel-heading"
          data-chrome="dark"
          className="mt-12 rounded border-2 border-border-strong bg-chrome p-5 text-chrome-ink shadow-hard sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded border-2 border-highlight bg-brand-fill px-2.5 py-0.5 font-display text-xl tracking-wider text-white">
                REELS
              </span>
              <h2
                id="reels-carousel-heading"
                className="font-headline text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
              >
                CritHit Reels — Resumo Rápido
              </h2>
            </div>
            <Link
              href="/reels"
              className="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-highlight bg-highlight px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-ink-highlight hover:bg-white"
            >
              Ver todos os Reels
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-flow-col auto-cols-[72%] gap-4 overflow-x-auto pb-2 sm:auto-cols-[38%] lg:grid-flow-row lg:grid-cols-6">
            {homeData.featuredReels.slice(0, 6).map((reel) => (
              <Link
                key={reel.id}
                href={`/reels?id=${reel.slug}`}
                className="editorial-card group relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded border-2 border-white/15 bg-chrome-surface hover:border-highlight"
              >
                <EditorialCoverArt
                  coverImageUrl={reel.coverImageUrl}
                  coverArtKey={reel.coverArtKey}
                  category={reel.category}
                  alt={reel.headline}
                  aspectClass="absolute inset-0 h-full w-full"
                />
                <div
                  className="relative z-10 flex h-full flex-col justify-between p-3"
                  style={{
                    background:
                      'linear-gradient(to top, var(--scrim-reels) 0%, rgba(9,10,15,0.75) 50%, rgba(9,10,15,0.18) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={reel.category} />
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-highlight">
                      <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="line-clamp-3 font-headline text-lg font-bold leading-tight text-white group-hover:text-highlight">
                    {reel.headline}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 5 BLOCOS DE EDITORIAS (GAMES / COMICS / CINEMA + ANIMES / TECH) */}
        <section id="editorias" aria-labelledby="editorias-heading" className="mt-12">
          <div className="mb-5 border-b-[3px] border-border-strong pb-2">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
              Cobertura por Mídia
            </p>
            <h2
              id="editorias-heading"
              className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary"
            >
              Editorias em Destaque
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {primaryEditorialColumns.map((categoryKey) => {
              const meta = CATEGORIES[categoryKey];
              const list = homeData.categoryBlocks[categoryKey] ?? [];
              const leadArticle = list[0];
              const rest = list.slice(1, 4);

              return (
                <div
                  key={categoryKey}
                  className="flex flex-col overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      backgroundColor: meta.fillVar,
                      color: meta.inkOnFillVar,
                    }}
                  >
                    <h3 className="font-headline text-xl font-extrabold uppercase tracking-wide">
                      {meta.label}
                    </h3>
                    <Link
                      href={`/?category=${categoryKey}`}
                      className="font-mono text-[11px] font-bold uppercase underline underline-offset-2"
                    >
                      Ver tudo
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {leadArticle && (
                      <article className="group space-y-2.5">
                        <Link href={`/noticia/${leadArticle.slug}`} className="block overflow-hidden rounded border border-border-subtle">
                          <EditorialCoverArt
                            coverImageUrl={leadArticle.coverImageUrl}
                            coverArtKey={leadArticle.coverArtKey}
                            category={leadArticle.category}
                            alt={leadArticle.headline}
                          />
                        </Link>
                        <h4 className="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
                          <Link href={`/noticia/${leadArticle.slug}`}>{leadArticle.headline}</Link>
                        </h4>
                        <p className="font-mono text-[11px] text-ink-muted">
                          {leadArticle.attribution.contentType === 'AUTORAL'
                            ? `Por ${leadArticle.attribution.authorName}`
                            : leadArticle.attribution.sourceName}{' '}
                          / {formatRelativeDate(leadArticle.publishedAt)}
                        </p>
                      </article>
                    )}

                    {rest.length > 0 && (
                      <ul className="mt-auto divide-y divide-border-subtle border-t border-border-subtle pt-2">
                        {rest.map((item) => (
                          <li key={item.id} className="group/item flex items-center gap-3 py-2.5">
                            <Link
                              href={`/noticia/${item.slug}`}
                              tabIndex={-1}
                              aria-hidden="true"
                              className="h-16 w-16 shrink-0 overflow-hidden rounded border-2 border-border-strong"
                            >
                              <EditorialCoverArt
                                coverImageUrl={item.coverImageUrl}
                                coverArtKey={item.coverArtKey}
                                category={item.category}
                                alt={item.headline}
                                aspectClass="h-full w-full"
                                compact
                                decorative
                              />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/noticia/${item.slug}`}
                                className="line-clamp-2 block font-sans text-sm font-semibold leading-snug text-ink-primary hover:text-brand"
                              >
                                {item.headline}
                              </Link>
                              <span className="mt-1 block font-mono text-[11px] text-ink-muted">
                                {item.attribution.contentType === 'AUTORAL'
                                  ? `Por ${item.attribution.authorName}`
                                  : item.attribution.sourceName}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {secondaryEditorialColumns.map((categoryKey) => {
              const meta = CATEGORIES[categoryKey];
              const list = homeData.categoryBlocks[categoryKey] ?? [];
              const leadArticle = list[0];
              const rest = list.slice(1, 4);

              return (
                <div
                  key={categoryKey}
                  className="flex flex-col overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      backgroundColor: meta.fillVar,
                      color: meta.inkOnFillVar,
                    }}
                  >
                    <h3 className="font-headline text-xl font-extrabold uppercase tracking-wide">
                      {meta.label}
                    </h3>
                    <Link
                      href={`/?category=${categoryKey}`}
                      className="font-mono text-[11px] font-bold uppercase underline underline-offset-2"
                    >
                      Ver tudo
                    </Link>
                  </div>

                  <div className="grid flex-1 gap-4 p-4 sm:grid-cols-2">
                    {leadArticle && (
                      <article className="group space-y-2.5">
                        <Link href={`/noticia/${leadArticle.slug}`} className="block overflow-hidden rounded border border-border-subtle">
                          <EditorialCoverArt
                            coverImageUrl={leadArticle.coverImageUrl}
                            coverArtKey={leadArticle.coverArtKey}
                            category={leadArticle.category}
                            alt={leadArticle.headline}
                          />
                        </Link>
                        <h4 className="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
                          <Link href={`/noticia/${leadArticle.slug}`}>{leadArticle.headline}</Link>
                        </h4>
                        <p className="font-mono text-[11px] text-ink-muted">
                          {leadArticle.attribution.contentType === 'AUTORAL'
                            ? `Por ${leadArticle.attribution.authorName}`
                            : leadArticle.attribution.sourceName}{' '}
                          / {formatRelativeDate(leadArticle.publishedAt)}
                        </p>
                      </article>
                    )}

                    <div className="flex flex-col justify-between gap-2">
                      {rest.length > 0 ? (
                        <ul className="divide-y divide-border-subtle">
                          {rest.map((item) => (
                            <li key={item.id} className="group/item flex items-center gap-3 py-2.5 first:pt-0">
                              <Link
                                href={`/noticia/${item.slug}`}
                                tabIndex={-1}
                                aria-hidden="true"
                                className="h-16 w-16 shrink-0 overflow-hidden rounded border-2 border-border-strong"
                              >
                                <EditorialCoverArt
                                  coverImageUrl={item.coverImageUrl}
                                  coverArtKey={item.coverArtKey}
                                  category={item.category}
                                  alt={item.headline}
                                  aspectClass="h-full w-full"
                                  compact
                                  decorative
                                />
                              </Link>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/noticia/${item.slug}`}
                                  className="line-clamp-2 block font-sans text-sm font-semibold leading-snug text-ink-primary hover:text-brand"
                                >
                                  {item.headline}
                                </Link>
                                <span className="mt-1 block font-mono text-[11px] text-ink-muted">
                                  {item.attribution.contentType === 'AUTORAL'
                                    ? `Por ${item.attribution.authorName}`
                                    : item.attribution.sourceName}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded border border-dashed border-border-subtle bg-surface-alt p-4 font-reading text-xs text-ink-secondary">
                          Novas pautas de {meta.label} em curadoria pela redação.
                        </p>
                      )}
                      <Link
                        href={`/?category=${categoryKey}`}
                        className="inline-flex items-center gap-1 self-start font-mono text-xs font-bold uppercase text-brand hover:underline"
                      >
                        Explorar {meta.shortLabel}
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RANKING MAIS LIDAS #1–#5 (Números em Bangers) */}
        <section aria-labelledby="mais-lidas-heading" className="mt-12">
          <div className="mb-5 flex items-center gap-2.5 border-b-[3px] border-border-strong pb-2">
            <TrendingUp className="h-6 w-6 text-brand" strokeWidth={2} aria-hidden="true" />
            <h2
              id="mais-lidas-heading"
              className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary"
            >
              Mais Lidas da Semana
            </h2>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {homeData.mostRead.slice(0, 5).map((article, index) => (
              <li
                key={article.id}
                className="editorial-card group flex flex-col justify-between rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-4xl leading-none tracking-wide text-brand">
                      #{index + 1}
                    </span>
                    <CategoryBadge category={article.category} />
                  </div>
                  <h3 className="font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand">
                    <Link href={`/noticia/${article.slug}`}>{article.headline}</Link>
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 font-mono text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {formatCompactNumber(article.viewsCount)}
                  </span>
                  <span>{article.readingTimeMinutes} min</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
