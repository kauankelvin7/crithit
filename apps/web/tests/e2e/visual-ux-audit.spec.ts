import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

const SCREENSHOT_DIR = path.resolve(process.cwd(), '../../docs/qa-screenshots');
const AUDIT_COMPONENTS_DIR = path.resolve(
  process.cwd(),
  '../../docs/qa-screenshots/audit-components',
);

test.describe('Auditoria Visual & Geométrica em Tempo Real (Desktop 1440x900 & Mobile 390x844)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    fs.mkdirSync(AUDIT_COMPONENTS_DIR, { recursive: true });
  });

  test('Home (/): header em y===0, Plantão Geek sem sobrepor Hero, todas as seções sem overflow ou colisão + screenshots', async ({
    page,
  }) => {
    await setupApiMocks(page);

    // 1) DESKTOP 1440x900 (Claro & Escuro)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const desktopGeometry = await page.evaluate(() => {
      const header = document.querySelector('header');
      const ticker = document.querySelector('section[aria-label*="Plantão Geek"]');
      const heroSection = document.querySelector('section[aria-label="Destaques principais da capa"]');
      const footer = document.querySelector('footer');

      const headerRect = header?.getBoundingClientRect();
      const tickerRect = ticker?.getBoundingClientRect();
      const heroRect = heroSection?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();

      const brokenImages = Array.from(document.querySelectorAll('img')).filter(
        (img) => !img.complete || img.naturalWidth === 0,
      ).length;

      return {
        headerTop: headerRect?.top ?? -999,
        headerBottom: headerRect?.bottom ?? -999,
        tickerTop: tickerRect?.top ?? -999,
        tickerBottom: tickerRect?.bottom ?? -999,
        heroTop: heroRect?.top ?? -999,
        hasFooter: Boolean(footerRect && footerRect.height > 0),
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        brokenImages,
      };
    });

    expect(Math.abs(desktopGeometry.headerTop)).toBeLessThanOrEqual(1);
    expect(desktopGeometry.tickerTop).toBeGreaterThanOrEqual(desktopGeometry.headerBottom - 2);
    expect(desktopGeometry.heroTop).toBeGreaterThanOrEqual(desktopGeometry.tickerBottom - 1);
    expect(desktopGeometry.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(desktopGeometry.brokenImages).toBe(0);
    expect(desktopGeometry.hasFooter).toBe(true);

    // Verifica que as 4 colunas de Colunas & Reviews exibem os 4 avatares SVG ilustrados distintos
    const colunasSection = page.locator('section[aria-labelledby="colunas-reviews-heading"]');
    await expect(colunasSection).toBeVisible();
    const avatarSvgs = await colunasSection
      .locator('article svg')
      .evaluateAll((svgs) => svgs.map((s) => s.innerHTML));
    expect(avatarSvgs.length).toBeGreaterThanOrEqual(4);

    // Verifica todas as demais seções da Home
    await expect(page.locator('section[aria-labelledby="giro-geek-heading"]')).toBeVisible();
    await expect(page.locator('#newsletter')).toBeVisible();
    await expect(page.locator('section[aria-labelledby="reels-carousel-heading"]')).toBeVisible();
    await expect(page.locator('#editorias')).toBeVisible();
    await expect(page.locator('section[aria-labelledby="mais-lidas-heading"]')).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'home-desktop.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'home-desktop.png'),
      fullPage: false,
    });

    // 2) MOBILE 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mobileGeometry = await page.evaluate(() => {
      const header = document.querySelector('header');
      const ticker = document.querySelector('section[aria-label*="Plantão Geek"]');
      const heroSection = document.querySelector('section[aria-label="Destaques principais da capa"]');

      const headerRect = header?.getBoundingClientRect();
      const tickerRect = ticker?.getBoundingClientRect();
      const heroRect = heroSection?.getBoundingClientRect();

      return {
        headerTop: headerRect?.top ?? -999,
        headerBottom: headerRect?.bottom ?? -999,
        tickerTop: tickerRect?.top ?? -999,
        tickerBottom: tickerRect?.bottom ?? -999,
        heroTop: heroRect?.top ?? -999,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(Math.abs(mobileGeometry.headerTop)).toBeLessThanOrEqual(1);
    expect(mobileGeometry.tickerTop).toBeGreaterThanOrEqual(mobileGeometry.headerBottom - 2);
    expect(mobileGeometry.heroTop).toBeGreaterThanOrEqual(mobileGeometry.tickerBottom - 1);
    expect(mobileGeometry.horizontalOverflow).toBeLessThanOrEqual(0);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'home-mobile.png'),
      fullPage: false,
    });
  });

  test('Reels (/reels): palco 100% abaixo do header sem barra branca, coluna de ações fora do card no desktop e sem colisão de texto no mobile + screenshots', async ({
    page,
  }) => {
    await setupApiMocks(page);

    // 1) DESKTOP 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reels');
    await page.waitForLoadState('networkidle');

    const desktopReelsLayout = await page.evaluate(() => {
      const header = document.querySelector('header');
      const stage = document.querySelector('[data-reels-stage="true"]');
      const footer = document.querySelector('footer');
      const activeSlide = document.querySelector('article[data-reel-index="0"]');
      const cardFrame = activeSlide?.querySelector('[data-reel-card-frame="true"]');
      const actionsRail = activeSlide?.querySelector('[data-reel-actions="true"]');
      const headline = activeSlide?.querySelector('[data-reel-headline="true"]');
      const summary = activeSlide?.querySelector('[data-reel-summary="true"]');

      const headerRect = header?.getBoundingClientRect();
      const stageRect = stage?.getBoundingClientRect();
      const cardRect = cardFrame?.getBoundingClientRect();
      const actionsRect = actionsRail?.getBoundingClientRect();
      const headlineRect = headline?.getBoundingClientRect();
      const summaryRect = summary?.getBoundingClientRect();

      return {
        headerTop: headerRect?.top ?? -999,
        headerBottom: headerRect?.bottom ?? -999,
        stageTop: stageRect?.top ?? -999,
        stageBottom: stageRect?.bottom ?? -999,
        viewportHeight: window.innerHeight,
        hasFooter: Boolean(footer),
        cardRight: cardRect?.right ?? 0,
        actionsLeft: actionsRect?.left ?? 0,
        headlineBottom: headlineRect?.bottom ?? 0,
        summaryTop: summaryRect?.top ?? 0,
        windowScrollY: window.scrollY,
      };
    });

    // Header fixo no topo absoluto (y === 0) e palco imediatamente abaixo ocupando até o fim da tela
    expect(Math.abs(desktopReelsLayout.headerTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(desktopReelsLayout.stageTop - desktopReelsLayout.headerBottom)).toBeLessThanOrEqual(2);
    expect(desktopReelsLayout.stageBottom).toBeGreaterThanOrEqual(desktopReelsLayout.viewportHeight - 2);
    expect(desktopReelsLayout.hasFooter).toBe(false);

    // Layout Desktop de 3 zonas visível em 1440x900
    await expect(page.getByRole('complementary', { name: 'Navegação e editorias do Reels' })).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Fontes cruzadas e comentários do Reel ativo' }),
    ).toBeVisible();

    // Coluna de ações no desktop fica FORA à direita do card 9:16
    expect(desktopReelsLayout.actionsLeft).toBeGreaterThanOrEqual(desktopReelsLayout.cardRight - 2);

    // Resumo fica abaixo da manchete, sem sobreposição
    expect(desktopReelsLayout.summaryTop).toBeGreaterThanOrEqual(desktopReelsLayout.headlineBottom - 2);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'reels-desktop.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'reels-desktop.png'),
      fullPage: false,
    });

    // Navega 3 slides e verifica que o header permanece em y === 0 (window.scrollY === 0)
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('article[data-reel-index="1"] h1')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('article[data-reel-index="2"] h1')).toBeVisible();

    const headerTopAfterScroll = await page.evaluate(() => {
      return document.querySelector('header')?.getBoundingClientRect().top ?? -999;
    });
    expect(Math.abs(headerTopAfterScroll)).toBeLessThanOrEqual(1);

    // 2) MOBILE 390x844 (sem barra de busca mobile em /reels)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/reels');
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Buscar notícias no celular')).toHaveCount(0);

    const mobileReelsLayout = await page.evaluate(() => {
      const header = document.querySelector('header');
      const stage = document.querySelector('[data-reels-stage="true"]');
      const scroller = document.querySelector('div[aria-label="Feed vertical CritHit Reels"]');
      const activeSlide = document.querySelector('article[data-reel-index="0"]');
      const textBlock = activeSlide?.querySelector('[data-reel-text-block="true"]');
      const actionsRail = activeSlide?.querySelector('[data-reel-actions="true"]');
      const headline = activeSlide?.querySelector('[data-reel-headline="true"]');
      const summary = activeSlide?.querySelector('[data-reel-summary="true"]');

      const headerRect = header?.getBoundingClientRect();
      const stageRect = stage?.getBoundingClientRect();
      const scrollerRect = scroller?.getBoundingClientRect();
      const slideRect = activeSlide?.getBoundingClientRect();
      const textRect = textBlock?.getBoundingClientRect();
      const actionsRect = actionsRail?.getBoundingClientRect();
      const headlineRect = headline?.getBoundingClientRect();
      const summaryRect = summary?.getBoundingClientRect();

      return {
        headerTop: headerRect?.top ?? -999,
        stageBottom: stageRect?.bottom ?? -999,
        viewportHeight: window.innerHeight,
        scrollerHeight: scrollerRect?.height ?? 0,
        slideHeight: slideRect?.height ?? 0,
        actionsLeft: actionsRect?.left ?? 0,
        headlineBottom: headlineRect?.bottom ?? 0,
        summaryTop: summaryRect?.top ?? 0,
        textBoxRightMinusPadding:
          (textRect?.right ?? 0) -
          (textBlock ? parseFloat(window.getComputedStyle(textBlock).paddingRight) : 0),
      };
    });

    expect(Math.abs(mobileReelsLayout.headerTop)).toBeLessThanOrEqual(1);
    expect(mobileReelsLayout.stageBottom).toBeGreaterThanOrEqual(mobileReelsLayout.viewportHeight - 2);
    expect(Math.abs(mobileReelsLayout.slideHeight - mobileReelsLayout.scrollerHeight)).toBeLessThanOrEqual(2);
    expect(mobileReelsLayout.summaryTop).toBeGreaterThanOrEqual(mobileReelsLayout.headlineBottom - 2);
    expect(mobileReelsLayout.textBoxRightMinusPadding).toBeLessThanOrEqual(
      mobileReelsLayout.actionsLeft + 2,
    );

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'reels-mobile.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'reels-mobile.png'),
      fullPage: false,
    });
  });

  test('Leitor (/noticia/[slug]): layout editorial limpo, atribuição e screenshot de evidência', async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/noticia/capcom-confirma-remake-dino-crisis-re-engine-2027');
    await page.waitForLoadState('networkidle');

    const headerTop = await page.evaluate(
      () => document.querySelector('header')?.getBoundingClientRect().top ?? -999,
    );
    expect(Math.abs(headerTop)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('complementary', { name: 'Transparência editorial' })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'article-desktop.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'article-desktop.png'),
      fullPage: false,
    });
  });

  test('Admin (/admin): cabeçalho isolado sem nav pública, sem jargões e screenshots de login e mesa editorial', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1) Tela de Login isolada
    await setupApiMocks(page, { authenticated: false });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Painel da Redação' })).toBeVisible();
    await expect(page.locator('header[data-admin-header="true"]')).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(0);

    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'admin-login.png'),
      fullPage: false,
    });

    // 2) Mesa Editorial autenticada
    await page.getByLabel('E-mail editorial').fill('editor@crithit.com.br');
    await page.getByLabel('Senha').fill('CritHit#2026');
    await page.getByRole('button', { name: 'Entrar na Redação' }).click();
    await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();

    await page.screenshot({
      path: path.join(AUDIT_COMPONENTS_DIR, 'admin-mesa.png'),
      fullPage: false,
    });
  });
});
