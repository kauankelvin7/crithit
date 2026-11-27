# Tema WordPress Nativo — Teoria Geek (`v2.12.1`)

Tema WordPress editorial 100% nativo, autocontido e otimizado para Core Web Vitals, desenvolvido por **Kauan Kelvin** sob medida para o portal **Teoria Geek** (`teoriageek.com.br`), hospedado na **Locaweb** (PHP 8.0–8.3+, WordPress 6.2–7.1+, **WP Super Cache**), em substituição definitiva ao tema legado *Newspaper v12.6.2* (`td-composer` / `td-cloud-library`).

---

## 1. Requisitos e Compatibilidade

- **WordPress:** 6.2+ (compatível com **6.2–7.1+**, testado no **6.9+**)
- **PHP:** 8.0+ (validado em **PHP 8.0–8.3+**)
- **Servidor:** Apache / LiteSpeed / Nginx (pronto para **Locaweb**, sem dependência de Node.js, npm ou build no servidor)
- **Cache de página:** compatível com **WP Super Cache** (limpeza automática ao publicar/editar/excluir posts ou salvar o Personalizador; contagem de leituras, curtidas e votos operam via REST API com rate limit)
- **Plugins opcionais integrados (com fallback seguro quando ausentes):**
  - **Yoast SEO:** breadcrumbs nativos (`yoast_breadcrumb`) + supressão automática de OpenGraph/JSON-LD duplicados + canonical limpo em filtros `?ordem=`.
  - **Post Views Counter:** leitura otimizada de `wp_post_views` + gravação via `pvc_view_post()` combinada com fallback nativo em baldes diários (`_tg_views_daily`).
  - **Disqus:** estilização dedicada para `#disqus_thread`, `content-visibility: auto` e reset automático de tema ao alternar Claro/Escuro.
  - **CookieYes:** detecção automática (`CKY_VERSION` / `CookieYes\Lite\Loader`) suprimindo o banner LGPD nativo do tema.
  - **OneSignal / WebPushr:** disparo automático no botão *"Eu quero!"* da Central de Alertas.
  - **Google Site Kit / AdSense:** slots opcionais com `min-height` reservado (zero CLS).

---

## 2. Arquitetura de Diretórios

