import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttributionBadge, TransparencyNotice } from '@/components/AttributionBadge';

describe('AttributionBadge e TransparencyNotice', () => {
  it('exibe TransparencyNotice quando contentType for CURADORIA com link externo seguro', () => {
    render(
      <TransparencyNotice
        contentType="CURADORIA"
        sourceName="Gematsu"
        sourceUrl="https://www.gematsu.com/noticia-exemplo"
      />,
    );

    expect(screen.getByLabelText(/transparência editorial/i)).toBeInTheDocument();
    expect(screen.getByText(/adaptada para o português pela redação do CritHit!/i)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /gematsu/i });
    expect(link).toHaveAttribute('href', 'https://www.gematsu.com/noticia-exemplo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('não exibe TransparencyNotice quando contentType for AUTORAL', () => {
    const { container } = render(
      <TransparencyNotice
        contentType="AUTORAL"
        sourceName="CritHit! Redação"
        sourceUrl="https://crithit.com.br/noticia/review-exemplo"
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renderiza link seguro em AttributionBadge e bloqueia protocolo javascript:', () => {
    const { rerender } = render(
      <AttributionBadge
        authorName="Rafael Mendes"
        contentType="CURADORIA"
        sourceName="IGN"
        sourceUrl="https://www.ign.com/articles/exemplo"
      />,
    );

    const link = screen.getByRole('link', { name: /fonte: ign/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    rerender(
      <AttributionBadge
        authorName="Rafael Mendes"
        contentType="CURADORIA"
        sourceName="Fonte Maliciosa"
        sourceUrl="javascript:alert(1)"
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/fonte: fonte maliciosa/i)).toBeInTheDocument();
  });

  it('omite link externo de fonte em AttributionBadge quando contentType for AUTORAL', () => {
    render(
      <AttributionBadge
        authorName="Rafael Mendes"
        contentType="AUTORAL"
        sourceName="CritHit! Redação"
        sourceUrl="https://crithit.com.br/noticia/review-exemplo"
      />,
    );

    expect(screen.getByText('AUTORAL')).toBeInTheDocument();
    expect(screen.getByText(/por rafael mendes/i)).toBeInTheDocument();
    expect(screen.queryByText(/fonte:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
