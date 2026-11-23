import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  it('alterna entre modo claro e modo escuro atualizando data-theme, classe dark e localStorage', async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute('data-theme', 'light');

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /ativar modo escuro/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('crithit-theme')).toBe('dark');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAccessibleName(/ativar modo claro/i);

    await user.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('crithit-theme')).toBe('light');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