```text
teoriageek/
├── style.css                     # Cabeçalho oficial do tema (v2.12.1, Author: Kauan Kelvin)
├── functions.php                 # Bootstrapper: constantes e require_once dos módulos em inc/ (incluindo analytics.php e admin-dashboard.php)
├── theme.json                    # Configuração de layout (68ch / 1280px), paleta e famílias tipográficas
├── manifest.json                 # Web App Manifest PWA (#0D1933 / #102042)
├── screenshot.png                # Capa oficial do tema no WordPress (1200×900)
├── README.md                     # Documentação técnica de produção
├── CHANGELOG.md                  # Histórico estruturado de versões até v2.12.1
├── QA-CHECKLIST.md               # Roteiro de QA automatizado e manual pré-release
│
├── header.php                    # Cabeçalho sticky, busca, Reels, Sino de Alertas, tema e progresso
├── footer.php                    # Rodapé institucional, Google Notícias, Newsletter e modais globais
├── front-page.php                # Capa editorial (Hero 3D, Giro Geek paginado, Mais Lidas, Editorias)
├── single.php                    # Leitor de matéria (Spoiler Gate, Leia Também, Review, Timeline, Reação)
├── page-reels.php                # Experiência vertical 9:16 (/reels/) em 3 zonas (Desktop) / tela cheia
├── category.php / archive.php    # Arquivos com filtros (?ordem=populares|criticas)
├── taxonomy-universo.php         # Hub / Dossiê de Universo (/universo/<slug>/)
├── search.php / author.php       # Busca refinada (?tg_cat=&ordem=recentes) e página de autor (ProfilePage)
├── tag.php / page.php / 404.php  # Templates auxiliares e fallback 404 com últimas matérias
├── comments.php / index.php      # Comentários nativos/Disqus e fallback de loop
│
├── inc/                          # Lógica PHP modular (zero dependências externas)
│   ├── helpers.php               # Utilitários, mojibake, views/likes/community-score, blocos da Home, SVG icons
│   ├── setup.php                 # Theme supports, tamanhos de imagem, menus, sidebars, segurança HTTP, Site Health
│   ├── taxonomies.php            # Registro da taxonomia hierárquica `universo` (/universo/<slug>/)
│   ├── seo.php                   # OpenGraph, Twitter Cards, JSON-LD (NewsArticle, Review, BreadcrumbList, ProfilePage)
│   ├── enqueue.php               # Anti-FOUC inline, preload de fontes/LCP, bundle.min.css, JS com defer e localize
│   ├── legacy-sanitizer.php      # Remoção segura de shortcodes Newspaper/VC, [spoiler], YouTube Facade e Ad mid-article
│   ├── customizer.php            # 5 seções no Personalizador e injeção dinâmica de variáveis :root em wp_head
│   ├── meta-boxes.php            # Meta Box nativa "Ficha Editorial — Teoria Geek"
│   ├── template-tags.php         # Badges, breadcrumbs, menus, slots de anúncio, Mais Lidas 24h/7d, Leia Também inline
│   ├── analytics.php             # Motor de Analytics First-Party (POST /telemetry, 30 dias compactos, tempo real 5 min)
│   ├── reels-api.php             # Rewrite virtual /reels/ e endpoints REST públicos teoriageek/v1
│   └── admin-dashboard.php       # Central Teoria Geek (/wp-admin/), endpoint /admin-metrics, widget e colunas edit.php
│
├── template-parts/               # Componentes de interface reutilizáveis
│   ├── hero-home.php             # Carrossel Hero 3D HQ (4,2s), 3 secundárias, Reels Facade e Radar na Redação
│   ├── breaking-ticker.php       # Faixa Plantão Geek com botão Pausar/Retomar
│   ├── card-article.php          # Card editorial padrão / review / compact-grid (com selo de spoiler e nota)
│   ├── card-compact.php          # Card horizontal compacto (Giro Geek, Radar, buscas)
│   ├── cover-media.php           # Capa anti-CLS com srcset/sizes, tratamento de capas antigas e fallback SVG
│   ├── review-card.php           # Veredito Editorial amarelo + seletor interativo Nota da Comunidade (1–10)
│   ├── series-timeline.php       # Linha do Tempo de Cobertura Especial (universo com 3+ matérias)
│   ├── article-reaction.php      # Reação rápida de 1 clique ("Curtiu esta matéria?") sincronizada com _tg_likes_count
│   ├── newsletter-box.php        # Captura leve de Newsletter (1 campo de e-mail; artigo e rodapé)
│   ├── community-cta.php         # Bloco de Canais Oficiais (WhatsApp, Telegram e Google Notícias)
│   ├── alerts-saved-drawer.php   # Gaveta do Sino (Central de Alertas, push OneSignal/WebPushr e canais)
│   ├── share-buttons.php         # Barra de compartilhamento (Ver em Reels, Share nativo, WhatsApp, X, Copiar)
│   ├── author-box.php            # Box do autor com avatar, bio e link de arquivo
│   ├── next-article.php          # Card "Próxima Matéria" no fim do artigo
│   ├── related-posts.php         # Grade de matérias relacionadas
│   ├── reels-strip.php           # Faixa de Web Stories / Reels (5 cols na Home, 3 cols em single.php)
│   ├── navigation-mobile.php     # Drawer de navegação mobile com acordeão de submenus
│   ├── search-modal.php          # Modal de busca instantânea (Ctrl+K)
│   ├── pagination.php            # Paginação editorial acessível
│   └── cookie-banner.php         # Banner LGPD nativo (suprimido se CookieYes estiver ativo)
│
└── assets/
    ├── css/
    │   ├── bundle.min.css        # Bundle único carregado no site público (gerado dos 4 arquivos abaixo)
    │   ├── main.css              # Build estático Tailwind + @font-face locais (.woff2)
    │   ├── responsive.css        # Contenção mobile, ergonomia de widgets e proteção do rodapé
    │   ├── enhancements.css      # TOC, capitular, lightbox, A-/A+, skeletons e fallback de imagens
    │   ├── design-system.css     # Tokens oficiais, componentes editoriais e evolução visual (fonte para novas regras)
    │   └── admin-dashboard.css   # CSS isolado da Central Teoria Geek (#tg-admin-app) no /wp-admin/
    ├── js/
    │   ├── main.js               # Interações globais (tema, Hero 3D HQ, Giro, Ticker, Alertas, views/likes/score)
    │   ├── enhancements.js       # Fallback de imagens no conteúdo, TOC, capitular, A-/A+, cookies e foco
    │   ├── reels.js              # Player vertical /reels/ em 3 lâminas com persistência de curtidas
    │   └── admin-dashboard.js    # Gráficos SVG nativos, colunas 3D CSS, Big Board e polling na Central
    ├── fonts/                    # 14 arquivos .woff2 auto-hospedados (Barlow Condensed, Plus Jakarta Sans, JetBrains Mono, Space Grotesk, Bangers)
    ├── images/                   # logo-teoria-geek.png (300×190) e logo-teoria-geek-footer.png (120×120)
    └── xsl/rss-style.xsl         # Folha de estilo XSL para visualização limpa do Feed RSS no navegador
```

