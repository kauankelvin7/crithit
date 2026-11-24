# CritHit! — Status Atual do Projeto e Pendências

**Última atualização:** 2026-11-24  
**Repositório oficial:** `https://github.com/kauankelvin7/crithit.git`

---

## 1. Onde Paramos (Checkpoint Atual)

Todas as **5 fases planejadas** do monorepo, a **evolução completa de UX/UI Desktop & Mobile** e a **Auditoria Completa de Conformidade (`US-1.1` até `US-6.3`)** foram implementadas e validadas localmente:

### Documentação (`/docs`)
- [01-visao-produto.md](./01-visao-produto.md) até [04-roadmap-fases.md](./04-roadmap-fases.md): visão de produto, épicos E1–E6, regras de negócio e roadmap.
- [05-arquitetura-e-adrs.md](./05-arquitetura-e-adrs.md) e [06-modelo-de-dados-e-api.md](./06-modelo-de-dados-e-api.md): diagramas C4, ADRs, DER, DDL PostgreSQL 16 + `pgvector` e contrato OpenAPI 3.1.
- [07-design-system-tokens.md](./07-design-system-tokens.md): tokens 60-30-10 Claro (`#F6F4EE`/`#FFFFFF`) e Escuro (`#0D0F14`/`#161922`), contraste WCAG AA (`>= 4.5:1`), piso tipográfico `>= 11px` e política zero emojis (`lucide-react`).
- [08-qa-report.md](./08-qa-report.md): relatório de QA e checklist de go-live.
- [10-auditoria-historias.md](./10-auditoria-historias.md): matriz de rastreabilidade (`US-1.1`–`US-6.3`), divergências de contrato corrigidas e refinamentos pós-Docker priorizados.
- `docs/qa-screenshots/`: evidências visuais capturadas via Playwright (`home-desktop.png`, `home-mobile.png`, `reels-desktop.png`, `reels-mobile.png`, `article-desktop.png`).

### Backend & Worker Editorial (`/apps/api`)
- **Stack:** Java 21 (Virtual Threads), Spring Boot 3.4.5, Spring Security (JWT + blacklist Redis), Flyway (`V1__init_schema.sql`, `V2__seed_rss_sources.sql`), PostgreSQL 16 + `pgvector`, `Rome` (RSS/Atom) e `JSoup` (sanitização HTML e `og:image`).
- **Pipeline:** coleta RSS concorrente com `Semaphore` + circuit breaker por fonte + deduplicação semântica por cosseno (`>= 0.82` incluindo exclusão de clusters `DISCARDED`) + adaptação via LLM compatível com OpenAI e fallback seguro (`FALLBACK_RAW`), sempre nascendo em `PENDING_REVIEW`.
- **Notificações assíncronas:** `EditorialNotificationService` (HttpClient Java 21 em Virtual Threads) para Discord e Telegram com tolerância a falhas/timeout.
- **Paridade de contratos Admin:** `AdminArticleController` aceita `PATCH` e `POST` em `/{id}/main-headline` e `AdminRssSourceController` aceita `PUT` e `PATCH` em `/{id}`.
- **Testes & Cobertura JaCoCo:** `41/41` testes unitários/WebMvc ativos aprovados em 13 classes (`Tests run: 43, Failures: 0, Errors: 0, Skipped: 2`, sendo os 2 testes `PgVectorAndFlywayIntegrationTest` aguardando Docker ativo no host local; rodam automaticamente no CI). Relatório JaCoCo (`jacoco-maven-plugin 0.8.12`) configurado em `apps/api/pom.xml` com **53,8% de instruções** (`6.477/12.031`), **52,5% de linhas** (`1.376/2.619`), **54,4% de métodos** (`319/586`) e **71,7% de classes** (`86/120`, incluindo **100%** das classes do pacote `br.com.crithit.api.security`).

