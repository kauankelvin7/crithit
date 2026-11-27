# Changelog — Tema WordPress Teoria Geek

Todas as mudanças relevantes do tema nativo **Teoria Geek** são registradas neste arquivo, seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [2.12.1] — Correção `/admin-metrics`, Auditoria REST & Analytics First-Party

### Corrigido
- **Erro `404 (Not Found)` em `GET /wp-json/teoriageek/v1/admin-metrics` (`functions.php`):** removido o wrapper `if ( is_admin() )` ao redor de `require_once TEORIAGEEK_DIR . '/inc/admin-dashboard.php';`, pois em requisições `/wp-json/...` o WordPress avalia `is_admin() === false` e impedia o registro do hook `rest_api_init`. Todos os hooks administrativos continuam restritos ao `/wp-admin/` e `/admin-metrics` mantém `permission_callback` exigindo `current_user_can( 'edit_posts' )` (retornando `401`/`403` para anônimos).
- **Prevenção de `403 rest_cookie_invalid_nonce` sob WP Super Cache (`inc/enqueue.php`, `assets/js/main.js`, `assets/js/reels.js`):** removido o envio do cabeçalho `X-WP-Nonce` (e a injeção do nonce no `teoriageekConfig` público cacheável) nas rotas públicas anônimas (`/posts/{id}/view`, `/posts/{id}/like`, `/posts/{id}/community-score` e `/telemetry`), evitando falhas em páginas cacheadas por mais de 12–24 horas.
- **Compatibilidade de URLs REST com links permanentes simples (`assets/js/main.js`, `assets/js/reels.js`, `assets/js/admin-dashboard.js`):** adicionado helper `buildRestUrl()` que concatena parâmetros com `&` quando `rest_url()` utiliza `?rest_route=...`.
- **Sincronização de destaques editoriais na Central e em `edit.php` (`inc/admin-dashboard.php`):** `flags`, coluna *Destaques* e filtro `tg_flag` agora leem `_tg_main_headline` e `_tg_plantao` (gravados pela Ficha Editorial), mantendo retrocompatibilidade com `_tg_is_hero` e `_tg_in_ticker`.

### Adicionado
- **Motor de Analytics First-Party (`inc/analytics.php` + `assets/js/main.js`):**
  - Endpoint público `POST /wp-json/teoriageek/v1/telemetry` (sem `X-WP-Nonce`, filtro anti-bot, rate limit de 120 lotes/min por IP, sem cookies e sem gravação de IP/PII), utilizando `navigator.sendBeacon` / `fetch({ keepalive: true })` com armazenamento compacto de 30 dias (`teoriageek_analytics_days_v1`, `autoload = no`) e leitores ativos em janela de 5 minutos (`teoriageek_live_visitors_v1`).
  - Rastreamento automático de **pageviews**, **sessões**, **páginas/sessão**, **taxa de rejeição (bounce rate)**, **origens de tráfego (Referrers + UTMs + domínios externos)**, **dispositivos (Mobile/Desktop/Tablet)**, **distribuição horária (00h–23h)**, **profundidade de leitura (Scroll Depth 25%/50%/75%/100%)**, **tempo ativo real de leitura**, **cliques por zona do portal** (22 zonas mapeadas), **top 15 links/botões mais clicados**, **conversões editoriais** (WhatsApp, Telegram, Google Notícias, Newsletter, compartilhamento, spoilers, YouTube, Reels, curtidas, votos e links externos) e **termos buscados** (com destaque para buscas sem resultado).
- **Novos painéis na Central Teoria Geek (`inc/admin-dashboard.php`, `assets/css/admin-dashboard.css`, `assets/js/admin-dashboard.js`):**
  - Selo ao vivo **● N online agora** no Hero, faixa **Pulso Analytics** na *Visão geral* e seletor de período (`Hoje` | `7d` | `14d` | `30d`) com atualização via `?range=...`.
  - Aba **Audiência & Origem** (estilo Google Analytics) e aba **Cliques & Comportamento** (*Aonde mais clicaram*).
  - Controles administrativos em **Saúde e atalhos** para alternar o rastreio de visitas da equipe logada e zerar o histórico de Analytics.