---

## 3. Identidade Visual e Pipeline de CSS

### Paleta Oficial (`v2.12.0`)

| Token / Uso | Valor Hex | Aplicação |
|---|---|---|
| `--tg-primary` | `#0073E6` | Azul primário Teoria Geek (botões primários, barras de seção, destaque ativo) |
| `--accent-brand` (Dark) | `#3898FF` / `#60A5FA` | Links e números de destaque em superfícies escuras (contraste WCAG AA) |
| `--tg-accent` | `#FACC15` | Amarelo destaque editorial — **sempre** combinado com texto escuro `#0B0F19` (`--tg-on-accent`) |
| `--tg-text` (Claro) / `--bg` (Admin) | `#0B0F19` | Tinta principal no Modo Claro e base "Redação Noturna" na Central `/wp-admin/` |
| `--chrome-bg` | `#102042` | Cabeçalho, rodapé e chrome estrutural do portal (`theme-color` no Modo Escuro) |
| `--tg-bg` (Escuro) | `#0D1933` | Fundo principal do portal no Modo Escuro (superfícies `#122244` e `#182C56`) |
| `--tg-bg` (Claro) | `#FFFFFF` | Fundo contínuo limpo no Modo Claro (superfície alternativa `#F4F6F9`) |

### Regra Obrigatória de Manutenção do CSS Público
1. `assets/css/main.css` é um **build estático do Tailwind CSS** (e já contém os `@font-face` locais `.woff2`). **Não edite classes utilitárias diretamente em `main.css` nem espere que novas classes Tailwind inexistentes nele funcionem sem rebuild.**
2. **Todo novo estilo do site público deve ser escrito como classe semântica dedicada em `assets/css/design-system.css`.**
3. O tema enfileira `assets/css/bundle.min.css` em produção (1 única requisição com cache-busting via `filemtime()`). Ele consolida, nesta ordem:
   `main.css` → `responsive.css` → `enhancements.css` → `design-system.css`.
4. **Atenção crítica ao regenerar `bundle.min.css`:** qualquer minificador utilizado **deve preservar espaços ao redor de `+` e `-` dentro de `calc(...)`** (ex.: `calc(100dvh - var(--wp-admin-bar-h, 0px))`). Remover esses espaços quebra o cálculo no navegador.

### Isolamento do Painel Administrativo (`/wp-admin/`)
- `inc/admin-dashboard.php` enfileira `assets/css/admin-dashboard.css` e `assets/js/admin-dashboard.js` exclusivamente via hook `admin_enqueue_scripts`, checando o `$hook_suffix` real de `add_menu_page()` (`toplevel_page_teoriageek-central`), além de carregar apenas o CSS leve em `index.php` (widget do Painel) e `edit.php` (colunas de *Todos os Posts*).
- Todas as regras da Central ficam isoladas sob `#tg-admin-app` (`isolation: isolate`) e declaram `@font-face` próprios apontando para `../fonts/*.woff2`, sem vazar estilos para o restante do `/wp-admin/`.

---

## 4. Recursos Editoriais e Engajamento (`v2.12.0`)

- **Hero Editorial com Virada de Página HQ 3D (`hero-home.php` + `main.js`):** exibe até 4 destaques (priorizando `_tg_main_headline` como Slide 1), com transição WebGL cilíndrica de virada de página em quadrinhos (`createHalftoneHQRenderer`), autoplay de `4,2s` (`data-interval="4200"`), dock discreto (`01 / 04`, Pausar/Retomar, `‹` / `›`), minimapa segmentado (`3px`), trilho numerado 2px sincronizado, swipe horizontal no mobile e fallback suave caso WebGL ou `prefers-reduced-motion` estejam ativos.
- **Plantão Geek Acessível (`breaking-ticker.php` + `main.js`):** faixa contínua das últimas notícias com botão Pausar/Retomar (`data-tg-ticker-pause`, WCAG 2.2.2) que libera foco residual ao clicar para retomar imediatamente e restringe a pausa por hover à área das manchetes.
- **Giro Geek Paginado (`front-page.php` + `main.js`):** exibe até 12 matérias deduplicadas divididas em 3 faixas de 4 cards (`data-tg-strip-carousel`), com dots e setas `‹` / `›`.
- **Mais Lidas `24h` / `7 dias` com Contagem Real (`template-tags.php` + `reels-api.php` + `main.js`):**
  - Em `single.php`, `initArticleViewTracker()` dispara `POST /wp-json/teoriageek/v1/posts/{id}/view` após `1,5s` com a aba visível, protegido por `sessionStorage` (`tg-viewed-{id}`) contra F5 repetido e compatível com WP Super Cache.
  - O servidor aciona `pvc_view_post()` (se Post Views Counter estiver instalado) **e** incrementa `_tg_views_count` + baldes diários `_tg_views_daily` (janela rolante de 14 dias), garantindo rankings distintos para `24h` e `7d`.