### Frontend Web, Reels, Leitor & Admin BFF (`/apps/web`)
- **Home (`/`):** `<SiteHeader />` sticky no topo (`y === 0`), `<BreakingTicker />` (*Plantão Geek*) deslizando continuamente para a direita com pausa no hover/foco (sem scrollbar), Hero + 3 destaques secundários, Reels em Destaque, Urgente na Redação, Giro Geek 2x4, Newsletter Loot Diário, Colunas & Reviews com **4 avatares vetoriais HQ** (`avatar-byte`, `avatar-tinta`, `avatar-sakuga`, `avatar-frame`), Carrossel de Reels, Blocos de Editorias e Ranking `#1–#5`.
- **Segurança & Confiabilidade SSR/ISR:** `ENABLE_MOCK_FALLBACK` desativado por padrão em produção (com `src/app/error.tsx` acessível para falhas de API), `REVALIDATE_SECRET` obrigatório em produção (HTTP `503` quando ausente), link placeholder de rodapé removido e `loading.tsx` ausente para garantir HTTP `404` real em `/noticia/[slug]`.
- **CritHit Reels (`/reels`):**
  - Layout Desktop em **3 zonas estilo TikTok Web**: sidebar esquerda (`Para Você`, `Em Alta`, `Salvos`, Editorias com contagem e atalhos `↑`/`↓`/`L`/`C`), palco central `9:16` com Ambient Glow reativo, pílula `01 / 12` e coluna de ações acoplada do lado de fora, e painel direito (`xl+`) com **Fontes Cruzadas desta Pauta** (com busca sob demanda via `/api/public/articles/{slug}`) e **Comentários da Comunidade** com formulário inline.
  - Mobile sem barra de busca no header (`pathname === '/reels'`), 1 card fullscreen por vez, double-tap/double-click com explosão vetorial `CRIT HIT!`.
