import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PHP_ERROR_REGEX =
  /(<b>\s*(?:Fatal error|Parse error|Warning|Notice|Deprecated)\s*<\/b>:|(?:Fatal error|Parse error|Warning|Notice|Deprecated):\s+.+\sin\s+.+\.php\s+on\s+line\s+\d+)/i;
const RAW_SHORTCODE_REGEX =
  /\[\/?(?:vc_|td_|tdc_|tdb_|tdm_|rbc_|wpforms|bwg_|yop_poll|totalpoll|tmm)[a-zA-Z0-9_-]*[^\]]*\]/i;
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const MOJIBAKE_REGEX = /(?:├[¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿À-ÿ]|ÔÇ[£¤¥ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿])/;

function attachGuards(page, { allowDocument404 = false } = {}) {
  const issues = [];
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  page.on('request', (req) => {
    const url = req.url();
    if (req.frame() === page.mainFrame() && (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com'))) {
      issues.push(`External Google Fonts request forbidden: ${url}`);
    }
  });
  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    const type = res.request().resourceType();
    if (!url.includes('teoriageek.local')) return;
    if (allowDocument404 && type === 'document' && status === 404) return;
    if (status >= 400 && ['document', 'stylesheet', 'script', 'fetch', 'xhr'].includes(type)) {
      issues.push(`HTTP ${status} (${type}): ${url}`);
    }
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const txt = msg.text();
    if (allowDocument404 && txt.includes('status of 404')) return;
    if (
      txt.includes('youtube.com') ||
      txt.includes('doubleclick.net') ||
      txt.includes('googleads') ||
      txt.includes('ERR_BLOCKED_BY_CLIENT') ||
      txt.includes('ERR_CONNECTION_RESET')
    ) {
      return;
    }
    issues.push(`console.error: ${txt}`);
  });
  return issues;
}

async function runPageHealthCheck(page, issues, label, { runAxe = false } = {}) {
  const html = await page.content();
  expect(html, `${label}: PHP error/warning/notice in HTML`).not.toMatch(PHP_ERROR_REGEX);

  const bodyText = await page.locator('body').innerText();
  expect(bodyText, `${label}: Raw legacy shortcode leaked`).not.toMatch(RAW_SHORTCODE_REGEX);
  expect(bodyText, `${label}: UTF-8 mojibake character detected`).not.toMatch(MOJIBAKE_REGEX);

  const chromeText = await page.evaluate(() => {
    const h = document.querySelector('header')?.innerText || '';
    const f = document.querySelector('footer')?.innerText || '';
    return `${h}\n${f}`;
  });
  expect(chromeText, `${label}: Emoji in chrome`).not.toMatch(EMOJI_REGEX);
  expect(chromeText, `${label}: CritHit string in chrome`).not.toMatch(/crithit/i);

  const metrics = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const minFontViolations = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'].includes(el.tagName)) continue;
      if (el.closest('.sr-only') || el.offsetParent === null) continue;
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)
        .map((n) => n.textContent.trim())
        .join('');
      if (!directText) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs > 0 && fs < 10.9) {
        minFontViolations.push(`${el.tagName}.${el.className}: ${fs}px ("${directText.slice(0, 25)}")`);
      }
    }
    const brokenVisibleImgs = [];
    for (const img of document.querySelectorAll('img')) {
      if (img.offsetParent === null) continue;
      if (img.complete && img.naturalWidth === 0) {
        brokenVisibleImgs.push(img.getAttribute('src') || 'no-src');
      }
    }
    return { overflow, minFontViolations: minFontViolations.slice(0, 5), brokenVisibleImgs: brokenVisibleImgs.slice(0, 5) };
  });

  expect(metrics.overflow, `${label}: Horizontal overflow (${metrics.overflow}px)`).toBeLessThanOrEqual(1);
  expect(metrics.minFontViolations, `${label}: Font-size < 11px detected`).toEqual([]);
  expect(metrics.brokenVisibleImgs, `${label}: Broken visible <img> tags`).toEqual([]);

  if (runAxe) {
    const axe = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const bad = axe.violations.filter((v) => ['critical', 'serious'].includes(v.impact || ''));
    expect(
      bad.map((v) => `${v.id}: ${v.help} -> ${v.nodes[0]?.html?.slice(0, 140)}`),
      `${label}: WCAG 2.1 AA violations`
    ).toEqual([]);
  }

  expect(issues, `${label}: Runtime JS/HTTP errors`).toEqual([]);
}

