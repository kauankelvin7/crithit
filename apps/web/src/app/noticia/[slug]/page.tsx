import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  Clock,
  ExternalLink,
  Film,
  Flame,
  Layers,
  ListChecks,
  Play,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { AttributionBadge, TransparencyNotice } from '@/components/AttributionBadge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { EditorialAvatar, EditorialCoverArt } from '@/components/EditorialCoverArt';
import { SiteFooter } from '@/components/SiteFooter';
import { ArticleCommentsSection } from '@/components/article/ArticleCommentsSection';
import { ArticleEngagementBar } from '@/components/article/ArticleEngagementBar';
import { fetchArticleBySlug, fetchHomeData, getSiteUrl } from '@/lib/api-client';
import { CATEGORIES, EDITORIAL_FORMAT_LABELS } from '@/lib/categories';
import { formatCompactNumber, formatFullDate, formatRelativeDate } from '@/lib/format';
import { getSafeHttpUrl } from '@/lib/url';

export const revalidate = 120;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Matéria não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/noticia/${article.slug}`;
  const safeCover = getSafeHttpUrl(article.coverImageUrl);

  return {
    title: article.headline,
    description: article.lead,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: article.headline,
      description: article.lead,
      publishedTime: article.publishedAt,
      authors: [article.attribution.authorName],
      section: CATEGORIES[article.category].label,
      tags: article.tags,
      ...(safeCover ? { images: [{ url: safeCover, alt: article.headline }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description: article.lead,
      ...(safeCover ? { images: [safeCover] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, homeData] = await Promise.all([fetchArticleBySlug(slug), fetchHomeData()]);

  if (!article) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/noticia/${article.slug}`;
  const safeCover = getSafeHttpUrl(article.coverImageUrl);
  const categoryMeta = CATEGORIES[article.category];
  const formatLabel = EDITORIAL_FORMAT_LABELS[article.editorialFormat];

  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.lead,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Person',
      name: article.attribution.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CritHit!',
      url: siteUrl,
    },
    articleSection: categoryMeta.label,
    ...(safeCover ? { image: [safeCover] } : {}),
  };

  const matchedSources =
    article.matchedSources && article.matchedSources.length > 0
      ? article.matchedSources
      : [
          {
            id: `primary-${article.id}`,
            sourceName: article.attribution.sourceName,
            sourceUrl: article.attribution.sourceUrl,
            originalTitle: article.headline,
            originalExcerpt: null,
            similarityScore: 1,
            isPrimary: true,
            fetchedAt: article.publishedAt,
          },
        ];

  const mostReadList = homeData.mostRead.slice(0, 5);
  const relatedList = (article.relatedArticles ?? []).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />

      <main id="conteudo-principal" className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        {/* 1. Breadcrumb Editorial (estilo CNN / IGN) */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-secondary"
        >
          <Link href="/" className="font-semibold hover:text-brand hover:underline">
            Capa
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} aria-hidden="true" />
          <Link
            href={`/?category=${article.category}`}
            className="font-semibold hover:text-brand hover:underline"
          >
            {categoryMeta.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} aria-hidden="true" />
          <span aria-current="page" className="font-bold text-ink-primary">
            {formatLabel}
          </span>
        </nav>

        <article className="space-y-8">
          {/* 2. Cabeçalho Jornalístico de Alto Impacto (estilo The Verge / Polygon) */}
          <header className="rounded-lg border-2 border-border-strong bg-surface p-5 shadow-hard sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <CategoryBadge category={article.category} size="sm" skewed />
              <span className="rounded border border-border-subtle bg-surface-alt px-2.5 py-1 font-mono text-xs font-bold uppercase text-ink-secondary">
                {formatLabel}
              </span>
              {article.reviewScore !== null && (
                <span className="inline-flex items-center gap-1 rounded border-2 border-border-strong bg-highlight px-2.5 py-0.5 font-mono text-xs font-bold text-ink-highlight">
                  <Star className="h-3.5 w-3.5 fill-current" strokeWidth={2} aria-hidden="true" />
                  Nota {article.reviewScore.toFixed(1)}/10
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {article.readingTimeMinutes} min de leitura
              </span>
            </div>

            <h1 className="font-headline text-3xl font-extrabold leading-[1.06] tracking-tight text-ink-primary sm:text-5xl">
              {article.headline}
            </h1>

            <p className="mt-4 max-w-4xl font-reading text-lg leading-relaxed text-ink-secondary sm:text-xl">
              {article.lead}
            </p>

            {/* Barra de Autoria, Fontes Clicáveis & Engajamento */}
            <div className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <EditorialAvatar authorName={article.attribution.authorName} sizeClass="h-12 w-12" />
                <div className="space-y-1.5">
                  <AttributionBadge
                    authorName={article.attribution.authorName}
                    contentType={article.attribution.contentType}
                    sourceName={article.attribution.sourceName}
                    sourceUrl={article.attribution.sourceUrl}
                    variant="detailed"
                  />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
                    <time dateTime={article.publishedAt}>{formatFullDate(article.publishedAt)}</time>
                    {matchedSources.length > 1 && (
                      <a
                        href="#fontes-cruzadas-heading"
                        className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                      >
                        <Layers className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        {matchedSources.length} fontes cruzadas verificadas
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/reels?id=${article.slug}`}
                  className="tactile-btn inline-flex items-center gap-2 rounded border-2 border-border-strong bg-highlight px-3.5 py-2 font-mono text-xs font-bold uppercase text-ink-highlight shadow-hard-sm hover:bg-white"
                >
                  <Film className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Ver em Reels
                </Link>
                <ArticleEngagementBar
                  articleId={article.id}
                  slug={article.slug}
                  headline={article.headline}
                  initialLikes={article.likesCount}
                  initialSaves={article.savesCount}
                  initialLiked={article.viewerState?.liked}
                  initialSaved={article.viewerState?.saved}
                />
              </div>
            </div>
          </header>

          {/* 3. Grid Assimétrico 12 Colunas (padrão CNN Brasil & IGN) */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* COLUNA PRINCIPAL (8 cols) */}
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-lg border-2 border-border-strong bg-surface p-5 shadow-hard sm:p-8">
                {/* Capa Proporcional (aspect-[16/9] max-h-[420px]) + Legenda Editorial */}
                <figure className="overflow-hidden rounded border-2 border-border-strong bg-surface-alt">
                  <EditorialCoverArt
                    coverImageUrl={article.coverImageUrl}
                    coverArtKey={article.coverArtKey}
                    category={article.category}
                    alt={article.headline}
                    aspectClass="aspect-[16/9] max-h-[420px]"
                  />
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-surface-alt px-4 py-2 font-mono text-[11px] text-ink-secondary">
                    <span>
                      {article.coverImageUrl
                        ? `Imagem de cobertura • ${article.headline}`
                        : `Ilustração editorial CritHit! • Editoria ${categoryMeta.label}`}
                    </span>
                    <span className="font-bold text-ink-primary">
                      {article.attribution.contentType === 'AUTORAL'
                        ? 'Produção original CritHit!'
                        : `Crédito: ${article.attribution.sourceName}`}
                    </span>
                  </figcaption>
                </figure>

                {/* Quadro "Em Resumo / Pontos-Chave" (estilo CNN Brasil / Axios) */}
                {article.subheadlineBullets.length > 0 && (
                  <section
                    aria-labelledby="pontos-chave-heading"
                    className="mt-6 rounded-r border border-border-subtle border-l-4 bg-surface-alt p-5"
                    style={{ borderLeftColor: categoryMeta.accentVar }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks
                        className="h-5 w-5"
                        style={{ color: categoryMeta.accentVar }}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <h2
                        id="pontos-chave-heading"
                        className="font-headline text-xl font-extrabold uppercase tracking-wide text-ink-primary"
                      >
                        Em Resumo — Pontos-Chave
                      </h2>
                    </div>
                    <ul className="list-disc space-y-2 pl-5 font-reading text-sm leading-relaxed text-ink-secondary sm:text-base">
                      {article.subheadlineBullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Nota de Transparência obrigatória quando CURADORIA */}
                <TransparencyNotice
                  contentType={article.attribution.contentType}
                  sourceName={article.attribution.sourceName}
                  sourceUrl={article.attribution.sourceUrl}
                />

                {/* Corpo de Leitura (Plus Jakarta Sans 17px, leading-[1.78]) */}
                <div className="mt-6 max-w-[68ch] space-y-5 font-reading text-base leading-[1.78] text-ink-primary sm:text-[17px]">
                  {article.bodyParagraphs.map((paragraph, idx) => (
                    <div key={idx} className="space-y-4">
                      {idx === 1 && article.bodyParagraphs.length >= 3 && (
                        <h2 className="pt-2 font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary">
                          Contexto e bastidores da apuração
                        </h2>
                      )}
                      {idx === 3 && article.bodyParagraphs.length >= 4 && (
                        <h2 className="pt-2 font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary">
                          O que esperar a seguir
                        </h2>
                      )}
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </div>

                {/* Tags clicáveis */}
                {article.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-5">
                    <Tag className="h-4 w-4 text-ink-muted" strokeWidth={1.75} aria-hidden="true" />
                    {article.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/?q=${encodeURIComponent(tag)}`}
                        className="rounded border border-border-subtle bg-surface-alt px-2.5 py-1 font-mono text-xs font-medium text-ink-secondary hover:border-brand hover:text-brand"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Bloco Fontes & Transparência Editorial */}
                {article.attribution.contentType === 'CURADORIA' ? (
                  <section
                    aria-labelledby="fontes-cruzadas-heading"
                    className="mt-8 rounded-lg border-2 border-border-strong bg-surface-alt p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                      <h2
                        id="fontes-cruzadas-heading"
                        className="inline-flex items-center gap-2 font-headline text-xl font-extrabold uppercase tracking-wide text-ink-primary"
                      >
                        <Layers className="h-5 w-5 text-brand" strokeWidth={2} aria-hidden="true" />
                        Fontes &amp; Transparência Editorial
                      </h2>
                      <span className="font-mono text-xs font-bold uppercase text-ink-secondary">
                        {article.attribution.contentType}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {matchedSources.map((src, index) => {
                        const safeSrcUrl = getSafeHttpUrl(src.sourceUrl);
                        const sourceLabel =
                          src.isPrimary || index === 0 ? 'Fonte principal' : 'Fonte corroborada';
                        return (
                          <li
                            key={src.id}
                            className="flex flex-col gap-1 rounded border border-border-subtle bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-ink-primary">
                                  {src.sourceName}
                                </span>
                                <span className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-secondary">
                                  {sourceLabel}
                                </span>
                              </div>
                              <p className="font-reading text-sm text-ink-secondary">
                                {src.originalTitle}
                              </p>
                            </div>

                            {safeSrcUrl && (
                              <a
                                href={safeSrcUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border-strong bg-surface-alt px-3 py-1.5 font-mono text-xs font-bold text-ink-primary underline decoration-brand underline-offset-2 hover:bg-highlight hover:text-ink-highlight"
                              >
                                <span>Visitar fonte</span>
                                <ExternalLink
                                  className="h-3.5 w-3.5 shrink-0"
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                                <span className="sr-only">(abre em nova aba)</span>
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : (
                  <section
                    aria-labelledby="fontes-cruzadas-heading"
                    className="mt-8 rounded-lg border-2 border-border-strong bg-surface-alt p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2
                        id="fontes-cruzadas-heading"
                        className="inline-flex items-center gap-2 font-headline text-xl font-extrabold uppercase tracking-wide text-ink-primary"
                      >
                        <Layers className="h-5 w-5 text-brand" strokeWidth={2} aria-hidden="true" />
                        Produção Original CritHit!
                      </h2>
                      <span className="font-mono text-xs font-bold uppercase text-ink-secondary">
                        AUTORAL
                      </span>
                    </div>
                    <p className="mt-2 font-reading text-sm leading-relaxed text-ink-secondary">
                      Texto original assinado por{' '}
                      <strong className="font-semibold text-ink-primary">
                        {article.attribution.authorName}
                      </strong>{' '}
                      com apuração e revisão da redação do CritHit!.
                    </p>
                  </section>
                )}

                {/* Seção de Comentários Integrada */}
                <ArticleCommentsSection
                  articleId={article.id}
                  initialCount={article.commentsCount}
                />
              </div>
            </div>

            {/* SIDEBAR EDITORIAL STICKY (4 cols — Mais Lidas no topo, Leia Também e card compacto de Reels abaixo) */}
            <aside
              aria-label="Conteúdo complementar e ranking"
              className="space-y-6 lg:sticky lg:top-20 lg:col-span-4 lg:self-start"
            >
              {/* Ranking "Mais Lidas Agora" (#1 a #5) no topo para evitar capa duplicada lado a lado */}
              {mostReadList.length > 0 && (
                <section
                  aria-labelledby="sidebar-mais-lidas"
                  className="rounded-lg border-2 border-border-strong bg-surface p-4 shadow-hard-sm"
                >
                  <div className="mb-3 flex items-center gap-2 border-b-2 border-border-strong pb-2.5">
                    <Flame className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden="true" />
                    <h2
                      id="sidebar-mais-lidas"
                      className="font-headline text-xl font-extrabold uppercase tracking-tight text-ink-primary"
                    >
                      Mais Lidas Agora
                    </h2>
                  </div>

                  <ol className="divide-y divide-border-subtle">
                    {mostReadList.map((item, idx) => (
                      <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1">
                        <span className="w-7 shrink-0 font-display text-2xl leading-none text-brand">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <CategoryBadge category={item.category} />
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted">
                              <TrendingUp className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                              {formatCompactNumber(item.viewsCount)}
                            </span>
                          </div>
                          <Link
                            href={`/noticia/${item.slug}`}
                            className="line-clamp-2 block font-sans text-sm font-bold leading-snug text-ink-primary hover:text-brand"
                          >
                            {item.headline}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Bloco "Leia Também" (3 matérias relacionadas com miniatura lateral) */}
              {relatedList.length > 0 && (
                <section
                  aria-labelledby="sidebar-leia-tambem"
                  className="rounded-lg border-2 border-border-strong bg-surface p-4 shadow-hard-sm"
                >
                  <h2
                    id="sidebar-leia-tambem"
                    className="mb-3 border-b-2 border-border-strong pb-2.5 font-headline text-xl font-extrabold uppercase tracking-tight text-ink-primary"
                  >
                    Leia Também
                  </h2>

                  <ul className="space-y-3.5">
                    {relatedList.map((rel) => (
                      <li key={rel.id} className="group flex items-start gap-3">
                        <Link
                          href={`/noticia/${rel.slug}`}
                          tabIndex={-1}
                          aria-hidden="true"
                          className="h-16 w-20 shrink-0 overflow-hidden rounded border-2 border-border-strong"
                        >
                          <EditorialCoverArt
                            coverImageUrl={rel.coverImageUrl}
                            coverArtKey={rel.coverArtKey}
                            category={rel.category}
                            alt={rel.headline}
                            aspectClass="h-full w-full"
                            compact
                            decorative
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-1.5">
                            <CategoryBadge category={rel.category} />
                            <span className="font-mono text-[11px] text-ink-muted">
                              {formatRelativeDate(rel.publishedAt)}
                            </span>
                          </div>
                          <Link
                            href={`/noticia/${rel.slug}`}
                            className="line-clamp-2 block font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand"
                          >
                            {rel.headline}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Card compacto "Assista em Reels" na base da sidebar */}
              <div
                data-chrome="dark"
                className="overflow-hidden rounded-lg border-2 border-border-strong bg-chrome text-chrome-ink shadow-hard"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-display text-lg tracking-wider text-highlight">
                    <Film className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    ASSISTA EM REELS
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase text-chrome-muted">
                    Resumo rápido
                  </span>
                </div>
                <Link
                  href={`/reels?id=${article.slug}`}
                  className="group relative block aspect-[16/10] w-full overflow-hidden"
                >
                  <EditorialCoverArt
                    coverImageUrl={article.coverImageUrl}
                    coverArtKey={article.coverArtKey}
                    category={article.category}
                    alt={article.headline}
                    aspectClass="h-full w-full"
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-4"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(9,10,15,0.96) 0%, rgba(9,10,15,0.78) 52%, rgba(9,10,15,0.18) 100%)',
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <CategoryBadge category={article.category} />
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-highlight bg-brand-fill text-white transition-transform group-hover:scale-105">
                        <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2} aria-hidden="true" />
                      </span>
                    </div>
                    <p className="line-clamp-2 font-headline text-lg font-bold leading-tight text-white group-hover:text-highlight">
                      {article.headline}
                    </p>
                  </div>
                </Link>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
