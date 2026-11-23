import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ReelsPlayer } from '@/components/reels/ReelsPlayer';
import { MOCK_ARTICLES } from '@/lib/mock-data';

describe('ReelsPlayer — Filtros por editoria e estado vazio', () => {
  it('filtra os Reels por editoria (GAMES / ANIMES) e permite voltar para TODOS', async () => {
    const user = userEvent.setup();
    const subset = MOCK_ARTICLES.filter(
      (a) => a.category === 'GAMES' || a.category === 'ANIMES',
    );

    render(<ReelsPlayer initialItems={subset} />);

    const gamesBtn = screen.getByRole('button', { name: /^games$/i });
    const animesBtn = screen.getByRole('button', { name: /^animes$/i });
    const techBtn = screen.getByRole('button', { name: /^tech$/i });

    await user.click(animesBtn);
    expect(animesBtn).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('heading', { name: /frieren e a jornada para o além/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /dino crisis/i })).not.toBeInTheDocument();

    // Editoria sem itens exibe estado vazio com botão de recuperação
    await user.click(techBtn);
    expect(screen.getByText(/nenhum reel nesta editoria/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ver todas as editorias/i }));
    expect(screen.getByRole('heading', { name: /dino crisis/i })).toBeInTheDocument();

    await user.click(gamesBtn);
    expect(gamesBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: /dino crisis/i })).toBeInTheDocument();
  });

  it('exibe aviso discreto quando focusSlug não é encontrado sem quebrar o feed', () => {
    render(
      <ReelsPlayer
        initialItems={MOCK_ARTICLES.slice(0, 2)}
        initialFocusSlug="slug-inexistente"
        initialFocusFound={false}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/não está disponível/i);
    expect(screen.getByRole('heading', { name: /dino crisis/i })).toBeInTheDocument();
  });
});