- **Leitor (`/noticia/[slug]`):** redesenhado no padrão **CNN Brasil + The Verge / IGN** com Breadcrumb, cabeçalho amplo com avatar e barra de engajamento, grid assimétrico 12 colunas (`lg:col-span-8` leitura + Pontos-Chave + `TransparencyNotice` + Fontes & Transparência + comentários integrados; `lg:col-span-4` sidebar sticky com *Assista em Reels 9:16*, *Mais Lidas Agora #1–#5* e *Leia Também*).
- **Painel Admin (`/admin`) 100% isolado:** nenhum link/menção pública em header ou footer, bloqueado em `robots.ts`, login via BFF `HttpOnly` sem JWT em `localStorage`, split-screen, pré-visualização ao vivo de capa + upload abstraído por `MediaStorageAdapter` (`src/lib/media-storage.ts`, driver `local` com suporte futuro a `object-storage`) e exibição de `fieldErrors` da API nos banners de feedback.
- **Qualidade validada em `/apps/web`:**
  - `npm run typecheck`: `0` erros
  - `npm test` (Vitest): `9/9` arquivos, `19/19` testes aprovados (incluindo `url.test.ts`, `comments-drawer.test.tsx`, `bff-auth.test.ts` e `api-client-fallback.test.ts`)
  - `npm run build`: `14/14` páginas estáticas e rotas API/BFF compiladas (`robots.txt` e `sitemap.xml` inclusos)
  - `npx playwright test`: `28/28` testes aprovados (`0` violações `critical`/`serious` no `@axe-core/playwright` em Claro e Escuro, zero emojis Unicode, `font-size >= 11px`)

---

## 2. O Que Ainda Falta (Pendências para Integração Completa e Produção)

1. **Subir Stack Completa no Host Windows com Docker + WSL2:**
   - O PC local ainda não possui Docker Desktop / kernel WSL2 carregado (`wsl --update` em PowerShell Administrador + instalação do `Docker.DockerDesktop` + reinicialização do Windows).
   - Após instalar o Docker, executar:
     ```powershell
     docker compose -f infra/docker-compose.yml --env-file infra/.env --profile app up --build -d
     ```
   - Validar o fluxo real fim-a-fim sem mocks: coleta RSS -> `pgvector` -> LLM -> `/admin` (`PENDING_REVIEW` -> `PUBLISHED`) -> revalidação ISR -> portal público.
   - Executar os 2 testes de integração `PgVectorAndFlywayIntegrationTest` localmente com `mvn -f apps/api/pom.xml test`.

2. **Persistência de Mídia em Produção (`/api/bff/media/upload`):**
   - Hoje o upload local do `/admin` usa `LocalTempMediaStorage` (`os.tmpdir()/crithit-uploads`) por trás da interface `MediaStorageAdapter` (`apps/web/src/lib/media-storage.ts`, via `MEDIA_STORAGE_DRIVER=local`).
   - Em produção (containers efêmeros ou múltiplas réplicas), implementar o driver `object-storage` (S3 / Cloudflare R2 / GCS) no `resolveMediaStorage()` ou endpoint dedicado no `/apps/api` com volume persistente.

3. **Segredos, LLM e Alertas em Produção:**
   - Configurar em cofre de segredos do ambiente de deploy: `JWT_SECRET` (mínimo 256 bits), `REVALIDATE_SECRET`, `VISITOR_HASH_SALT`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD` e `ADMIN_SEED_PASSWORD`.
   - Definir `LLM_API_KEY` / `LLM_PROVIDER_BASE_URL` reais para adaptação editorial automática (em desenvolvimento sem chave, o fallback determinístico assume com segurança).
   - Opcionalmente preencher `DISCORD_WEBHOOK_URL` e/ou `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` para receber alertas de novas pautas `PENDING_REVIEW`.

4. **Domínio, HTTPS e Proteção Adicional do `/admin` em Produção:**
   - Ajustar `NEXT_PUBLIC_SITE_URL`, `APP_WEB_PUBLIC_URL`, `CORS_ALLOWED_ORIGINS` e `COOKIE_SECURE=true`.
   - Configurar subdomínio dedicado ou regra de acesso (ex.: Cloudflare Access / IP allowlist) para a rota `/admin`.

5. **Validação do Pipeline CI no GitHub:**
   - Acompanhar a primeira execução de `.github/workflows/ci.yml` (`api-test` + `web-test-and-e2e`) no GitHub Actions após o push.

---

## 3. Evoluções Recentes Concluídas (Commits `7346489` e `fb88054`)

- **Reels 2.0, Refinamento Editorial & Admin Isolado (`7346489`):**
  - Remoção total de `9:16` e jargões técnicos da UI pública e do `/admin`.
  - Canvas *full-bleed* no `/reels` com Micro-Stories em 3 lâminas, Drawer escuro em `< 1280px`, foco inline em `>= 1280px` e seletor `Para Você | Em Alta | Salvos` no mobile.
  - Painel `/admin` 100% isolado (cabeçalho próprio `CRITHIT! REDAÇÃO`, `+ Nova Matéria Autoral`, `Preview Reels`, filtro `Agendadas` + `cancel-schedule` no backend).
  - Compatibilidade Vercel em `apps/web/next.config.ts` e seção de preview rápido no `README.md`.
  - Validado com `23/23` testes Vitest e `30/30` testes Playwright (`0` violações WCAG 2.1 AA).
- **Agente Jornalista OpenBot + Gemini 3.5 Flash (`fb88054`):**
  - Workspace `/agents/journalist/` (`AGENT.md`, `openbot.config.json`, `README.md`), `scripts/editorial-autopilot.mjs` (`curate`, `author`, `live`) e suíte `scripts/editorial-autopilot.test.mjs` (`5/5` aprovados) + teste real `HTTP 200` com `gemini-3.5-flash`.

---

## 4. Nova Frente em Andamento — Tema WordPress Nativo `teoriageek` (`/wordpress-theme/teoriageek/`)

Checkpoint detalhado em [wordpress-theme/teoriageek/PROGRESSO.md](../wordpress-theme/teoriageek/PROGRESSO.md) e levantamento completo em [wordpress-theme/teoriageek/MIGRATION_AUDIT.md](../wordpress-theme/teoriageek/MIGRATION_AUDIT.md).

### O que já foi concluído (sem alterar `/apps/web` ou `/apps/api`):
1. **Reconhecimento somente leitura do `teoriageek.com.br` (`MIGRATION_AUDIT.md`):**
   - 25 categorias reais mapeadas (destaque para slugs reais `animes-mangas`, `livros-hqs`, `especial-teoria-geek`, `destaque`, `noticias`, `criticas`, `reviews`, `games`, `filmes`, `series`).
   - Paleta real (`#116EBF`, `#E29C04`/`#FFD600`, `#BE123C`), logos (`300x190` e `120x120`) e links das 6 redes sociais.
   - Mapeamento do HTML legado de posts antigos (`.ficha`, `.rev-series`, `.rev-games`, `.capa`, `.col`, `.tit`, `.sinop`, `span[style*="#999"]`, `.div-selo`, `.selo`, `.youtube-embed`, `p.v1MsoNormal`).
2. **Base PHP & Painel Sem Código criados em `/wordpress-theme/teoriageek/`:**
   - `style.css`, `theme.json`, `functions.php` (anti-FOUC Claro/Escuro no `<head>`, menus, 3 áreas de widgets opcionais, enqueue).
   - `inc/helpers.php` (paleta das 25 categorias, cálculo de contraste WCAG, extrator automático de 3 pontos-chave para posts antigos, ícones SVG inline sem emojis, arte Pop-Art fallback, views/likes).
   - `inc/customizer.php` (`Aparência > Personalizar`: logos, cores em 1 clique, mapeamento dinâmico de categorias da capa, 6 redes sociais e texto do selo Reels).
   - `inc/meta-boxes.php` (Meta Box nativa **"Ficha Editorial"** no editor de posts sem ACF: Manchete Principal, Plantão, Formato, Nota `0–10`, 3 Pontos-Chave e Fonte externa opcional).
   - `inc/template-tags.php` (badges, breadcrumb, menu fallback, paginação, logo e ranking Mais Lidas).

### O que falta fazer na retomada:
1. **Backend Reels & REST API (`inc/reels-api.php`):** rewrite `/reels/`, `template_include` para `page-reels.php` e namespace `teoriageek/v1` (`GET /reels`, `POST /posts/{id}/like`, `POST /posts/{id}/view`, `POST /posts/{id}/comment`).
2. **Templates Públicos & Template Parts:**
   - `template-parts/{cover-media,breaking-ticker,card-article,card-compact}.php`
   - `header.php`, `footer.php`, `front-page.php` (1ª dobra sem repetição via `$used_post_ids`), `single.php`, `page.php`, `archive.php`, `search.php`, `index.php`, `404.php` e `comments.php`.
3. **Reels 2.0 Nativo:** `page-reels.php` + Vanilla JS (`assets/js/main.js` e `assets/js/reels.js`) com 3 zonas desktop, 3 lâminas Micro-Stories, atalhos `↑↓←→LC`, double-tap Pop-Art e mobile tela cheia + drawer escuro.
4. **Build Tailwind CSS & Empacotamento `.zip`:** `src/css/input.css` (incluindo estilização do HTML legado `.ficha`/`.div-selo`/`.youtube-embed`), `tailwind.config.cjs`, `package.json`, compilação de `assets/css/main.css` e `scripts/package-theme.mjs` gerando `/dist/teoriageek-theme.zip` (`teoriageek/style.css` na raiz).
5. **Auditoria final:** validação sintática PHP/JS/CSS, integridade do `.zip` e entrega do checklist de 5 passos para instalação no LocalWP.
