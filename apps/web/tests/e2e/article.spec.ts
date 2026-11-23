import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 3 — Leitor de Matéria (/noticia/[slug])', () => {
  test('matéria CURADORIA exibe atribuição completa, link externo seguro, TransparencyNotice e CTA para Reels', async ({
    page,
  }) => {
    await setupApiMocks(page);
    const slug = 'capcom-confirma-remake-dino-crisis-re-engine-2027';

    const response = await page.goto(`/noticia/${slug}`);
    expect(response?.status()).toBe(200);

    // Breadcrumb editorial
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Capa');
    await expect(breadcrumb).toContainText('Games');

    const article = page.locator('main > article');
    await expect(article.locator('h1')).toContainText('Capcom confirma remake de Dino Crisis');

    // Atribuição completa: authorName, CURADORIA, sourceName e link http(s) seguro
    await expect(article).toContainText('Por Rafael Mendes');
    await expect(article).toContainText('CURADORIA');
    await expect(article).toContainText('Fonte: Gematsu');

    const sourceLink = article.locator('a', { hasText: 'Fonte: Gematsu' }).first();
    await expect(sourceLink).toHaveAttribute('href', /^https?:\/\//);
    await expect(sourceLink).toHaveAttribute('target', '_blank');
    await expect(sourceLink).toHaveAttribute('rel', /noopener/);
    await expect(sourceLink).toHaveAttribute('rel', /noreferrer/);

    // TransparencyNotice presente em CURADORIA
    const notice = page.locator('aside[aria-label="Transparência editorial"]');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Gematsu');
    await expect(notice).toContainText('revisão humana');

    // Fontes & Transparência + Sidebar Mais Lidas + Comentários integrados
    await expect(article.getByRole('heading', { name: /Fontes & Transparência Editorial/i })).toBeVisible();
    await expect(article.getByRole('heading', { name: /Mais Lidas Agora/i })).toBeVisible();
    await expect(article.getByRole('heading', { name: /Comentários da Comunidade/i })).toBeVisible();

    // Links/CTAs para /reels?id=<slug>
    const reelsLinks = page.locator(`a[href="/reels?id=${slug}"]`);
    expect(await reelsLinks.count()).toBeGreaterThanOrEqual(1);
    await expect(reelsLinks.first()).toBeVisible();
  });

  test('matéria AUTORAL exibe atribuição completa e NÃO exibe TransparencyNotice', async ({
    page,
  }) => {
    await setupApiMocks(page);
    const slug = 'review-metaphor-refantazio-combate-tatico-ritmo';

    const response = await page.goto(`/noticia/${slug}`);
    expect(response?.status()).toBe(200);

    const article = page.locator('main > article');
    await expect(article.locator('h1')).toContainText(/Metaphor/i);
    await expect(article).toContainText('AUTORAL');

    const externalSourceLink = article.locator('a[target="_blank"]').first();
    await expect(externalSourceLink).toHaveAttribute('href', /^https?:\/\//);
    await expect(externalSourceLink).toHaveAttribute('rel', /noopener/);
    await expect(externalSourceLink).toHaveAttribute('rel', /noreferrer/);

    // TransparencyNotice ausente em AUTORAL
    await expect(page.locator('aside[aria-label="Transparência editorial"]')).toHaveCount(0);

    // Link para Reels
    await expect(page.locator(`a[href="/reels?id=${slug}"]`).first()).toBeVisible();
  });

  test('retorna HTTP 404 para slug inexistente', async ({ page }) => {
    await setupApiMocks(page);
    const response = await page.goto('/noticia/slug-completamente-inexistente-404');
    expect(response?.status()).toBe(404);
  });
});