---

## [2.12.0] — Produção Locaweb

### Adicionado
- **Central Teoria Geek (`/wp-admin/`) — identidade "Redação Noturna":**
  - Tema escuro padrão (`#0B0F19`) com alternância para tema claro salva em `localStorage` (`tgAdmTheme`) e isolamento completo sob `#tg-admin-app` (`assets/css/admin-dashboard.css` + `assets/js/admin-dashboard.js` via `admin_enqueue_scripts`).
  - Fontes `.woff2` locais (`Barlow Condensed`, `Plus Jakarta Sans`, `JetBrains Mono`) carregadas diretamente da pasta `../fonts/` sem requisições externas.
  - Colunas 3D em CSS puro com as leituras diárias dos últimos 14 dias, respeitando `prefers-reduced-motion`.
  - Abas **Visão geral** (total 7d com variação percentual, KPIs com sparklines, tendência 14d com tooltip, Donut por editoria, Mais lidas 24h/7d e Críticas Redação vs. Comunidade), **Redação** (fila editorial para `edit_others_posts`, destaques no ar e autores dos últimos 30 dias), **Rankings** e **Saúde e atalhos** (exclusiva para `manage_options`, com semáforo de produção e botão *Limpar cache do tema*).
  - Modo **Big Board** em tela cheia para monitor/TV de redação (saída com `Esc`) e atualização automática a cada `2,5 min` apenas quando `document.visibilityState === 'visible'` via `GET /wp-json/teoriageek/v1/admin-metrics`.
- **Documentação Técnica & QA:**
  - `README.md` reestruturado com arquitetura de diretórios, pipeline de CSS (`design-system.css` → `bundle.min.css`), contrato completo da REST API `teoriageek/v1`, inventário de `post_meta`/`theme_mod`/transients e runbook de deploy/troubleshooting para Locaweb + WP Super Cache.
  - Criação do `CHANGELOG.md` e do `QA-CHECKLIST.md` com validações automatizadas pré-release e matriz funcional completa.
  - Padronização de cabeçalhos PHPDoc/JSDoc/CSS e atualização da capa oficial `screenshot.png` (`1200×900`).

### Corrigido
- **Plantão Geek (`breaking-ticker.php` / `main.js`):** botão Pausar/Retomar agora libera foco residual após clique de ponteiro e restringe a pausa por hover à faixa das manchetes, eliminando travamento ao retomar.
- **Mais Lidas `24h` vs. `7 dias` (`helpers.php` / `template-tags.php` / `reels-api.php` / `main.js`):** contagem real de visualizações em `single.php` via `POST /posts/{id}/view` após `1,5s` (com trava por sessão em `sessionStorage`, rate limit de 40 req/min e compatibilidade com WP Super Cache), alimentando `pvc_view_post()` e baldes diários próprios `_tg_views_daily` (14 dias) + `_tg_views_count`.
- **Reels (`/reels/`) — persistência de curtidas (`reels-api.php` / `reels.js`):** curtir/descurtir persiste em `_tg_likes_count` via `POST /posts/{id}/like` (rate limit 30 req/min) e mantém o contador sincronizado após recarregamento e com a reação rápida no fim do artigo.
- **Central de Alertas (`alerts-saved-drawer.php` / `main.js`):** exibição dinâmica dos canais oficiais configurados no Personalizador (WhatsApp, Telegram, Google Notícias e Feed RSS) e integração segura com OneSignal/WebPushr no botão *"Eu quero!"*.
- **Docblocks PHPDoc desalinhados/ausentes:** reposicionados e padronizados comentários em `inc/reels-api.php`, `inc/seo.php`, `inc/setup.php`, `inc/legacy-sanitizer.php`, `inc/helpers.php`, `header.php`, `template-parts/share-buttons.php`, `assets/js/*` e `assets/css/*` (zero alterações de lógica).

---

## [2.9.0 – 2.11.x] — Engajamento Editorial e Painel Admin