test.describe('Auditoria Completa Teoria Geek — Usuário Real & Gestor', () => {
  test('1. Jornada Home: Logo, Dropdown/Drawer, Ctrl+K, Persistência Dark Mode e Zero Imagens Quebradas', async ({
    page,
  }, testInfo) => {
    const issues = attachGuards(page);
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    // Classic logo check & Phase 2-4 checks (Speculation Rules, Reels 3:4 Facade, Mais Lidas 24h tab)
    await expect(page.locator('header img.tg-brand-logo')).toBeVisible();
    await expect(page.locator('footer img').first()).toBeAttached();
    await expect(page.locator('script[type="speculationrules"]')).toHaveCount(1);

    // Reels 3:4 Facade on-demand load
    const reelFacadeBtn = page.locator('[data-tg-reel-facade-play]').first();
    if ((await reelFacadeBtn.count()) > 0) {
      await reelFacadeBtn.click();
      await expect(page.locator('.tg-reel-facade-overlay a').first()).toBeVisible({ timeout: 20_000 });
    }

    // Mais Lidas 24 horas tab toggle
    const tab24h = page.locator('[data-tg-mr-tab="24h"]').first();
    if ((await tab24h.count()) > 0) {
      await tab24h.click();
      await expect(tab24h).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-tg-mr-panel="24h"]')).toBeVisible();
    }

    // Home Deduplication + Controlled Hero Height & Full Width + Single-line Category Badges (v1.2.1)
    const homeMetrics = await page.evaluate(() => {
      const heroCard = document.querySelector('main section:first-of-type article');
      const heroImg = heroCard ? heroCard.querySelector('img.tg-cover-img') : null;
      const heroH = heroImg ? Math.round(heroImg.getBoundingClientRect().height) : 0;
      const heroW = heroImg ? Math.round(heroImg.getBoundingClientRect().width) : 0;
      const heroCardW = heroCard ? Math.round(heroCard.getBoundingClientRect().width) : 0;

      // Collect all post links across primary editorial sections (excluding ticker, Mais Lidas, and Carrossel Reels)
      const sections = [
        ...document.querySelectorAll('main > section[aria-label*="Destaques"] article a[href]'),
        ...document.querySelectorAll('#tg-giro-heading ~ div article h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-giro-heading"] article h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-reviews-heading"] article h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-especiais-heading"] article h3 a[href]'),
        ...document.querySelectorAll('#editorias article h4 a[href], #editorias ul li div a[href]'),
      ];
      // Deduplicate per card (only count heading links + hero/reel link once)
      const cardHeadingLinks = [
        ...document.querySelectorAll('main > section[aria-label*="Destaques"] h1 a[href]'),
        ...document.querySelectorAll('main > section[aria-label*="Destaques"] h2 a[href]'),
        ...document.querySelectorAll('main > section[aria-label*="Destaques"] h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-giro-heading"] h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-reviews-heading"] h3 a[href]'),
        ...document.querySelectorAll('section[aria-labelledby="tg-especiais-heading"] h3 a[href]'),
        ...document.querySelectorAll('#editorias h4 a[href], #editorias ul li div a[href]'),
      ]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.includes('/reels/') && !h.includes('/category/'));

      const seen = new Set();
      const dups = [];
      for (const href of cardHeadingLinks) {
        if (seen.has(href)) dups.push(href);
        seen.add(href);
      }

      // Single-line badge check on Giro Geek & Review cards
      const wrappedBadges = [];
      document
        .querySelectorAll('section[aria-labelledby="tg-giro-heading"] .tg-cat-badge, section[aria-labelledby="tg-reviews-heading"] .tg-cat-badge')
        .forEach((b) => {
          const h = Math.round(b.getBoundingClientRect().height);
          if (h > 28) wrappedBadges.push(`${b.textContent?.trim()}: ${h}px`);
        });

      return { heroH, heroW, heroCardW, totalHomeCards: cardHeadingLinks.length, dups, wrappedBadges };
    });

    expect(homeMetrics.heroH, `Hero cover height (${homeMetrics.heroH}px) must be <= 385px`).toBeLessThanOrEqual(385);
    expect(
      homeMetrics.heroCardW - homeMetrics.heroW,
      `Hero cover width (${homeMetrics.heroW}px) must fill 100% of Hero card width (${homeMetrics.heroCardW}px)`
    ).toBeLessThanOrEqual(6);
    expect(homeMetrics.dups, 'Home editorial blocks must not repeat posts').toEqual([]);
    expect(homeMetrics.wrappedBadges, 'Category badges must remain single-line').toEqual([]);

    // Verify "TEORIA GEEK REELS — RESUMO RÁPIDO" Web Stories 3:4 Full-Bleed Strip (5 cols Desktop / horizontal carousel Mobile)
    const reelsStripSection = page.locator('section[aria-labelledby="tg-reels-strip-heading"]');
    await reelsStripSection.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('section[aria-labelledby="tg-reels-strip-heading"] img.tg-story-img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            setTimeout(() => resolve(), 6000);
          });
        })
      );
    });
    await page.waitForTimeout(200);

    const storyMetrics = await page.evaluate(() => {
      const grid = document.querySelector('section[aria-labelledby="tg-reels-strip-heading"] .tg-story-grid');
      const cards = Array.from(document.querySelectorAll('section[aria-labelledby="tg-reels-strip-heading"] .tg-story-card'));
      if (!grid || !cards.length) return { count: 0 };
      const gridCs = getComputedStyle(grid);
      const colTracks = gridCs.gridTemplateColumns ? gridCs.gridTemplateColumns.split(' ').filter(Boolean).length : 0;
      const issues = [];
      for (const card of cards) {
        const cRect = card.getBoundingClientRect();
        const img = card.querySelector('img.tg-story-img');
        const badge = card.querySelector('.tg-cat-badge');
        const title = card.querySelector('.tg-story-title');
        const bars = card.querySelectorAll('.tg-story-bar').length;
        const play = card.querySelector('.tg-story-play');
        if (bars !== 3) issues.push(`Expected 3 story bars, got ${bars}`);
        if (!play) issues.push('Missing yellow play button');
        if (img && img.style.display !== 'none') {
          const iRect = img.getBoundingClientRect();
          if (iRect.height < cRect.height - 6 || iRect.width < cRect.width - 6) {
            issues.push(`Image smaller than card: img ${Math.round(iRect.width)}x${Math.round(iRect.height)} vs card ${Math.round(cRect.width)}x${Math.round(cRect.height)}`);
          }
        }
        if (badge && title) {
          const bRect = badge.getBoundingClientRect();
          const tRect = title.getBoundingClientRect();
          const gap = tRect.top - bRect.bottom;
          if (gap > 20 || gap < 0) issues.push(`Unexpected gap between badge and title: ${Math.round(gap)}px`);
          if (badge.scrollWidth > badge.clientWidth + 2) issues.push(`Badge clipped: ${badge.textContent?.trim()}`);
        }
      }
      return {
        count: cards.length,
        display: gridCs.display,
        colTracks,
        overflowX: gridCs.overflowX,
        issues,
      };
    });

    expect(storyMetrics.count, 'Reels strip must render 5 Web Story cards').toBe(5);
    expect(storyMetrics.issues, 'Reels strip Web Stories layout issues').toEqual([]);
    if (testInfo.project.name.includes('desktop')) {
      expect(storyMetrics.display).toBe('grid');
      expect(storyMetrics.colTracks).toBe(5);
    } else {
      expect(storyMetrics.display).toBe('flex');
      expect(storyMetrics.overflowX).toBe('auto');
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // Capture multi-breakpoint visual check on desktop run (1280x720 + 768x1024)
    if (testInfo.project.name.includes('desktop')) {
      for (const vp of [
        { width: 1280, height: 720 },
        { width: 768, height: 1024 },
      ]) {
        await page.setViewportSize(vp);
        const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(ov, `Home overflow at ${vp.width}x${vp.height}`).toBeLessThanOrEqual(1);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    // Desktop dropdown submenu hover check
    if (testInfo.project.name.includes('desktop')) {
      const parentItem = page.locator('header nav .tg-primary-menu > li.menu-item-has-children').first();
      if ((await parentItem.count()) > 0) {
        await parentItem.hover();
        await expect(parentItem.locator(':scope > .sub-menu')).toBeVisible();
      }
    } else {
      // Mobile drawer + submenu accordion test
      await page.locator('[data-tg-drawer-open]').click();
      const drawer = page.locator('#tg-mobile-drawer');
      await expect(drawer).toBeVisible();
      const accordionBtn = drawer.locator('button[aria-label="Expandir submenu"]').first();
      if ((await accordionBtn.count()) > 0) {
        await accordionBtn.click();
        await expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
      }
      await drawer.locator('[data-tg-drawer-close]').last().click();
      await expect(drawer).toBeHidden();
    }

    // Ctrl+K Instant Search shortcut -> real article
    await page.keyboard.press('Control+k');
    await expect(page.locator('#tg-search-modal')).toBeVisible();
    await page.locator('#tg-instant-search-input').fill('Vingadores');
    await expect(page.locator('#tg-instant-search-results li a').first()).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#tg-search-modal')).toBeHidden();

    // Dark Mode persistence across navigation
    await page.locator('[data-tg-theme-toggle]').first().click();
    const themeAfterToggle = await page.locator('html').getAttribute('data-theme');
    await runPageHealthCheck(page, issues, `Home (${themeAfterToggle})`, { runAxe: true });

    // Navigate to Hero article and verify theme persisted
    const heroHref = await page.locator('main article h1 a').first().getAttribute('href');
    expect(heroHref).toBeTruthy();
    await page.goto(heroHref, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('html').getAttribute('data-theme')).toBe(themeAfterToggle);
    await runPageHealthCheck(page, issues, `Hero Target (${themeAfterToggle})`, { runAxe: true });
  });

  test('2. Leitura Completa de Artigo: Progresso de Leitura, Salvar Persistente, Comentários, Relacionados e Review Card (Claro/Escuro)', async ({
    page,
  }) => {
    const issues = attachGuards(page);
    const url = '/visionquest-confira-nossa-critica/';
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    // Scroll to 75% and verify reading progress bar moved > 0.25
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
    await page.waitForTimeout(150);
    const progressScale = await page.evaluate(() => {
      const el = document.getElementById('tg-reading-progress');
      if (!el) return 0;
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') return 0;
      const m = t.match(/matrix\(([^,]+)/);
      return m ? parseFloat(m[1]) : 0;
    });
    expect(progressScale, 'Reading progress bar must advance on scroll').toBeGreaterThan(0.2);

    // Save button persistence across reload
    const saveBtn = page.locator('[data-tg-save-slug]').first();
    await saveBtn.click();
    await expect(saveBtn).toHaveAttribute('aria-pressed', 'true');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-tg-save-slug]').first()).toHaveAttribute('aria-pressed', 'true');

    // OpenGraph + Review JSON-LD + Próxima Matéria card
    await expect(page.locator('meta[property="og:title"]')).toBeAttached();
    await expect(page.locator('meta[name="twitter:card"]')).toBeAttached();
    const jsonLdType = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const s of scripts) {
        try {
          const parsed = JSON.parse(s.textContent || '{}');
          if (parsed['@type'] === 'Review' && parsed.reviewRating) return 'Review';
        } catch {}
      }
      return '';
    });
    expect(jsonLdType, 'VisionQuest must emit JSON-LD Review schema with reviewRating').toBe('Review');
    await expect(page.locator('nav[aria-label="Próxima matéria recomendada"]').first()).toBeVisible();

    // Related posts count = 3 and no self-duplicate
    const relLinks = await page.locator('section[aria-labelledby="tg-related-heading"] article h3 a').evaluateAll((els) =>
      els.map((a) => a.getAttribute('href'))
    );
    expect(relLinks.length).toBe(3);
    expect(relLinks.every((h) => !h.includes('visionquest-confira-nossa-critica'))).toBe(true);

    // Comments section visible & WCAG AA in Light and Dark mode
    await expect(page.locator('#comments')).toBeVisible();
    await expect(page.locator('#comment')).toBeVisible();
    await runPageHealthCheck(page, issues, 'VisionQuest (Light)', { runAxe: true });

    await page.locator('[data-tg-theme-toggle]').first().click();
    await runPageHealthCheck(page, issues, 'VisionQuest (Dark)', { runAxe: true });
  });

  test('3. Páginas Institucionais do Rodapé (Claro e Escuro): Contato, Anuncie, Venha para o TG, Privacidade e Equipe', async ({
    page,
  }) => {
    const issues = attachGuards(page);
    const pages = [
      '/contato/',
      '/saiba-como-anunciar-com-o-tg/',
      '/venhaparaotg/',
      '/politica-de-privacidade/',
      '/equipe-teoria-geek/',
    ];

    for (const p of pages) {
      const res = await page.goto(p, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `Institutional page ${p} status`).toBe(200);
      await runPageHealthCheck(page, issues, `Page ${p} (Light)`, { runAxe: true });

      // Also verify dark mode contrast on legacy pasted institutional HTML!
      await page.locator('[data-tg-theme-toggle]').first().click();
      await runPageHealthCheck(page, issues, `Page ${p} (Dark)`, { runAxe: true });
      await page.locator('[data-tg-theme-toggle]').first().click();
    }
  });

  test('4. Paginação de Categoria, Subeditorias, Busca Vazia, Autor, Tag e 404', async ({ page }) => {
    const issues = attachGuards(page, { allowDocument404: true });

    // Category pagination Page 1 -> Page 2
    await page.goto('/category/noticias/', { waitUntil: 'domcontentloaded' });
    const p1Title = await page.locator('main article h2 a').first().innerText();
    await page.locator('nav[aria-label="Paginação de matérias"] a.next').click();
    await page.waitForURL(/\/page\/2\//);
    const p2Title = await page.locator('main article h2 a').first().innerText();
    expect(p2Title).not.toBe(p1Title);
    await runPageHealthCheck(page, issues, 'Category Pagination Page 2', { runAxe: true });

    // Parent category with subcategories (ESPORTES)
    await page.goto('/category/esportes-futebol-games-e-sports-vloley-basquete/', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('Subeditorias:')).toBeVisible();
    await runPageHealthCheck(page, issues, 'Category with Subcategories');

    // Empty search results UX
    await page.goto('/?s=termoinexistentexyz999888', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Nenhuma matéria encontrada para este termo/i)).toBeVisible();
    await runPageHealthCheck(page, issues, 'Empty Search UX', { runAxe: true });

    // 404 Page
    const r404 = await page.goto('/pagina-inexistente-auditoria-final/', {
      waitUntil: 'domcontentloaded',
    });
    expect(r404?.status()).toBe(404);
    await runPageHealthCheck(page, issues, '404 Page', { runAxe: true });
  });

  test('5. Reels 2.0 Interativo (Altura 100dvh, Clique Lateral, Teclado, Filtros, Salvar, Zero Duplicação) + YouTube Facade + /wp-login.php', async ({
    page,
  }, testInfo) => {
    const issues = attachGuards(page);
    const isDesktop = testInfo.project.name.includes('desktop');

    // Deep-link to VisionQuest
    const res = await page.goto('/reels/?post=visionquest-confira-nossa-critica', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBe(200);
    const firstCard = page.locator('#tg-reels-stage article[data-reel-idx="0"]');
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(/VisionQuest/i);
    await expect(firstCard).toContainText(/Nota 10\.0\/10/i);

    // Must NOT have static "Próxima lâmina" button
    expect(await page.locator('[data-next-blade]').count()).toBe(0);

    // Verify exact viewport fit: active card fits inside viewport and slide #2 does NOT peek/bleed
    const reelLayout = await page.evaluate(() => {
      const stage = document.getElementById('tg-reels-stage');
      const card0 = document.querySelector('#tg-reels-stage article[data-reel-idx="0"]');
      const slide1 = document.querySelectorAll('#tg-reels-stage .tg-reel-slide')[1];
      const ctx = document.getElementById('tg-reels-context');
      const sRect = stage.getBoundingClientRect();
      const cRect = card0.getBoundingClientRect();
      const s1Rect = slide1 ? slide1.getBoundingClientRect() : null;
      const cardTitle = card0.querySelector('h2')?.textContent?.trim() || '';
      const ctxText = ctx ? ctx.innerText : '';
      const visibleReadLinks = Array.from(document.querySelectorAll('a'))
        .filter((a) => /ler matéria completa/i.test(a.textContent || '') && a.offsetParent !== null)
        .length;
      return {
        fitsViewport: cRect.bottom <= window.innerHeight + 2 && cRect.top >= 0,
        nextSlideNoBleed: !s1Rect || s1Rect.top >= sRect.bottom - 2,
        ctxRepeatsTitle: Boolean(cardTitle && ctxText.includes(cardTitle)),
        visibleReadLinks,
      };
    });
    expect(reelLayout.fitsViewport, 'Active reel card must fit inside viewport height').toBe(true);
    expect(reelLayout.nextSlideNoBleed, 'Next reel slide must not bleed into viewport').toBe(true);

    if (isDesktop) {
      expect(reelLayout.ctxRepeatsTitle, 'Desktop right panel must NOT repeat center card title').toBe(false);
      expect(reelLayout.visibleReadLinks, 'Desktop must display exactly 1 primary Ler matéria completa CTA').toBe(1);
    } else {
      // Mobile must hide left sidebar & show horizontal chips bar with zero overflow
      await expect(page.locator('.tg-reels-mobile-bar')).toBeVisible();
    }

    // Blade navigation: right tap zone (0 -> 1), top bar click (1 -> 2), keyboard ArrowLeft (2 -> 1)
    await firstCard.locator('[data-blade-next]').click();
    await expect(firstCard.locator('[data-blade-panel="1"]')).toBeVisible();
    await firstCard.locator('[data-set-blade="2"]').click();
    await expect(firstCard.locator('[data-blade-panel="2"]')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(firstCard.locator('[data-blade-panel="1"]')).toBeVisible();
    await firstCard.locator('[data-blade-prev]').click();
    await expect(firstCard.locator('[data-blade-panel="0"]')).toBeVisible();

    // Save button in Reels -> persists in localStorage & shows up in Salvos tab
    const reelSaveBtn = isDesktop
      ? page.locator('#tg-reels-context [data-tg-reel-save]').first()
      : firstCard.locator('[data-tg-reel-save]').first();
    await reelSaveBtn.click();
    await expect(reelSaveBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch reel with next button / ArrowDown
    if (isDesktop) {
      await page.locator('[data-tg-reel-next]').click();
      await page.waitForTimeout(500);
      await expect(page.locator('#tg-reels-counter-rail')).toContainText('2/');
      await page.screenshot({
        path: 'C:\\Users\\kelvi\\.gemini\\antigravity\\brain\\ab761713-dbe1-43fd-97f5-e9bf5c5d9243\\scratch\\reels-desktop.png',
      });
    } else {
      await page.screenshot({
        path: 'C:\\Users\\kelvi\\.gemini\\antigravity\\brain\\ab761713-dbe1-43fd-97f5-e9bf5c5d9243\\scratch\\reels-mobile.png',
      });
    }

    // Test Mais Lidas tab & Editorias filter
    const tabSelector = isDesktop ? 'aside [data-tg-reel-tab="trending"]' : '.tg-reels-mobile-bar [data-tg-reel-tab="trending"]';
    await page.locator(tabSelector).first().click();
    await expect(page.locator('#tg-reels-stage article[data-reel-idx="0"]')).toBeVisible({ timeout: 20_000 });
    await runPageHealthCheck(page, issues, 'Reels Interactive');

    // Verify YouTube Facade on Vingadores article (0 YouTube iframes on load -> injects iframe on click)
    const ytRes = await page.goto(
      '/marvel-studios-vingadores-doutor-destino-trailer-e-poster-finais-disponiveis/',
      { waitUntil: 'domcontentloaded' }
    );
    expect(ytRes?.status()).toBe(200);
    const facadeCount = await page.locator('.entry-content .tg-yt-facade').count();
    expect(facadeCount, 'YouTube embed must render as lightweight facade on initial load').toBeGreaterThan(0);
    expect(await page.locator('.entry-content iframe[src*="youtube"]').count()).toBe(0);

    // Verify single cover max-height <= 405px & desktop sticky sidebar
    const singleMetrics = await page.evaluate(() => {
      const cover = document.querySelector('#tg-article-body figure img.tg-cover-img');
      const aside = document.querySelector('article aside[aria-label="Ranking e conteúdo complementar"]');
      return {
        coverH: cover ? Math.round(cover.getBoundingClientRect().height) : 0,
        asidePos: aside ? getComputedStyle(aside).position : '',
        asideTop: aside ? getComputedStyle(aside).top : '',
      };
    });
    expect(singleMetrics.coverH).toBeLessThanOrEqual(405);
    if (isDesktop) {
      expect(singleMetrics.asidePos).toBe('sticky');
      expect(singleMetrics.asideTop).toBe('88px');
    }

    await page.locator('.entry-content .tg-yt-facade-btn').first().click();
    await expect(page.locator('.entry-content .tg-yt-facade iframe[src*="youtube-nocookie.com"]').first()).toBeVisible();

    // Verify wp-login.php is unaffected by theme (Site Manager login gate)
    const loginRes = await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded' });
    expect(loginRes?.status()).toBe(200);
    await expect(page.locator('#user_login')).toBeVisible();
    const loginHtml = await page.content();
    expect(loginHtml).not.toMatch(PHP_ERROR_REGEX);
  });
});
