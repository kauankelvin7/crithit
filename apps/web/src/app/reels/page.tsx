import type { Metadata } from 'next';
import { ReelsPlayer } from '@/components/reels/ReelsPlayer';
import { fetchReelsFeed } from '@/lib/api-client';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'CritHit Reels 9:16',
  description:
    'Feed vertical de notícias geek em formato 9:16 com resumo direto, filtros por editoria e atribuição completa.',
  alternates: {
    canonical: '/reels',
  },
  openGraph: {
    title: 'CritHit Reels 9:16 — Notícias Geek em Formato Vertical',
    description:
      'Acompanhe as principais novidades de games, quadrinhos, cinema, animes e tech em leitura rápida 9:16.',
    type: 'website',
    url: '/reels',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CritHit Reels 9:16',
    description: 'Feed vertical de notícias geek com filtros por editoria e fontes verificadas.',
  },
};

interface ReelsPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ReelsPage({ searchParams }: ReelsPageProps) {
  const params = await searchParams;
  const focusSlug = params.id?.trim() || undefined;
  const feed = await fetchReelsFeed({ focusSlug });

  return (
    <main id="conteudo-principal" className="flex flex-1 flex-col bg-[#0B0D12]">
      <ReelsPlayer
        initialItems={feed.items}
        initialFocusSlug={focusSlug}
        initialFocusFound={feed.focusSlugFound}
      />
    </main>
  );
}