### Adicionado
- **Bloco "Leia Também" automático** (`teoriageek_inject_inline_read_more`): card enxuto injetado após o 4º parágrafo em matérias com 6+ parágrafos (HTML cacheável, transient de 30 min).
- **Nota da Comunidade** (`review-card.php` + `POST /posts/{id}/community-score`): votação rápida de 1 a 10 em críticas sem login, persistida em `_tg_community_score_sum` e `_tg_community_score_count` com trava em `localStorage`.
- **Reação rápida de 1 clique** (`article-reaction.php`): botão *"Curtir"* ao final do artigo unificado com `_tg_likes_count`.
- **Linha do Tempo de Cobertura Especial** (`series-timeline.php`): exibida automaticamente para matérias em taxonomia `universo` com 3+ publicações.
- **Newsletter leve** (`newsletter-box.php`): formulário de 1 campo exibido no fim do artigo e no rodapé apenas quando configurado no Personalizador.
- **Google Notícias:** suporte nativo no Personalizador, na Home (`community-cta.php`), no rodapé (`footer.php`) e na gaveta do sino (`alerts-saved-drawer.php`).
- **Alerta de Spoiler no corpo da matéria** (`_tg_has_spoilers`): checkbox na Ficha Editorial com bloqueio interativo por blur em `single.php` e selo nos cards.
- **Widget do Painel Inicial (`index.php`) e colunas/filtros em *Todos os Posts* (`edit.php`).**

---

## [2.8.0] — Performance de Produção e Bundle CSS Único

### Adicionado
- Consolidação de `main.css`, `responsive.css`, `enhancements.css` e `design-system.css` em **`assets/css/bundle.min.css`** com cache-busting via `filemtime()`.
- Preload automático da imagem LCP (Hero Slide 0 e capa de `single.php`), dequeue de `wp-block-library` na Home/arquivos e `content-visibility: auto` em seções abaixo da dobra e nos comentários/Disqus.
- Hardening de produção: remoção de meta tags desnecessárias no `<head>`, desativação de XML-RPC/pingbacks, cabeçalhos HTTP de segurança (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) e teste dedicado em **Ferramentas > Diagnóstico do Site**.
- Integração automática de limpeza do **WP Super Cache** ao publicar/atualizar posts ou salvar o Personalizador.

---

## [2.5.0 – 2.6.1] — Identidade Azul `#0073E6`, Hero HQ 3D e Central de Alertas

### Alterado / Adicionado
- Atualização da paleta oficial para Azul `#0073E6`, Amarelo `#FACC15` (texto `#0B0F19`), chrome `#102042` e Modo Escuro `#0D1933`, além de sincronização dinâmica de `<meta name="theme-color">` e `manifest.json`.
- **Hero Editorial com Virada de Página HQ 3D** em WebGL (`4,2s`, dock discreto, minimapa segmentado e trilho numerado 2px) e **Giro Geek** paginado em 3 faixas de 4 cards (`teoriageek_home_blocks_v5`).
- **Central de Alertas** (gaveta do sino com endpoint `GET /teoriageek/v1/alerts`, indicador de não lidas e integração opcional OneSignal/WebPushr) e **Lightbox nativo** em `single.php`.
- Filtros de ordenação em arquivos/universos (`?ordem=populares|criticas`) e busca (`?tg_cat=&ordem=recentes`), com `noindex` automático em resultados filtrados e busca.

---

## [2.2.0 – 2.3.0] — Design System Jornal Digital, Carrossel Hero e Auditoria Playwright

### Adicionado / Corrigido
- Reestruturação visual em estilo Jornal Digital Reto (`2px`, zero pílulas fora de avatares, zero Google Fonts externos).
- Deduplicação global entre blocos da Home e entre colunas de Editorias (`front-page.php` + `helpers.php`).
- Empilhamento vertical garantido em slots de anúncios/widgets (sem rótulo *"Publicidade"* para widgets comuns) e contenção de listas longas no rodapé.
- Correção do enquadramento superior do `/reels/` com a Admin Bar do WordPress (Desktop e Mobile), correção dos controles `A-`/`100%`/`A+` sobre spans legados e fallback para imagens quebradas em `.entry-content`.
- Carrossel Editorial Hero multi-slides sem CLS com swipe mobile e acessibilidade WCAG 2.1 AA.
