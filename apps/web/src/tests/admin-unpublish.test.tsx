import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PublishedArticlesTab } from '@/components/admin/PublishedArticlesTab';
import type { AdminArticleSummary } from '@/lib/types';

const PUBLISHED_ARTICLE: AdminArticleSummary = {
  id: '10000000-0000-4000-8000-000000000050',
  slug: 'capcom-confirma-remake-dino-crisis-re-engine-2027',
  status: 'PUBLISHED',
  aiStatus: 'SUCCESS',
  category: 'GAMES',
  editorialFormat: 'NEWS',
  headline: 'Capcom confirma remake de Dino Crisis para 2027 com motor RE Engine',
  subheadlineBullets: [],
  lead: 'A Capcom oficializou o desenvolvimento do remake completo de Dino Crisis.',
  reelsSummary: 'Capcom confirma remake de Dino Crisis para 2027 na RE Engine.',
  tags: ['Capcom'],
  coverImageUrl: null,
  coverArtKey: 'editorial-games-default',
  readingTimeMinutes: 4,
  reviewScore: null,
  isMainHeadline: true,
  isUrgent: false,
  viewsCount: 28450,
  likesCount: 1920,
  savesCount: 840,
  commentsCount: 2,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  scheduledAt: null,
  unpublishedAt: null,
  discardedAt: null,
  matchedSourcesCount: 2,
  attribution: {
    authorName: 'Rafael Mendes',
    contentType: 'CURADORIA',
    sourceName: 'Gematsu',
    sourceUrl: 'https://www.gematsu.com/dino-crisis',
  },
};

describe('PublishedArticlesTab — Confirmação em 2 passos ao Tirar do ar', () => {
  it('exige confirmação explícita com foco inicial em Cancelar antes de chamar onUnpublish', async () => {
    const user = userEvent.setup();
    const onUnpublish = vi.fn();

    render(
      <PublishedArticlesTab
        articles={[PUBLISHED_ARTICLE]}
        onEdit={vi.fn()}
        onPromoteMainHeadline={vi.fn()}
        onUnpublish={onUnpublish}
        onRepublish={vi.fn()}
      />,
    );

    // Passo 1: clicar em "Tirar do ar" abre o diálogo de confirmação e não executa imediatamente
    await user.click(screen.getByRole('button', { name: /tirar do ar/i }));

    expect(onUnpublish).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(
      screen.getByText(/o histórico e as métricas serão preservados/i),
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /^cancelar$/i });
    expect(cancelBtn).toHaveFocus();

    // Passo 2: confirmar retirada do ar dispara o callback com o ID correto
    await user.click(screen.getByRole('button', { name: /confirmar retirada do ar/i }));

    expect(onUnpublish).toHaveBeenCalledTimes(1);
    expect(onUnpublish).toHaveBeenCalledWith(PUBLISHED_ARTICLE.id, undefined);
  });
});
