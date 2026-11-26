# Checkpoint de Desenvolvimento — Tema WordPress Nativo `teoriageek` (`v1.2.0`)

**Última atualização:** 2026-11-25  
**Status:** Concluído, auditado e empacotado para produção (`dist/teoriageek-theme.zip`)  
**Objetivo:** Tema WordPress 100% nativo, autocontido em `wordpress-theme/teoriageek/` (sem alterar `/apps/web` ou `/apps/api`), substituindo o tema legado *Newspaper v12.6.2* (`td-composer` e `td-cloud-library`) no portal **Teoria Geek** (`https://teoriageek.com.br/`), com identidade Azul & Amarelo, logo clássica, fontes locais `.woff2`, operação 100% sem código e compatibilidade integral com o acervo legado (+65.000 posts).

---

## Status por Etapa (Todas Concluídas)

### Etapa 1 — Reconhecimento & Auditoria do Banco Real — 100% Concluída
- [x] Mapeamento das **25 categorias reais** (`noticias`, `games`, `filmes`, `series`, `destaque`, `animes-mangas`, `especial-teoria-geek`, `criticas`, `reviews`, `livros-hqs`, `musicas`, `eventos-shows-festivais`, etc.), tabela `wp_post_views` (1,81M linhas indexadas), metadados `td_post_theme_settings` e `_yoast_wpseo_primary_category`.
- [x] Mapeamento do HTML legado de Críticas/Reviews (`.ficha`, `.rev-series`, `.rev-games`, `.capa`, `.col`, `.tit`, `.sinop`, `.div-selo`/`.selo`, `.youtube-embed`, `p.v1MsoNormal`, spans coloridos inline) e shortcodes órfãos (`[vc_*]`, `[td_*]`, `[tdc_*]`, `[tdb_*]`, `[rbc_*]`, `[tmm]`).
- [x] Diagnóstico e correção ponta-a-ponta do mojibake CP850/UTF-8 (`J├í` → `Já`, `at├®` → `até`, `An├®is` → `Anéis`, `espa├ºo` → `espaço`) via `teoriageek_fix_mojibake()` em tempo de renderização (sem mutar o banco).
- [x] Registro completo em [`MIGRATION_AUDIT.md`](./MIGRATION_AUDIT.md).

### Etapa 2 — Núcleo PHP, Customizer, Meta Box & Taxonomia — 100% Concluída
- [x] `style.css` (`v1.2.0`), `theme.json`, `functions.php` (carregamento modular dos 10 arquivos em `inc/`).
- [x] `inc/setup.php` — Suportes nativos, tamanhos `tg-hero`/`tg-card`/`tg-thumb`, 4 áreas de widgets/anúncios (`tg-top-banner`, `tg-mid-article`, `tg-single-sidebar`, `tg-footer-widgets`), refinamento de busca e conversão WebP condicional (`image_editor_output_format`).
- [x] `inc/helpers.php` — Reparo UTF-8 (`teoriageek_fix_mojibake()`), normalização de títulos (`teoriageek_clean_title()`), filtro de Ficha Técnica nos excerpts, *Estreias da Semana* em transient (30 min), cálculo WCAG, ícones SVG estilo Lucide (zero emojis) e arte SVG fallback.
- [x] `inc/customizer.php` — 5 seções no **Aparência > Personalizar** (36 controles): *Cores e Identidade* (`:root --tg-primary`, `--tg-accent`, `--tg-bg`, `--tg-surface`, `--tg-text` via `wp_head`), *Categorias da Capa*, *Redes Sociais & Reels*, *Monetização & Anúncios* (inclui selo **"Oferecimento"** por editoria) e *Estreias & Canais* (WhatsApp/Telegram).
- [x] `inc/meta-boxes.php` — Meta Box nativa **"Ficha Editorial — Teoria Geek"** (Manchete Principal única, Plantão, Formato, Nota `0–10`, 3 Pontos-Chave, Crédito/Fonte) com nonce e `current_user_can`.
- [x] `inc/taxonomies.php` — Taxonomia hierárquica nativa `universo` (`/universo/<slug>/`) para Hubs/Dossiês de franquias.
- [x] `inc/seo.php` — OpenGraph/Twitter Cards e JSON-LD dinâmico (`Review` com `reviewRating` ou `NewsArticle`), auto-suprimido quando Yoast/RankMath/AIOSEO estão ativos.
- [x] `inc/legacy-sanitizer.php` — Remoção segura de shortcodes legados, reparo UTF-8, remoção de "Ficha Técnica" dos excerpts, shortcode nativo `[spoiler]` (`<details>`), `alt` acessível em selos legados, wrappers responsivos de iframe e injeção opcional de anúncio in-article.
- [x] `inc/template-tags.php` — Logo oficial clássica (`assets/images/logo-teoria-geek.png`), selo *Oferecimento*, breadcrumbs Yoast+nativo (incluindo `universo`), auto-detecção de `Menu Principal`, slots de anúncio com `min-height` anti-CLS e *Mais Lidas* `24h`/`7d` via `wp_post_views` + Transients API (`15 min`).
- [x] `inc/reels-api.php` — Rewrite `/reels/` e REST API `teoriageek/v1` (`/reels`, `/search`, `/posts/{id}/like`, `/view`, `/comment`).