- **Reels Verticais (`/reels/`, `page-reels.php` + `reels.js`):** experiência 9:16 em 3 zonas no Desktop e tela cheia no Mobile com 3 lâminas por matéria (Manchete, Pontos-Chave, Veredito/Leitura), filtros (`Para Você`, `Mais Lidas`, `Salvos` no player e Editorias), atalhos de teclado (`↑`/`↓`, `←`/`→`, `S`) e **curtidas persistidas em `_tg_likes_count`** via `POST /posts/{id}/like` (sincronizadas com `teoriageek-liked-ids` e com o botão de reação do artigo).
- **Alerta de Spoiler (`meta-boxes.php` + `single.php` + `legacy-sanitizer.php`):**
  - Checkbox *"Esta matéria contém spoilers"* (`_tg_has_spoilers`) aplica selo visual nos cards e bloqueio interativo com blur sobre `.entry-content` (desbloqueado por clique em `data-tg-spoiler-unlock`).
  - Shortcode nativo sem JS para trechos pontuais:
    ```text
    [spoiler titulo="Spoiler do episódio final"]Texto protegido aqui.[/spoiler]
    ```
- **Bloco "Leia Também" Automático (`inc/template-tags.php`):** `teoriageek_inject_inline_read_more()` insere 1 card enxuto após o 4º parágrafo em artigos com 6+ parágrafos, priorizando outra matéria do mesmo `universo` ou da categoria primária (HTML cacheável pelo WP Super Cache, transient de 30 min).
- **Nota da Comunidade nas Críticas (`review-card.php` + `main.js`):** seletor de notas inteiras de `1` a `10` sem login ao lado da Nota da Redação, persistido em `_tg_community_score_sum` e `_tg_community_score_count` via `POST /posts/{id}/community-score` com trava local em `localStorage` (`teoriageek-rated-posts`).
- **Reação Rápida de 1 Clique (`article-reaction.php` + `main.js`):** botão *"Curtir"* ao final do artigo unificado ao mesmo contador `_tg_likes_count` e `localStorage` (`teoriageek-liked-ids`) dos Reels.
- **Linha do Tempo de Cobertura Especial (`series-timeline.php`):** exibida automaticamente quando o post pertence a um termo da taxonomia `universo` com **3 ou mais** publicações, destacando o artigo atual (*"Lendo agora"*) e ligando ao hub `/universo/<slug>/`.
- **Captura Leve de Newsletter (`newsletter-box.php`):** formulário de 1 campo de e-mail exibido no fim do artigo (`variant=article`) e no rodapé (`variant=footer`) **somente quando `teoriageek_newsletter_action_url` estiver configurada** no Personalizador (compatível com MailerLite, Brevo, Substack ou endpoint próprio).
- **Canais Oficiais & Central de Alertas (`community-cta.php`, `footer.php`, `alerts-saved-drawer.php`):** links de **WhatsApp**, **Telegram** e **Google Notícias** configurados em um único local no Personalizador e refletidos na Home, no rodapé e na gaveta do sino (junto ao feed `/alerts` e ao disparo de OneSignal/WebPushr).
- **Leitura, Mídia & SEO (`enhancements.js`, `main.js`, `legacy-sanitizer.php`, `seo.php`, `setup.php`):** controles `A-`/`100%`/`A+`, sumário retrátil (TOC), letra capitular, Lightbox nativo para imagens do artigo, fallback para imagens quebradas, YouTube Facade sob clique (`youtube-nocookie.com`), sanitização não-destrutiva de shortcodes legados (`td_*`, `vc_*`, `rbc_*`), reparo de mojibake UTF-8, OpenGraph/JSON-LD (`NewsArticle`, `Review`, `BreadcrumbList`, `ProfilePage`), bloqueio de XML-RPC/pingbacks e cabeçalhos HTTP (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## 5. Central Teoria Geek (`/wp-admin/`) & Analytics First-Party

Acessível pelo menu **Teoria Geek** (`admin.php?page=teoriageek-central`, permissão `edit_posts`):

- **Identidade "Redação Noturna":** tema escuro por padrão com alternância para **Tema claro** persistida em `localStorage` (`tgAdmTheme`), selo **● N online agora** clicável no topo, seletor de período (`Hoje` | `7d` | `14d` | `30d`), fontes locais `.woff2` e colunas 3D em CSS puro exibindo as leituras diárias dos últimos 14 dias (respeita `prefers-reduced-motion`).
- **Abas da Central:**
  1. **Visão geral:** faixa executiva *Pulso Analytics* (online agora, cliques, zona campeã, principal origem e tempo ativo médio), total de leituras nos últimos 7 dias com delta percentual, 4 cards KPI com mini sparklines, gráfico de área de tendência (14 dias), gráfico Donut das 6 maiores editorias, ranking *Mais lidas* (`24h` / `7 dias`) e comparativo *Críticas: redação vs. comunidade*.
  2. **Audiência & Origem** *(estilo Google Analytics, 100% first-party sem cookies)*: leitores online agora (5 min), sessões, páginas/sessão, visualizações com delta %, tempo ativo médio de leitura, taxa de rejeição (bounce rate), **Origens de Tráfego (Referrers)** + top domínios externos, Donut de **Dispositivos (Mobile/Desktop/Tablet)** + tipos de página, **Horários de Pico (00h–23h)**, **Funil de Profundidade de Leitura (Scroll Depth `25% → 50% → 75% → 100%`)**, **Páginas Mais Acessadas**, páginas abertas ao vivo e **Campanhas UTM**.
  3. **Cliques & Comportamento** *(aonde o público mais clica)*: total de cliques, zona campeã, cliques por sessão, ações de conversão, **Mapa de Cliques por Zona do Portal** (Hero 3D, Giro Geek, Mais Lidas, Reels, Menu, Plantão, Leia Também, Canais Oficiais, Compartilhamento, Rodapé, Links Externos), **Conversões & CTAs** (WhatsApp, Telegram, Google Notícias, Newsletter, Compartilhamento, Spoilers, YouTube, Reels, Curtidas, Votos, Saídas externas), **Ranking dos Links e Botões Mais Clicados (Top 15)** e **Termos Mais Buscados** (sinalizando buscas com `0 resultados` como oportunidade de pauta).
  4. **Redação:** contadores de fila editorial (*rascunhos*, *aguardando revisão*, *agendadas*, exibidos apenas para usuários com `edit_others_posts`), listas de próximas publicações e rascunhos recentes, *Destaques no ar* (Manchete `_tg_main_headline`, Plantão `_tg_plantao` e Spoiler `_tg_has_spoilers`) e ranking de autores dos últimos 30 dias.
  5. **Rankings:** Top mais lidas em 7 dias e Top mais curtidas (`_tg_likes_count`).
  6. **Saúde e atalhos** *(somente administradores com `manage_options`)*: semáforo de configuração (Analytics First-Party, rastreio de editores, rota `/reels/`, WhatsApp, Telegram, Google Notícias, Newsletter, WP Super Cache, Post Views Counter, slots de anúncios), botão **Limpar cache do tema**, **Zerar Analytics**, alternância de rastreio da equipe e atalhos diretos do Personalizador.
- **Big Board:** botão para modo tela cheia voltado a TV/monitor de redação (pressione `Esc` para sair).
- **Atualização automática inteligente:** polling a cada `2 minutos` (`pollMs = 120000`) via `GET /wp-json/teoriageek/v1/admin-metrics?range=<today|7d|14d|30d>`, disparado **apenas quando `document.visibilityState === 'visible'`**, além do botão manual *Atualizar agora* (`?refresh=1`).
- **Integrações nativas do `/wp-admin/`:**
  - Widget compacto **Teoria Geek — Resumo Rápido** no Painel Inicial (`index.php`).
  - Colunas **Métricas** (views, curtidas, nota) e **Destaques** (Manchete, Plantão, Spoiler) + seletor de filtro `tg_flag` em **Todos os Posts** (`edit.php`).

---

## 6. Contrato da REST API (`teoriageek/v1`)

> **Nota crítica de compatibilidade com WP Super Cache:** todos os endpoints públicos (`GET /search`, `/reels`, `/alerts` e `POST /posts/{id}/view`, `/like`, `/community-score`, `/telemetry`) são chamados **sem header `X-WP-Nonce`** pelo front-end público, evitando rejeições `403 rest_cookie_invalid_nonce` em HTML cacheado por mais de 12–24 horas. Apenas `/admin-metrics` exige sessão autenticada + `X-WP-Nonce`.

| Rota | Método | Parâmetros | Permissão / Rate Limit | Resposta JSON | `post_meta` / Options / Transients afetados |
|---|---|---|---|---|---|
| `/teoriageek/v1/search` | `GET` | `q` (obrigatório, 2–80 chars) | Público (`__return_true`) | `{ items: [{ id, title, url, categoryName, fillColor, inkColor, dateRelative }] }` | Lê/grava transient `tg_search_<md5(q)>` (**3 min**) |
| `/teoriageek/v1/reels` | `GET` | `page` (1+), `per_page` (1–16, padrão 10), `tab` (`foryou`\|`trending`\|`saved`), `category` (slug), `post` (slug), `id` (int), `slugs` (CSV para `tab=saved`) | Público (`__return_true`) | `{ items: [PostCard...], page }` | Lê `wp_post_views` / `_tg_views_count` / `_tg_likes_count` (batch priming); `tab=trending` usa `teoriageek_most_read_pvc_7d_v2` |
| `/teoriageek/v1/alerts` | `GET` | — | Público (`__return_true`) | `{ latestId, items: [{ id, slug, title, url, thumb, categoryName, fillColor, inkColor, dateRelative }] }` | Lê/grava transient `teoriageek_rest_alerts_v1` (**3 min**) |
| `/teoriageek/v1/posts/{id}/view` | `POST` | `{id}` na rota | Público / **40 req/min por IP** (`tg_rl_view_<md5>`) | `{ views, views24h }` (`404` se post inválido, `429` se limitado) | Chama `pvc_view_post()` (se ativo) e atualiza `_tg_views_count` + `_tg_views_daily` (14 dias) |
| `/teoriageek/v1/posts/{id}/like` | `POST` | `{id}` na rota; body JSON `{ action: "like" \| "unlike" }` | Público / **30 req/min por IP** (`tg_rl_like_<md5>`) | `{ likes }` (`404` / `429`) | Atualiza `_tg_likes_count` (mínimo `0`) |
| `/teoriageek/v1/posts/{id}/community-score` | `POST` | `{id}` na rota; body JSON `{ score: 1..10 }` | Público / **20 req/min por IP** (`tg_rl_community_score_<md5>`) | `{ average, count }` (`400` se nota fora de 1–10, `404`, `429`) | Incrementa `_tg_community_score_count` e `_tg_community_score_sum` |
| `/teoriageek/v1/telemetry` | `POST` | Body JSON `{ sid, events: [{ t: "pv"\|"clk"\|"eng"\|"conv"\|"srch", ... }] }` (via `sendBeacon` ou `fetch`) | Público / **120 req/min por IP** (`tg_rl_telemetry_<md5>`) + filtro anti-bot | `{ ok: true, accepted }` (`429` se limitado) | Atualiza option `teoriageek_analytics_days_v1` (`autoload = no`, retenção 30 dias) e transient `teoriageek_live_visitors_v1` (**5 min**) |
| `/teoriageek/v1/admin-metrics` | `GET` | `range` (`today`\|`7d`\|`14d`\|`30d`, padrão `7d`), `refresh=1` (opcional) | Autenticado (`current_user_can('edit_posts')` + header `X-WP-Nonce`) | `{ kpis, series14d, categories, top24h, top7d, analytics, range, updatedAt, ts, critics, mostLiked, queue, flags, authors, pubSeries }` | Lê/limpa `teoriageek_admin_kpis_v2` (**5 min**), `teoriageek_admin_series_v1` (**5 min**) e `teoriageek_admin_extra_v1_{uid}` (**2 min**) |

---

## 7. Modelo de Dados (`post_meta`, `theme_mod` e Transients)

### 7.1 Metadados de Post (`wp_postmeta`)

| Meta Key | Tipo | Origem / Gravação | Uso no Tema |
|---|---|---|---|
| `_tg_main_headline` | `'1'` | Ficha Editorial (`meta-boxes.php`, unicidade garantida) | Prioriza o post como Slide 1 do Hero em `teoriageek_get_home_blocks()` e exibido em *Destaques no ar* / `edit.php` (retrocompatível com `_tg_is_hero`) |
| `_tg_plantao` | `'1'` | Ficha Editorial (`meta-boxes.php`) | Destaca o post na faixa *Plantão Geek* (`helpers.php`, `breaking-ticker.php`) e em *Destaques no ar* / `edit.php` (retrocompatível com `_tg_in_ticker`) |
| `_tg_has_spoilers` | `'1'` | Ficha Editorial (`meta-boxes.php`) | Selo de spoiler nos cards, bloqueio com blur em `single.php` e painel *Destaques* na Central / `edit.php` |
| `_tg_editorial_format` | `string` | Ficha Editorial (`noticia`, `critica`, `review`, `especial`) | Define o selo de formato editorial (fallback automático por categoria) |
| `_tg_review_score` | `string` (`0.0`–`10.0`) | Ficha Editorial (`meta-boxes.php`) | Card de Nota/Veredito, filtro `?ordem=criticas` e JSON-LD `Review` |
| `_tg_bullet_1`..`3` | `string` (≤ 160 chars) | Ficha Editorial (`meta-boxes.php`) | Caixa *Em Resumo* em `single.php` e Lâmina 2 dos Reels |
| `_tg_source_name` / `_tg_source_url` | `string` / URL `http(s)` | Ficha Editorial (`meta-boxes.php`) | Crédito de fonte externa na matéria e nos Reels |
| `_tg_views_count` | `int` | `POST /posts/{id}/view` (`helpers.php`) | Contador próprio total de visualizações |
| `_tg_views_daily` | `array<YYYYMMDD,int>` | `POST /posts/{id}/view` (`helpers.php`) | Baldes diários (últimos 14 dias) para *Mais Lidas 24h/7d* e série 14d na Central |
| `_tg_likes_count` | `int` | `POST /posts/{id}/like` (`reels-api.php`) | Curtidas persistidas compartilhadas entre `/reels/`, `article-reaction.php` e Central |
| `_tg_community_score_sum` | `float` | `POST /posts/{id}/community-score` | Soma acumulada dos votos da comunidade (1–10) |
| `_tg_community_score_count` | `int` | `POST /posts/{id}/community-score` | Quantidade de votos da comunidade |
| `td_post_theme_settings` | `array` (legado) | Leitura somente (Newspaper/tagDiv) | Fallback para subtítulo, fonte externa e notas/critérios legados |
| `_yoast_wpseo_primary_category` / `_yoast_wpseo_estimated-reading-time-minutes` | `int` (plugin) | Leitura somente (Yoast SEO) | Categoria primária e tempo estimado de leitura quando presentes |

### 7.2 Opções do Personalizador (`theme_mod`)

| Seção no Personalizador | Chaves `theme_mod` | Padrão / Observação |
|---|---|---|
| **Cores e Identidade** | `teoriageek_site_name`, `teoriageek_logo_dark`, `teoriageek_color_primary`, `teoriageek_color_accent`, `teoriageek_color_bg`, `teoriageek_color_surface`, `teoriageek_color_text` (+ `custom_logo` nativo) | `#0073E6`, `#FACC15`, `#FFFFFF`, `#FFFFFF`, `#0B0F19` |
| **Categorias da Capa** | `teoriageek_cat_destaque`, `teoriageek_cat_noticias`, `teoriageek_cat_criticas`, `teoriageek_cat_reviews`, `teoriageek_cat_especiais`, `teoriageek_cat_col_1`..`col_5` | Mapeiam cada bloco da `front-page.php` |
| **Redes Sociais & Reels** | `teoriageek_social_instagram`, `_youtube`, `_spotify`, `_twitch`, `_twitter`, `_facebook`, `teoriageek_reels_stamp_text` | Links oficiais + selo `'CURTIU!'` |
| **Monetização & Anúncios** | `teoriageek_ad_top`, `teoriageek_ad_mid_article`, `teoriageek_ad_sidebar`, `teoriageek_sponsor_category`, `teoriageek_sponsor_label`, `teoriageek_sponsor_name`, `teoriageek_sponsor_url` | Sanitizado com `unfiltered_html` (admins) ou `wp_kses_post` |
| **Estreias & Canais** | `teoriageek_premieres_list`, `teoriageek_channel_title`, `teoriageek_channel_subtitle`, `teoriageek_channel_whatsapp`, `teoriageek_channel_telegram`, `teoriageek_channel_google_news`, `teoriageek_newsletter_action_url`, `teoriageek_newsletter_email_field`, `teoriageek_newsletter_title`, `teoriageek_newsletter_desc` | Controla agenda de Estreias, Canais Oficiais (Home/Rodapé/Sino) e caixa de Newsletter |

### 7.3 Transients e Política de Cache

| Transient | TTL | Módulo | Invalidação |
|---|---|---|---|
| `teoriageek_home_blocks_v5` | `10 min` | `inc/helpers.php` | `save_post_post`, `deleted_post`, `trashed_post`, `customize_save_after`, botão *Limpar cache* |
| `teoriageek_reels_cats_v2` | `15 min` | `inc/helpers.php` | Idem `teoriageek_flush_editorial_transients()` |
| `teoriageek_weekly_premieres_v1` | `30 min` | `inc/helpers.php` | `customize_save_after`, botão *Limpar cache* |
| `teoriageek_most_read_pvc_7d_v2` / `_24h_v2` | `15 min` | `inc/template-tags.php` | Botão *Limpar cache* na Central |
| `tg_inline_rm_{post_id}` | `30 min` | `inc/template-tags.php` | Expiração natural (TTL) |
| `teoriageek_rest_alerts_v1` | `3 min` | `inc/reels-api.php` | `teoriageek_flush_editorial_transients()`, botão *Limpar cache* |
| `tg_search_{md5}` | `3 min` | `inc/reels-api.php` | Expiração natural (TTL) |
| `tg_rl_{bucket}_{md5(ip)}` | `1 min` | `inc/reels-api.php` | Janela deslizante de rate limit por IP |
| `teoriageek_admin_kpis_v2` / `teoriageek_admin_series_v1` | `5 min` | `inc/admin-dashboard.php` | Botão *Atualizar agora* (`?refresh=1`) ou *Limpar cache* |
| `teoriageek_admin_extra_v1_{user_id}` | `2 min` | `inc/admin-dashboard.php` | Botão *Atualizar agora* (`?refresh=1`) ou *Limpar cache* |
| `teoriageek_live_visitors_v1` | `6 min` (janela ativa `5 min`) | `inc/analytics.php` | Atualizado automaticamente por `POST /telemetry` ou zerado por *Zerar Analytics* |
| Option `teoriageek_analytics_days_v1` (`autoload = no`) | Retenção rolante de `30 dias` | `inc/analytics.php` | Poda automática de dias anteriores a 30d; zerável em *Saúde e atalhos* |

---

## 8. Runbook de Deploy e Produção (Locaweb + WP Super Cache)

### Passo a Passo de Instalação / Atualização
1. **Backup preventivo:** faça backup completo do banco MySQL e de `wp-content/` no painel da Locaweb.
2. **Upload do pacote:** em **Aparência > Temas > Adicionar novo > Enviar tema**, envie o arquivo `teoriageek-theme-v2.12.1.zip` e confirme a substituição (ou descompacte diretamente em `wp-content/themes/teoriageek/`).
3. **Ativação e higiene de legados:** ative o tema **Teoria Geek** e desative os plugins proprietários do tema anterior (`td-composer`, `td-cloud-library` e eventuais complementos `td-*`).
4. **Flush de Permalinks:** acesse **Configurações > Links Permanentes** e clique em **Salvar alterações** uma vez para garantir o registro das rotas `/reels/` e `/universo/<slug>/`.
5. **Revisão no Personalizador:** em **Aparência > Personalizar**, verifique **Estreias & Canais** (WhatsApp, Telegram, Google Notícias e Newsletter), **Cores e Identidade** e **Monetização & Anúncios**.
6. **Limpeza de Cache:**
   - Acesse **Teoria Geek > Saúde e atalhos** e clique em **Limpar cache do tema** (invalida todos os transients e aciona `wp_cache_clear_cache()` no WP Super Cache).
   - Se usar CDN/Cloudflare, execute **Purge Everything** e mantenha *bypass* para `/wp-admin/*`, `/wp-json/*` e `/?s=*`.
7. **Verificação pós-deploy:** execute o roteiro de smoke test em `QA-CHECKLIST.md` e confira **Ferramentas > Diagnóstico do Site** (*Saúde do Tema Teoria Geek*).

### Troubleshooting (Problemas Comuns em Produção)

| Sintoma | Causa Provável | Solução |
|---|---|---|
| `/reels/` ou `/universo/...` retorna **404** | Regras de rewrite não foram atualizadas após upload/migração | Acesse **Configurações > Links Permanentes** e clique em **Salvar alterações**. Confirme na aba *Saúde e atalhos* que *Rota /reels/* está **Ativa**. |
| CSS antigo ou layout quebrado após atualização | Cache de página no WP Super Cache ou cache de borda/navegador | Clique em **Limpar cache do tema** na Central (ou **Excluir Cache** no WP Super Cache), limpe a CDN e recarregue com `Ctrl + F5`. O tema já aplica `?ver=<filemtime>` em `bundle.min.css`. |
| Canais (WhatsApp / Telegram / Google Notícias) não aparecem no sino | Campos vazios no Personalizador ou URL sem `https://` | Preencha URLs completas (`https://...`) em **Aparência > Personalizar > Estreias & Canais — Teoria Geek**, salve e limpe o cache de página. |
| Caixa de Newsletter não aparece no artigo/rodapé | Comportamento intencional quando a URL de envio está vazia | Preencha *Newsletter — URL de envio do formulário* em **Estreias & Canais** com uma URL `https://` válida. |
| *Mais Lidas 24h* e *7 dias* exibem os mesmos posts recém-instalados | Poucos acessos registrados desde a virada ou cache de 15 min ativo | Aguarde o tráfego popular `_tg_views_daily` / `wp_post_views` (cada leitura em `single.php` registra após `1,5s`) e limpe o cache do tema na Central. |
| Gráficos ou fontes não carregam na Central `/wp-admin/` | Permissão de leitura nos `.woff2`, bloqueio de REST ou erro de cache de admin | Verifique `assets/css/admin-dashboard.css`, `assets/js/admin-dashboard.js` e `assets/fonts/*.woff2` no servidor e confirme que `/wp-json/teoriageek/v1/admin-metrics` responde HTTP 200 logado. |
