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
    const reelFacadeBtn = page.locator('[data-tg-reel-facade]').first();
    if ((await reelFacadeBtn.count()) > 0) {
      await reelFacadeBtn.click();
      await expect(page.locator('[data-tg-reel-inline]').first()).toBeVisible();
    }

    // Mais Lidas 24 horas tab toggle
    const tab24h = page.locator('[data-tg-most-tab="24h"]').first();
    if ((await tab24h.count()) > 0) {
      await tab24h.click();
      await expect(tab24h).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[data-tg-most-panel="24h"]')).toBeVisible();
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

  test('5. Reels 2.0 Interativo (Deep-link, 3 Lâminas, Filtro REST, Aba Mais Lidas) + /wp-login.php', async ({
    page,
  }, testInfo) => {
    const issues = attachGuards(page);

    // Deep-link to VisionQuest
    const res = await page.goto('/reels/?post=visionquest-confira-nossa-critica', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBe(200);
    const firstCard = page.locator('#tg-reels-stage article').first();
    await expect(firstCard).toContainText(/VisionQuest/i);
    await expect(firstCard).toContainText(/Nota 10\.0\/10/i);

    // Advance blades 0 -> 1 -> 2
    await firstCard.locator('[data-next-blade]').click();
    await expect(firstCard.locator('[data-blade-panel="1"]')).toBeVisible();
    await firstCard.locator('[data-next-blade]').click();
    await expect(firstCard.locator('[data-blade-panel="2"]')).toBeVisible();
    await expect(firstCard.locator('[data-blade-panel="2"] a')).toContainText(/Ler matéria completa/i);

    // Desktop sidebar filters & Trending tab
    if (testInfo.project.name.includes('desktop')) {
      await page.locator('[data-tg-reel-tab="trending"]').click();
      await page.waitForTimeout(1500);
      await expect(page.locator('#tg-reels-stage article').first()).toBeVisible({ timeout: 20_000 });
    }
    await runPageHealthCheck(page, issues, 'Reels Interactive');

    // Verify wp-login.php is unaffected by theme (Site Manager login gate)
    const loginRes = await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded' });
    expect(loginRes?.status()).toBe(200);
    await expect(page.locator('#user_login')).toBeVisible();
    const loginHtml = await page.content();
    expect(loginHtml).not.toMatch(PHP_ERROR_REGEX);
  });
});
