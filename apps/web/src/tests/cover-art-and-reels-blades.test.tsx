import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EditorialCoverArt } from '@/components/EditorialCoverArt';
import { ReelsPlayer } from '@/components/reels/ReelsPlayer';
import { MOCK_ARTICLES } from '@/lib/mock-data';

describe('EditorialCoverArt com foto real (coverImageUrl)', () => {
  it('renderiza elemento <img> no modo padrão quando coverImageUrl http(s) é válida', () => {
    render(
      <EditorialCoverArt
        coverImageUrl="https://cdn.crithit.com.br/fotos/dino-crisis-capa.jpg"
        coverArtKey="dino-survival"
        category="GAMES"
        alt="Capa real de Dino Crisis"
      />,
    );

    const img = screen.getByRole('img', { name: 'Capa real de Dino Crisis' });
    expect(img).toHaveAttribute('src', 'https://cdn.crithit.com.br/fotos/dino-crisis-capa.jpg');
    expect(img.className).toContain('object-cover');
  });

  it('renderiza backdrop desfocado + foto nítida no modo fullBleed para Reels', () => {
    const { container } = render(
      <EditorialCoverArt
        coverImageUrl="https://cdn.crithit.com.br/fotos/frieren-temporada-2.webp"
        coverArtKey="anime"
        category="ANIMES"
        alt="Capa real de Frieren"
        fullBleed
      />,
    );

    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    expect(imgs[0].className).toContain('blur-2xl');
    expect(imgs[1]).toHaveAttribute('alt', 'Capa real de Frieren');
    expect(imgs[1]).toHaveAttribute(
      'src',
      'https://cdn.crithit.com.br/fotos/frieren-temporada-2.webp',
    );
  });
});

describe('ReelsPlayer — Micro-Stories de 3 lâminas', () => {
  it('alterna entre Lâmina 1 (Capa), Lâmina 2 (Em 10 segundos) e Lâmina 3 (Contexto e fontes)', async () => {
    const user = userEvent.setup();
    const sample = MOCK_ARTICLES.slice(0, 2);

    render(<ReelsPlayer initialItems={sample} />);

    // Lâmina 1 ativa inicialmente: exibe headline e resumo
    expect(
      screen.getByRole('heading', { name: /Capcom confirma remake de Dino Crisis/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/AO VIVO/i)).not.toBeInTheDocument();

    // Avança para Lâmina 2 (Em 10 segundos)
    const nextBtn = screen.getAllByRole('button', { name: /Próxima lâmina/i })[0];
    await user.click(nextBtn);
    expect(screen.getByText(/Em 10 segundos/i)).toBeInTheDocument();
    expect(screen.getByText(sample[0].subheadlineBullets[0])).toBeInTheDocument();

    // Avança para Lâmina 3 (Contexto e fontes)
    await user.click(nextBtn);
    expect(screen.getByText(/Contexto e fontes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fonte principal/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Similaridade/i)).not.toBeInTheDocument();
  });
});
