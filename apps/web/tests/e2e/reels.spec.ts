import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 2 — CritHit Reels 2.0 (/reels e /reels?id=<slug>)', () => {
  test('deep-link /reels?id=<slug> abre diretamente no card correspondente e navega nas 3 lâminas Micro-Stories', async ({
    page,
  }) => {
    await setupApiMocks(page);
    const targetSlug = 'frieren-segunda-temporada-madhouse-data-estreia';

    await page.goto(`/reels?id=${targetSlug}`);

    const targetCard = page.locator(`article[data-reel-slug="${targetSlug}"]`);
    await expect(targetCard).toBeVisible();
    await expect(targetCard.locator('h1')).toContainText(/Frieren/i);

    // Sem 9:16 e sem rótulo enganoso AO VIVO
    await expect(page.locator('body')).not.toContainText('9:16');
    await expect(page.locator('body')).not.toContainText('AO VIVO');

    // Verifica que o card alvo está posicionado no viewport do container de feed
    const isNearTop = await targetCard.evaluate((el) => {
      const container = el.parentElement;
      if (!container) return false;
      const cardRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return Math.abs(cardRect.top - containerRect.top) < 80;
    });
    expect(isNearTop).toBe(true);

    // Lâmina 1 -> Lâmina 2 (Em 10 segundos) -> Lâmina 3 (Contexto e fontes) via teclado
    await page.keyboard.press('ArrowRight');
    await expect(targetCard.getByText('Em 10 segundos')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(targetCard.getByText('Contexto e fontes')).toBeVisible();
    await expect(targetCard.getByText('Fonte principal')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(targetCard.getByText('Em 10 segundos')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(targetCard.locator('[data-reel-summary="true"]')).toBeVisible();
  });

  test('filtra por editoria e restaura para Todas', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/reels');

    const filterGroup = page.getByRole('group', { name: 'Filtrar Reels por editoria' });
    const totalBefore = await page.locator('article[data-reel-slug]').count();
    expect(totalBefore).toBeGreaterThan(2);

    // Filtra por Animes
    await filterGroup.getByRole('button', { name: 'Animes', exact: true }).click();
    await expect(filterGroup.getByRole('button', { name: 'Animes', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const animesCards = page.locator('article[data-reel-slug]');
    const animesCount = await animesCards.count();
    expect(animesCount).toBeGreaterThanOrEqual(1);
    expect(animesCount).toBeLessThan(totalBefore);
    await expect(animesCards.first()).toContainText(/Frieren/i);

    // Filtra por Games
    await filterGroup.getByRole('button', { name: 'Games', exact: true }).click();
    const gamesCount = await page.locator('article[data-reel-slug]').count();
    expect(gamesCount).toBeGreaterThanOrEqual(1);
    expect(gamesCount).toBeLessThan(totalBefore);

    // Restaura Todas
    await filterGroup.getByRole('button', { name: 'Todas', exact: true }).click();
    await expect(page.locator('article[data-reel-slug]')).toHaveCount(totalBefore);
  });

  test('desktop (>= 1280px): curtir, salvar e comentar inline no painel direito com escape XSS e preservação do scroll', async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reels');
    await page.waitForLoadState('networkidle');

    const feed = page.locator('div[aria-label="Feed vertical CritHit Reels"]');
    await expect(page.locator('article[data-reel-index="0"] h1')).toBeVisible();

    // Avança para o 2º Reel via teclado (ArrowDown)
    await page.keyboard.press('ArrowDown');
    const secondCard = page.locator('article[data-reel-index="1"]');
    await expect(secondCard.locator('h1')).toBeVisible();
    await expect
      .poll(async () => feed.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeGreaterThan(200);
    await page.waitForTimeout(250);

    const scrollBefore = await feed.evaluate((el) => el.scrollTop);
    expect(scrollBefore).toBeGreaterThan(0);

    // Curtir e Salvar mantendo posição de scroll
    const likeBtn = secondCard.getByRole('button', { name: /Curtir notícia/i });
    await likeBtn.click();
    await expect(secondCard.getByRole('button', { name: /Remover curtida/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const saveBtn = secondCard.getByRole('button', { name: /Salvar notícia/i });
    await saveBtn.click();
    await expect(secondCard.getByRole('button', { name: /Remover dos salvos/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const scrollAfterInteractions = await feed.evaluate((el) => el.scrollTop);
    expect(Math.abs(scrollAfterInteractions - scrollBefore)).toBeLessThan(20);

    // No desktop (>= 1280px), clicar em comentários foca diretamente o painel direito sem abrir modal duplicado
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const commentBtn = secondCard.getByRole('button', { name: /Abrir comentários/i });
    await commentBtn.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const rightPanel = page.getByRole('complementary', {
      name: 'Fontes cruzadas e comentários do Reel ativo',
    });
    const inlineInput = rightPanel.getByLabel('Comentar neste Reel');
    await expect(inlineInput).toBeFocused();

    const xssPayload = `<script>alert('xss')</script> Comentário seguro de QA`;
    await rightPanel.getByLabel('Seu nome').fill('QA Auditor');
    await inlineInput.fill(xssPayload);
    await rightPanel.getByRole('button', { name: 'Publicar' }).click();

    await expect(rightPanel.getByText(xssPayload)).toBeVisible();
    expect(alertTriggered).toBe(false);
    expect(await rightPanel.locator('script').count()).toBe(0);

    // Preservação do scroll e retorno via ArrowUp
    const scrollAfterComment = await feed.evaluate((el) => el.scrollTop);
    expect(Math.abs(scrollAfterComment - scrollBefore)).toBeLessThan(20);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(450);
    await expect(page.locator('article[data-reel-index="0"] h1')).toBeVisible();
  });

  test('mobile (< 1280px): abre CommentsDrawer escuro com focus trap, escape XSS, Escape e seletor Para Você/Em Alta/Salvos', async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/reels');
    await page.waitForLoadState('networkidle');

    // Seletor de modo mobile presente
    const mobileModes = page.getByRole('group', { name: 'Modos do feed no celular' });
    await expect(mobileModes).toBeVisible();
    await expect(mobileModes.getByRole('button', { name: /Em Alta/i })).toBeVisible();
    await expect(mobileModes.getByRole('button', { name: /Salvos/i })).toBeVisible();

    const firstCard = page.locator('article[data-reel-index="0"]');
    const commentBtn = firstCard.getByRole('button', { name: /Abrir comentários/i });
    await commentBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Focus inicial no botão de fechar dentro do drawer
    const closeBtn = dialog.getByRole('button', { name: 'Fechar comentários' });
    await expect(closeBtn).toBeFocused();

    // Verifica Focus Trap: Shift+Tab no primeiro elemento permanece dentro do dialog
    await page.keyboard.press('Shift+Tab');
    const focusedInsideDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(focusedInsideDialog).toBe(true);

    // Envia comentário com payload XSS
    let alertTriggered = false;
    page.on('dialog', async (d) => {
      alertTriggered = true;
      await d.dismiss();
    });

    const xssPayload = `<script>alert('xss')</script> Comentário mobile seguro`;
    await dialog.getByLabel('Seu nome').fill('QA Mobile');
    await dialog.getByLabel('Comentário', { exact: true }).fill(xssPayload);
    await dialog.getByRole('button', { name: 'Publicar comentário' }).click();

    await expect(dialog.getByText(xssPayload)).toBeVisible();
    expect(alertTriggered).toBe(false);
    expect(await dialog.locator('script').count()).toBe(0);

    // Escape fecha o drawer e devolve o foco ao botão acionador
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(commentBtn).toBeFocused();
  });
});
