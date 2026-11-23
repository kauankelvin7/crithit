import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 2 — CritHit Reels 9:16 (/reels e /reels?id=<slug>)', () => {
  test('deep-link /reels?id=<slug> abre diretamente no card correspondente', async ({ page }) => {
    await setupApiMocks(page);
    const targetSlug = 'frieren-segunda-temporada-madhouse-data-estreia';

    await page.goto(`/reels?id=${targetSlug}`);

    const targetCard = page.locator(`article[data-reel-slug="${targetSlug}"]`);
    await expect(targetCard).toBeVisible();
    await expect(targetCard.locator('h1')).toContainText(/Frieren/i);

    // Verifica que o card alvo está posicionado no viewport do container de feed
    const isNearTop = await targetCard.evaluate((el) => {
      const container = el.parentElement;
      if (!container) return false;
      const cardRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return Math.abs(cardRect.top - containerRect.top) < 80;
    });
    expect(isNearTop).toBe(true);
  });

  test('filtra por editoria e restaura para Todos', async ({ page }) => {
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

  test('curtir, salvar e comentar com escape XSS e preservação da posição de scroll + focus trap/Escape no drawer', async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.goto('/reels');
    await page.waitForLoadState('networkidle');

    const feed = page.locator('div[aria-label="Feed vertical CritHit Reels"]');
    await expect(page.locator('article[data-reel-index="0"] h1')).toBeVisible();

    // Avança para o 2º Reel via teclado (ArrowDown) e aguarda o scroll-snap assentar no 2º card
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

    // Abrir CommentsDrawer e testar XSS + Focus Trap + Escape
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const commentBtn = secondCard.getByRole('button', { name: /Abrir comentários/i });
    await commentBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Focus inicial no botão de fechar dentro do drawer
    const closeBtn = dialog.getByRole('button', { name: 'Fechar comentários' });
    await expect(closeBtn).toBeFocused();

    // Verifica Focus Trap: Shift+Tab no primeiro elemento foca o último elemento dentro do dialog
    await page.keyboard.press('Shift+Tab');
    const focusedInsideDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(focusedInsideDialog).toBe(true);

    // Envia comentário com payload XSS
    const xssPayload = `<script>alert('xss')</script> Comentário seguro de QA`;
    await dialog.getByLabel('Seu nome').fill('QA Auditor');
    await dialog.getByLabel('Comentário', { exact: true }).fill(xssPayload);
    await dialog.getByRole('button', { name: 'Publicar comentário' }).click();

    // Payload deve ser renderizado como texto literal (escaped), sem executar script nem criar nó <script>
    await expect(dialog.getByText(xssPayload)).toBeVisible();
    expect(alertTriggered).toBe(false);
    expect(await dialog.locator('script').count()).toBe(0);

    // Escape fecha o drawer e devolve o foco ao botão acionador
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(commentBtn).toBeFocused();

    // Preservação do scroll após fechar drawer
    const scrollAfterDrawer = await feed.evaluate((el) => el.scrollTop);
    expect(Math.abs(scrollAfterDrawer - scrollBefore)).toBeLessThan(20);

    // ArrowUp retorna ao 1º Reel
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(450);
    await expect(page.locator('article[data-reel-index="0"] h1')).toBeVisible();
  });
});