### Etapa 3 — Templates, Polimento Visual & Experiência Editorial — 100% Concluída
- [x] Templates completos: `header.php`, `footer.php`, `front-page.php`, `single.php`, `category.php`, `taxonomy-universo.php`, `tag.php`, `author.php`, `archive.php`, `search.php`, `page.php`, `page-reels.php`, `index.php`, `404.php`, `comments.php`.
- [x] Template parts: `breaking-ticker.php` (fade lateral de 44px, sem bolinha pulsante), `hero-home.php` (borda marcada apenas no Hero e no Reels Facade `3:4`, sem poluição visual), `cover-media.php` (tratamento elegante de capas legadas `< 520px`), `card-article.php`, `card-compact.php`, `review-card.php`, `share-buttons.php` (`navigator.share` + WhatsApp + X + Salvar + Copiar), `next-article.php`, `community-cta.php`, `author-box.php`, `related-posts.php`, `navigation-mobile.php`, `search-modal.php`, `pagination.php`.
- [x] Polimento de UX no header: input de busca ampliado sem truncar placeholder, botão Claro/Escuro compacto só com ícone (sem competir com `REELS`), bordas suavizadas nos cards secundários e `contain: layout style`.

### Etapa 4 — Performance, Fontes Locais & Assets Compilados — 100% Concluída
- [x] **14 fontes `.woff2` auto-hospedadas** (`278 KB`) em `assets/fonts/` (`font-display: swap`, zero requisições ao Google Fonts no documento principal).
- [x] `assets/css/main.css` compilado e minificado (`~47,5 KB`), `assets/js/main.js` e `assets/js/reels.js` em Vanilla JS enfileirados com `filemtime()`.
- [x] `<script type="speculationrules">` (fallback inteligente quando WP < 6.8; sem duplicação no WP 6.8+/6.9).
- [x] Guia completo de instalação e virada de produção em [`README.md`](./README.md).

### Etapa 5 — Auditoria Final & Empacotamento `.zip` — 100% Concluída
- [x] **PHP 8.3.37 Syntax Lint:** `40/40` arquivos `.php` aprovados com `0` erros.
- [x] **Auditoria de Gestor (`admin-audit.php` no PHP 8.3.37):** `5` seções / `36` controles no Customizer, MetaBox com nonce, 4 sidebars, `universo`, `[spoiler]`, JSON-LD `Review`, `Mais Lidas 7d/24h` e `0` warnings/notices/deprecations.
- [x] **Auditoria Playwright (`desktop-1440x900` e `mobile-390x844`):** `20/20` testes aprovados (`10/10` em `teoriageek-e2e.spec.mjs` + `10/10` em `full-audit.spec.mjs`), `0` violações WCAG 2.1 AA (Claro e Escuro), `0` mojibake, `0` erros JS/HTTP, `0` overflow horizontal e `font-size >= 11px`.
- [x] **Pacote de produção:** `dist/teoriageek-theme.zip` contendo exatamente `teoriageek/style.css` na raiz, fontes `.woff2`, logos oficiais e `README.md`, sem arquivos de desenvolvimento ou URLs `teoriageek.local`.
