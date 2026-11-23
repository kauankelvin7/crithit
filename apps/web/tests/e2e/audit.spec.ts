import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

const AUDIT_ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Reels', path: '/reels' },
  { name: 'Leitor de Matéria', path: '/noticia/capcom-confirma-remake-dino-crisis-re-engine-2027' },
  { name: 'Painel Admin', path: '/admin' },
];

const THEMES: Array<'light' | 'dark'> = ['light', 'dark'];

// Detecta emojis Unicode comuns (Pictographs, Emoticons, Transport, Misc Symbols, Dingbats)
const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;

test.describe('Auditoria Automatizada — WCAG 2.1 AA, Zero Emojis, Tipografia >= 11px & Segurança', () => {
  for (const route of AUDIT_ROUTES) {
    for (const theme of THEMES) {
      test(`axe-core WCAG 2.1 AA (0 critical/serious) em ${route.name} (${route.path}) — Modo ${theme}`, async ({
        page,
      }) => {
        test.setTimeout(90_000);
        await setupApiMocks(page, { authenticated: route.path === '/admin' });

        await page.addInitScript((t) => {
          window.localStorage.setItem('crithit-theme', t);
        }, theme);

        await page.goto(route.path);
        if (route.path === '/admin') {
          await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();
        } else {
          await page.waitForLoadState('networkidle');
        }

        // Garante que o tema esperado está ativo
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const blockingViolations = axeResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious',
        );

        expect(
          blockingViolations,
          `Violações critical/serious em ${route.path} (${theme}): ${JSON.stringify(
            blockingViolations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
            })),
            null,
            2,
          )}`,
        ).toEqual([]);
      });
    }

    test(`Zero emojis, font-size >= 11px e viewport sem user-scalable=no em ${route.name} (${route.path})`, async ({
      page,
    }) => {
      await setupApiMocks(page, { authenticated: route.path === '/admin' });
      await page.goto(route.path);

      if (route.path === '/admin') {
        await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();
      } else {
        await page.waitForLoadState('networkidle');
      }

      // 1) Zero emojis Unicode na UI visível
      const visibleText = await page.evaluate(() => document.body.innerText);
      const emojiMatch = visibleText.match(EMOJI_REGEX);
      expect(
        emojiMatch,
        `Emoji Unicode encontrado em ${route.path}: ${emojiMatch?.[0] ?? ''}`,
      ).toBeNull();

      // 2) font-size >= 11px em todos os elementos de texto visíveis
      const smallTextElements = await page.evaluate(() => {
        const violations: Array<{ tag: string; fontSize: number; text: string }> = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim();
          if (!text) continue;
          const el = node.parentElement;
          if (!el) continue;
          const style = window.getComputedStyle(el);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            Number(style.opacity) === 0 ||
            el.classList.contains('sr-only')
          ) {
            continue;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width <= 1 && rect.height <= 1) continue;

          const fontSize = parseFloat(style.fontSize);
          if (!Number.isNaN(fontSize) && fontSize < 11) {
            violations.push({
              tag: el.tagName,
              fontSize,
              text: text.slice(0, 60),
            });
          }
        }
        return violations;
      });

      expect(
        smallTextElements,
        `Elementos com font-size < 11px em ${route.path}: ${JSON.stringify(smallTextElements)}`,
      ).toEqual([]);

      // 3) Ausência de user-scalable=no e maximum-scale=1 no <meta name="viewport">
      const viewportContent = await page
        .locator('meta[name="viewport"]')
        .first()
        .getAttribute('content');
      expect(viewportContent).toBeTruthy();
      expect(viewportContent?.toLowerCase()).not.toContain('user-scalable=no');
      expect(viewportContent?.toLowerCase()).not.toContain('maximum-scale=1');
    });
  }

  test('Headers HTTP de segurança obrigatórios presentes nas respostas do Next.js', async ({
    request,
  }) => {
    for (const route of AUDIT_ROUTES) {
      const response = await request.get(route.path);
      expect(response.status(), `Status inesperado em ${route.path}`).toBe(200);

      const headers = response.headers();
      expect(headers['x-frame-options'], `Faltando X-Frame-Options em ${route.path}`).toBe('DENY');
      expect(
        headers['x-content-type-options'],
        `Faltando X-Content-Type-Options em ${route.path}`,
      ).toBe('nosniff');
      expect(headers['referrer-policy'], `Faltando Referrer-Policy em ${route.path}`).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(
        headers['content-security-policy'],
        `Faltando Content-Security-Policy em ${route.path}`,
      ).toBeTruthy();
      expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(headers['content-security-policy']).toContain("object-src 'none'");
    }
  });
});
