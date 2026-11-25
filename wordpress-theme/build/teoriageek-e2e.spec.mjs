import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const THEME_SCREENSHOT_PATH =
  'C:\\Users\\kelvi\\Local Sites\\teoriageek\\app\\public\\wp-content\\themes\\teoriageek\\screenshot.png';

const PHP_ERROR_REGEX =
  /(<b>\s*(?:Fatal error|Parse error|Warning|Notice|Deprecated)\s*<\/b>:|(?:Fatal error|Parse error|Warning|Notice|Deprecated):\s+.+\sin\s+.+\.php\s+on\s+line\s+\d+)/i;
const RAW_SHORTCODE_REGEX =
  /\[\/?(?:vc_|td_|tdc_|tdb_|tdm_|rbc_|wpforms|bwg_|yop_poll|totalpoll|tmm)[a-zA-Z0-9_-]*[^\]]*\]/i;
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function attachRuntimeGuards(page, { allowDocument404 = false } = {}) {
  const errors = [];

  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });

  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    const type = res.request().resourceType();
    if (!url.includes('teoriageek.local')) return;
    if (allowDocument404 && type === 'document' && status === 404) return;
    if (status >= 400 && ['document', 'stylesheet', 'script', 'fetch', 'xhr'].includes(type)) {
      errors.push(`HTTP ${status} (${type}): ${url}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (allowDocument404 && text.includes('status of 404')) return;
    if (
      text.includes('youtube.com') ||
      text.includes('doubleclick.net') ||
      text.includes('googleads') ||
      text.includes('ERR_BLOCKED_BY_CLIENT')
    ) {
      return;
    }
    errors.push(`console.error: ${text}`);
  });

  return errors;
}

async function assertCleanLayoutAndHtml(page, runtimeErrors, label) {
  const html = await page.content();
  expect(html, `${label}: PHP warning/notice/error found in HTML`).not.toMatch(PHP_ERROR_REGEX);

  // Verify zero hardcoded local URLs in theme asset tags (only dynamic WP runtime URLs)
  const visibleText = await page.locator('body').innerText();
  expect(visibleText, `${label}: Raw legacy shortcode leaked in visible text`).not.toMatch(
    RAW_SHORTCODE_REGEX
  );

  // Zero emojis in header/footer chrome
  const chromeText = await page.evaluate(() => {
    const h = document.querySelector('header')?.innerText || '';
    const f = document.querySelector('footer')?.innerText || '';
    return `${h}\n${f}`;
  });
  expect(chromeText, `${label}: Unicode emoji found in theme UI chrome`).not.toMatch(EMOJI_REGEX);
  expect(chromeText, `${label}: CritHit brand text leaked into Teoria Geek chrome`).not.toMatch(/crithit/i);

  // Verify :root --tg-* CSS variables injected via wp_head
  const tgVars = await page.evaluate(() => {
    const styleEl = document.getElementById('teoriageek-customizer-vars');
    const cs = getComputedStyle(document.documentElement);
    return {
      hasStyleTag: Boolean(styleEl),
      primary: cs.getPropertyValue('--tg-primary').trim(),
      accent: cs.getPropertyValue('--tg-accent').trim(),
      bg: cs.getPropertyValue('--tg-bg').trim(),
      surface: cs.getPropertyValue('--tg-surface').trim(),
      text: cs.getPropertyValue('--tg-text').trim(),
      onAccent: cs.getPropertyValue('--tg-on-accent').trim(),
    };
  });
  expect(tgVars.hasStyleTag, `${label}: Missing #teoriageek-customizer-vars in wp_head`).toBe(true);
  expect(tgVars.primary.toLowerCase()).toBe('#1d4ed8');
  expect(tgVars.accent.toLowerCase()).toBe('#facc15');
  expect(tgVars.onAccent.toLowerCase()).toBe('#0b0f19');
  expect(tgVars.bg).not.toBe('');
  expect(tgVars.surface).not.toBe('');
  expect(tgVars.text).not.toBe('');

  // Zero horizontal overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflow, `${label}: Horizontal overflow (${overflow}px)`).toBeLessThanOrEqual(1);

  expect(runtimeErrors, `${label}: Unexpected JS/HTTP runtime errors`).toEqual([]);
}

test.describe('Teoria Geek WordPress Theme — E2E & Accessibility Suite', () => {
  test('Home (/): Hero, Mais Lidas, Críticas, imagens remotas, busca instantânea, Claro/Escuro, WCAG AA e menu mobile', async ({
    page,
  }, testInfo) => {
    const errors = attachRuntimeGuards(page);
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('header img.tg-brand-logo')).toBeVisible();
    const logoLoaded = await page.evaluate(() => {
      const img = document.querySelector('header img.tg-brand-logo');
      return Boolean(img && img.complete && img.naturalWidth > 0);
    });
    expect(logoLoaded, 'Official Teoria Geek header logo should load').toBe(true);
    await expect(page.getByText('PLANTÃO GEEK')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mais Lidas do Teoria Geek/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Críticas & Reviews/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Editorias em Destaque/i })).toBeVisible();

    // Verify Hero & Featured Reel cover images load remotely via .htaccess redirect
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('main section:first-of-type img.tg-cover-img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
          return new Promise((resolve) => {
            img.addEventListener('load', () => resolve(true), { once: true });
            img.addEventListener('error', () => resolve(false), { once: true });
            setTimeout(() => resolve(false), 8000);
          });
        })
      );
    });
    const heroImgLoaded = await page.evaluate(() => {
      const img = document.querySelector('main article img.tg-cover-img');
      return !img || (img.complete && img.naturalWidth > 0);
    });
    expect(heroImgLoaded, 'Hero remote cover image should load').toBe(true);

    // Capture official 1200x900 WordPress theme screenshot on desktop run
    if (testInfo.project.name.includes('desktop')) {
      await page.setViewportSize({ width: 1200, height: 900 });
      await page.screenshot({ path: THEME_SCREENSHOT_PATH, type: 'png' });
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    // WCAG 2.1 AA audit in initial theme
    const axeLight = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousLight = axeLight.violations.filter((v) =>
      ['critical', 'serious'].includes(v.impact || '')
    );
    expect(
      seriousLight.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.html})`),
      'WCAG AA violations (initial theme)'
    ).toEqual([]);

    // Toggle Dark / Light Mode & re-audit WCAG 2.1 AA
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    await page.locator('[data-tg-theme-toggle]').first().click();
    const toggledTheme = await page.locator('html').getAttribute('data-theme');
    expect(toggledTheme).not.toBe(initialTheme);

    const axeDark = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousDark = axeDark.violations.filter((v) =>
      ['critical', 'serious'].includes(v.impact || '')
    );
    expect(
      seriousDark.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.html})`),
      'WCAG AA violations (toggled theme)'
    ).toEqual([]);

    // Instant Search Modal via REST API
    await page.locator('[data-tg-search-open]').click();
    const searchModal = page.locator('#tg-search-modal');
    await expect(searchModal).toBeVisible();
    await page.locator('#tg-instant-search-input').fill('Marvel');
    await expect(page.locator('#tg-instant-search-results li').first()).toBeVisible({
      timeout: 20_000,
    });
    await page.keyboard.press('Escape');
    await expect(searchModal).toBeHidden();

    // Mobile Drawer navigation on Mobile viewport
    if (testInfo.project.name.includes('mobile')) {
      const drawerBtn = page.locator('[data-tg-drawer-open]');
      await expect(drawerBtn).toBeVisible();
      await drawerBtn.click();
      const drawer = page.locator('#tg-mobile-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer.locator('nav.tg-mobile-nav a').first()).toBeVisible();
      await page.locator('#tg-mobile-drawer [data-tg-drawer-close]').last().click();
      await expect(drawer).toBeHidden();
    }

    await assertCleanLayoutAndHtml(page, errors, 'Home (/)');
  });

  test('Arquivos de Categoria, Autor, Tag, Busca (/?s=marvel) e Página 404', async ({ page }) => {
    const errors = attachRuntimeGuards(page, { allowDocument404: true });

    // 1. Category Archive
    const catRes = await page.goto('/category/games/', { waitUntil: 'domcontentloaded' });
    expect(catRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/GAMES/i);
    expect(await page.locator('main article').count()).toBeGreaterThan(3);
    await assertCleanLayoutAndHtml(page, errors, 'Category /category/games/');

    // 2. Search Results
    const searchRes = await page.goto('/?s=marvel', { waitUntil: 'domcontentloaded' });
    expect(searchRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Resultados para "marvel"/i);
    expect(await page.locator('main article').count()).toBeGreaterThan(0);
    await assertCleanLayoutAndHtml(page, errors, 'Search /?s=marvel');

    // 3. Navigate into an article to follow real Author and Tag archive links
    await page.goto('/visionquest-confira-nossa-critica/', { waitUntil: 'domcontentloaded' });
    const authorHref = await page
      .locator('article header a[href*="/author/"]')
      .first()
      .getAttribute('href');
    if (authorHref) {
      const authRes = await page.goto(authorHref, { waitUntil: 'domcontentloaded' });
      expect(authRes?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      await assertCleanLayoutAndHtml(page, errors, `Author Archive ${authorHref}`);
    }

    await page.goto('/visionquest-confira-nossa-critica/', { waitUntil: 'domcontentloaded' });
    const tagCount = await page.locator('article a[href*="/tag/"]').count();
    if (tagCount > 0) {
      const tagHref = await page.locator('article a[href*="/tag/"]').first().getAttribute('href');
      if (tagHref) {
        const tagRes = await page.goto(tagHref, { waitUntil: 'domcontentloaded' });
        expect(tagRes?.status()).toBe(200);
        await expect(page.locator('h1')).toBeVisible();
        await assertCleanLayoutAndHtml(page, errors, `Tag Archive ${tagHref}`);
      }
    }

    // 4. 404 Not Found
    const notFoundRes = await page.goto('/url-inexistente-auditoria-playwright-404/', {
      waitUntil: 'domcontentloaded',
    });
    expect(notFoundRes?.status()).toBe(404);
    await expect(page.getByText('404!')).toBeVisible();
    await assertCleanLayoutAndHtml(page, errors, '404 Page');
  });

  test('Matéria 1 (Recente com Word v1MsoNormal + YouTube): Vingadores Doutor Destino', async ({
    page,
  }) => {
    const errors = attachRuntimeGuards(page);
    const res = await page.goto(
      '/marvel-studios-vingadores-doutor-destino-trailer-e-poster-finais-disponiveis/',
      { waitUntil: 'domcontentloaded' }
    );
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Vingadores/i);
    await expect(page.locator('#tg-reading-progress')).toBeAttached();

    const boundsOk = await page.evaluate(() => {
      const container = document.querySelector('.entry-content');
      if (!container) return false;
      const maxW = container.getBoundingClientRect().width + 2;
      for (const el of container.querySelectorAll('img, iframe')) {
        if (el.getBoundingClientRect().width > maxW) return false;
      }
      return true;
    });
    expect(boundsOk, 'All images and iframes must fit inside .entry-content').toBe(true);

    await assertCleanLayoutAndHtml(page, errors, 'Single Recent Post');
  });

  test('Matéria 2 (Crítica com .ficha legada, selo 10.0, Card de Nota & WCAG AA): VisionQuest', async ({
    page,
  }) => {
    const errors = attachRuntimeGuards(page);
    const res = await page.goto('/visionquest-confira-nossa-critica/', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/VisionQuest/i);
    await expect(page.getByText('Nota 10.0/10')).toBeVisible();
    await expect(page.getByRole('complementary', { name: /Nota da avaliação editorial/i })).toBeVisible();
    await expect(page.locator('.entry-content .ficha')).toBeVisible();

    const fichaFits = await page.evaluate(() => {
      const ficha = document.querySelector('.entry-content .ficha');
      const body = document.getElementById('tg-article-body');
      if (!ficha || !body) return false;
      return ficha.getBoundingClientRect().width <= body.getBoundingClientRect().width + 1;
    });
    expect(fichaFits, '.ficha table card must fit within article container').toBe(true);

    // WCAG 2.1 AA on article (excluding third-party YouTube iframe internals)
    const axeArticle = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousArticle = axeArticle.violations.filter((v) =>
      ['critical', 'serious'].includes(v.impact || '')
    );
    expect(
      seriousArticle.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.html})`),
      'WCAG AA violations on Single Article'
    ).toEqual([]);

    await assertCleanLayoutAndHtml(page, errors, 'Single Crítica VisionQuest');
  });

  test('Matéria 3 (Review 9.0) + Matéria 4 (Antiga 2021 sem capa) + Página com shortcodes legados + Reels', async ({
    page,
  }) => {
    const errors = attachRuntimeGuards(page);

    const revRes = await page.goto(
      '/the-crew-motorfest-nintendo-switch-2-confira-nossa-review/',
      { waitUntil: 'domcontentloaded' }
    );
    expect(revRes?.status()).toBe(200);
    await expect(page.getByText('Nota 9.0/10')).toBeVisible();
    await assertCleanLayoutAndHtml(page, errors, 'Single Review The Crew Motorfest');

    const oldRes = await page.goto('/keninha-review/', { waitUntil: 'domcontentloaded' });
    expect(oldRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Kena/i);
    await expect(page.locator('#tg-article-body figure svg').first()).toBeVisible();
    await assertCleanLayoutAndHtml(page, errors, 'Old Post without Thumbnail (2021)');

    const pageRes = await page.goto('/parceiros/', { waitUntil: 'domcontentloaded' });
    expect(pageRes?.status()).toBe(200);
    await assertCleanLayoutAndHtml(page, errors, 'Legacy Shortcode Page /parceiros/');

    const reelsRes = await page.goto('/reels/', { waitUntil: 'domcontentloaded' });
    expect(reelsRes?.status()).toBe(200);
    await expect(page.locator('#tg-reels-stage article').first()).toBeVisible();
    await assertCleanLayoutAndHtml(page, errors, 'Reels /reels/');
  });
});
