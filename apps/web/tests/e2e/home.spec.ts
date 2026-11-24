import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 1 — Home Editorial (/), Busca & Tema', () => {
  test('renderiza Plantão Geek, Hero principal + 3 secundárias, Giro Geek e Newsletter Loot Diário', async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.goto('/');

    // Plantão Geek
    await expect(page.getByText('PLANTÃO GEEK', { exact: false }).first()).toBeVisible();

    // Isolamento total do Admin: nenhum link para /admin deve existir no portal público
    await expect(page.locator('a[href="/admin"]')).toHaveCount(0);
    await expect(page.locator('header').getByText(/Redação|Admin/i)).toHaveCount(0);
    await expect(page.locator('footer').getByText(/Painel da Redação|Admin/i)).toHaveCount(0);

    // Hero Principal (h1) + 3 destaques secundários
    const heroSection = page.getByRole('region', { name: 'Destaques principais da capa' });
    await expect(heroSection.locator('h1')).toBeVisible();
    await expect(heroSection.locator('h1')).toContainText(
      'Capcom confirma remake de Dino Crisis para 2027 com motor RE Engine',
    );

    // 3 cards secundários no grid de 3 colunas abaixo do Hero
    const secondaryGrid = heroSection.locator('.sm\\:grid-cols-3 > article');
    await expect(secondaryGrid).toHaveCount(3);

    // Giro Geek (até 8 cards em 4 colunas)
    const giroSection = page.locator('section[aria-labelledby="giro-geek-heading"]');
    await expect(giroSection.getByRole('heading', { name: /Giro Geek/i })).toBeVisible();
    const giroCards = giroSection.locator('article');
    expect(await giroCards.count()).toBeGreaterThanOrEqual(4);
    expect(await giroCards.count()).toBeLessThanOrEqual(8);

    // Sem termo técnico 9:16 na interface pública
    await expect(page.locator('body')).not.toContainText('9:16');

    // Todas as 5 editorias visíveis em #editorias
    const editorias = page.locator('#editorias');
    await expect(editorias).toContainText('Games');
    await expect(editorias).toContainText('Quadrinhos');
    await expect(editorias).toContainText('Cinema');
    await expect(editorias).toContainText('Animes');
    await expect(editorias).toContainText('Tech');

    // Newsletter Loot Diário — validação de erro e sucesso
    const newsletter = page.locator('#newsletter');
    await expect(newsletter.getByRole('heading', { name: /Loot Diário/i })).toBeVisible();

    const emailInput = newsletter.getByLabel('Seu e-mail para receber o Loot Diário');
    const submitBtn = newsletter.getByRole('button', { name: /Assinar/i });

    // E-mail inválido exibe erro acessível via aria-describedby
    await emailInput.fill('email-invalido');
    await submitBtn.click();
    const alertBox = newsletter.getByRole('alert');
    await expect(alertBox).toBeVisible();
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(emailInput).toHaveAttribute('aria-describedby', /.+/);

    // E-mail válido envia e confirma
    await emailInput.fill('leitor.qa@crithit.com.br');
    await submitBtn.click();
    await expect(newsletter.getByRole('status')).toContainText(/Inscrição confirmada/i);
    await expect(newsletter.getByRole('button', { name: /Inscrito/i })).toBeDisabled();
  });

  test('busca funcional em Desktop (1440x900) e Mobile (390x844)', async ({ page }) => {
    await setupApiMocks(page);

    // Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const desktopSearch = page.getByLabel('Buscar notícias', { exact: true });
    await expect(desktopSearch).toBeVisible();
    await desktopSearch.fill('Capcom');
    await desktopSearch.press('Enter');

    await expect(page).toHaveURL(/\/\?q=Capcom/);
    const resultsSection = page.getByRole('region', { name: 'Resultados da busca editorial' });
    await expect(resultsSection).toBeVisible();
    await expect(resultsSection).toContainText('Resultados para "Capcom"');
    await expect(resultsSection.locator('article').first()).toContainText('Dino Crisis');
    // Hero padrão não se repete abaixo da busca ativa
    await expect(page.getByRole('region', { name: 'Destaques principais da capa' })).toHaveCount(0);

    // Limpar busca
    await resultsSection.getByRole('link', { name: /Limpar filtro/i }).click();
    await expect(page).toHaveURL(/\/$/);

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const mobileSearch = page.getByLabel('Buscar notícias no celular');
    await expect(mobileSearch).toBeVisible();
    await mobileSearch.fill('Frieren');
    await mobileSearch.press('Enter');

    await expect(page).toHaveURL(/\/\?q=Frieren/);
    const mobileResults = page.getByRole('region', { name: 'Resultados da busca editorial' });
    await expect(mobileResults).toBeVisible();
    await expect(mobileResults).toContainText('Frieren');
  });

  test('alternância Modo Claro / Modo Escuro persiste após page.reload()', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');

    // Inicia em claro ou alterna para escuro explicitamente
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    const targetTheme = initialTheme === 'dark' ? 'light' : 'dark';

    const toggleBtn = page.getByRole('button', {
      name: initialTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro',
    });
    await toggleBtn.click();

    await expect(html).toHaveAttribute('data-theme', targetTheme);
    if (targetTheme === 'dark') {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }

    const stored = await page.evaluate(() => window.localStorage.getItem('crithit-theme'));
    expect(stored).toBe(targetTheme);

    // Recarrega e confirma persistência sem FOUC
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', targetTheme);
    if (targetTheme === 'dark') {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });
});
