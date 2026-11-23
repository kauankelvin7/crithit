import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminArticleForm } from '@/components/admin/AdminArticleForm';
import type { AdminArticleDetail } from '@/lib/types';

const SAMPLE_DRAFT: AdminArticleDetail = {
  id: '10000000-0000-4000-8000-000000000099',
  slug: 'rascunho-teste-admin',
  status: 'PENDING_REVIEW',
  aiStatus: 'SUCCESS',
  category: 'GAMES',
  editorialFormat: 'NEWS',
  headline: 'Estúdio anuncia novo RPG tático para 2027',
  subheadlineBullets: ['Combate em turnos clássico', 'Lançamento simultâneo no PC e consoles'],
  lead: 'O estúdio anunciou oficialmente o desenvolvimento de um novo RPG tático previsto para 2027.',
  bodyParagraphs: [
    'O projeto está em desenvolvimento há três anos com foco em narrativa ramificada e combate tático.',
  ],
  reelsSummary: 'Novo RPG tático anunciado para 2027 com combate em turnos clássico para PC e consoles.',
  tags: ['RPG', 'Games'],
  coverImageUrl: null,
  coverArtKey: 'editorial-games-default',
  readingTimeMinutes: 3,
  reviewScore: null,
  isMainHeadline: false,
  isUrgent: false,
  viewsCount: 0,
  likesCount: 0,
  savesCount: 0,
  commentsCount: 0,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  scheduledAt: null,
  unpublishedAt: null,
  discardedAt: null,
  matchedSourcesCount: 1,
  rawTitle: 'Studio announces new tactical RPG for 2027',
  rawExcerpt: 'Turn-based tactical combat.',
  editorialNotes: [],
  matchedSources: [],
  attribution: {
    authorName: 'Rafael Mendes',
    contentType: 'CURADORIA',
    sourceName: 'Gematsu',
    sourceUrl: 'https://www.gematsu.com/new-tactical-rpg',
  },
};

describe('AdminArticleForm — Validação de atribuição e URLs http(s)', () => {
  it('bloqueia aprovação quando sourceUrl usa protocolo javascript: ou authorName está vazio', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onSaveEdits = vi.fn();

    render(
      <AdminArticleForm
        article={SAMPLE_DRAFT}
        mode="review"
        onSaveEdits={onSaveEdits}
        onApprove={onApprove}
      />,
    );

    const authorInput = screen.getByLabelText(/autor \/ revisor/i);
    const sourceUrlInput = screen.getByLabelText(/url da fonte original/i);
    const coverInput = screen.getByLabelText(/url da imagem de capa/i);

    await user.clear(authorInput);
    await user.clear(sourceUrlInput);
    await user.type(sourceUrlInput, 'javascript:alert(1)');
    await user.type(coverInput, 'data:image/svg+xml,<svg/>');

    await user.click(screen.getByRole('button', { name: /aprovar e publicar/i }));

    expect(onApprove).not.toHaveBeenCalled();
    expect(screen.getByText(/nome do autor é obrigatório/i)).toBeInTheDocument();
    expect(
      screen.getByText(/url da fonte obrigatória e deve iniciar com http:\/\/ ou https:\/\//i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/url da imagem de capa deve iniciar com http:\/\/ ou https:\/\//i),
    ).toBeInTheDocument();
  });

  it('permite aprovar quando todos os campos obrigatórios e URLs https:// são válidos', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();

    render(
      <AdminArticleForm
        article={SAMPLE_DRAFT}
        mode="review"
        onSaveEdits={vi.fn()}
        onApprove={onApprove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /aprovar e publicar/i }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove.mock.calls[0][0].sourceUrl).toBe('https://www.gematsu.com/new-tactical-rpg');
  });
});
