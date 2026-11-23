# CritHit! — Status Atual do Projeto e Pendências

**Última atualização:** 2026-11-23  
**Repositório oficial:** `https://github.com/kauankelvin7/crithit.git`

---

## 1. Onde Paramos (Checkpoint Atual)

Todas as **5 fases planejadas** do monorepo e a **evolução completa de UX/UI Desktop & Mobile** foram implementadas e validadas localmente:

### Documentação (`/docs`)
- [01-visao-produto.md](./01-visao-produto.md) até [04-roadmap-fases.md](./04-roadmap-fases.md): visão de produto, épicos E1–E6, regras de negócio e roadmap.
- [05-arquitetura-e-adrs.md](./05-arquitetura-e-adrs.md) e [06-modelo-de-dados-e-api.md](./06-modelo-de-dados-e-api.md): diagramas C4, ADRs, DER, DDL PostgreSQL 16 + `pgvector` e contrato OpenAPI 3.1.
- [07-design-system-tokens.md](./07-design-system-tokens.md): tokens 60-30-10 Claro (`#F6F4EE`/`#FFFFFF`) e Escuro (`#0D0F14`/`#161922`), contraste WCAG AA (`>= 4.5:1`), piso tipográfico `>= 11px` e política zero emojis (`lucide-react`).
- [08-qa-report.md](./08-qa-report.md): relatório de QA e checklist de go-live.
- `docs/qa-screenshots/`: evidências visuais capturadas via Playwright (`home-desktop.png`, `home-mobile.png`, `reels-desktop.png`, `reels-mobile.png`, `article-desktop.png`).

### Backend & Worker Editorial (`/apps/api`)
- **Stack:** Java 21 (Virtual Threads), Spring Boot 3.4.5, Spring Security (JWT + blacklist Redis), Flyway (`V1__init_schema.sql`, `V2__seed_rss_sources.sql`), PostgreSQL 16 + `pgvector`, `Rome` (RSS/Atom) e `JSoup` (sanitização HTML e `og:image`).
- **Pipeline:** coleta RSS concorrente com `Semaphore` + circuit breaker por fonte + deduplicação semântica por cosseno (`>= 0.82`) + adaptação via LLM compatível com OpenAI e fallback seguro (`FALLBACK_RAW`), sempre nascendo em `PENDING_REVIEW`.
- **Notificações assíncronas:** `EditorialNotificationService` (HttpClient Java 21 em Virtual Threads) para Discord e Telegram com tolerância a falhas/timeout.
- **Testes:** `23/23` testes unitários/WebMvc aprovados (`2` testes Testcontainers `PgVectorAndFlywayIntegrationTest` aguardando Docker ativo no host local; rodam automaticamente no CI).

### Frontend Web, Reels, Leitor & Admin BFF (`/apps/web`)
- **Home (`/`):** `<SiteHeader />` sticky no topo (`y === 0`), `<BreakingTicker />` (*Plantão Geek*) deslizando continuamente para a direita com pausa no hover/foco (sem scrollbar), Hero + 3 destaques secundários, Reels em Destaque, Urgente na Redação, Giro Geek 2x4, Newsletter Loot Diário, Colunas & Reviews com **4 avatares vetoriais HQ** (`avatar-byte`, `avatar-tinta`, `avatar-sakuga`, `avatar-frame`), Carrossel de Reels, Blocos de Editorias e Ranking `#1–#5`.
- **CritHit Reels (`/reels`):**
  - Layout Desktop em **3 zonas estilo TikTok Web**: sidebar esquerda (`Para Você`, `Em Alta`, `Salvos`, Editorias com contagem e atalhos `↑`/`↓`/`L`/`C`), palco central `9:16` com Ambient Glow reativo, pílula `01 / 12` e coluna de ações acoplada do lado de fora, e painel direito (`xl+`) com **Fontes Cruzadas desta Pauta** e **Comentários da Comunidade** com formulário inline.
  - Mobile sem barra de busca no header (`pathname === '/reels'`), 1 card fullscreen por vez, double-tap/double-click com explosão vetorial `CRIT HIT!`.
- **Leitor (`/noticia/[slug]`):** redesenhado no padrão **CNN Brasil + The Verge / IGN** com Breadcrumb, cabeçalho amplo com avatar e barra de engajamento, grid assimétrico 12 colunas (`lg:col-span-8` leitura + Pontos-Chave + `TransparencyNotice` + Fontes & Transparência + comentários integrados; `lg:col-span-4` sidebar sticky com *Assista em Reels 9:16*, *Mais Lidas Agora #1–#5* e *Leia Também*).
- **Painel Admin (`/admin`) 100% isolado:** nenhum link/menção pública em header ou footer, bloqueado em `robots.ts`, login via BFF `HttpOnly` sem JWT em `localStorage`, split-screen, pré-visualização ao vivo de capa + upload local (`/api/bff/media/upload` -> `/api/media/[filename]`).
- **Qualidade validada em `/apps/web`:**
  - `npm run typecheck`: `0` erros
  - `npm test` (Vitest): `5/5` arquivos, `9/9` testes aprovados
  - `npm run build`: `14/14` rotas compiladas (`robots.txt` e `sitemap.xml` inclusos)
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
   - Hoje o upload local do `/admin` grava imagens em diretório temporário do sistema (`os.tmpdir()/crithit-uploads`).
   - Em produção (containers efêmeros ou múltiplas réplicas), migrar o upload para Object Storage (S3 / Cloudflare R2 / GCS) ou endpoint dedicado no `/apps/api` com volume persistente.

3. **Segredos, LLM e Alertas em Produção:**
   - Configurar em cofre de segredos do ambiente de deploy: `JWT_SECRET` (mínimo 256 bits), `REVALIDATE_SECRET`, `VISITOR_HASH_SALT`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD` e `ADMIN_SEED_PASSWORD`.
   - Definir `LLM_API_KEY` / `LLM_PROVIDER_BASE_URL` reais para adaptação editorial automática (em desenvolvimento sem chave, o fallback determinístico assume com segurança).
   - Opcionalmente preencher `DISCORD_WEBHOOK_URL` e/ou `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` para receber alertas de novas pautas `PENDING_REVIEW`.

4. **Domínio, HTTPS e Proteção Adicional do `/admin` em Produção:**
   - Ajustar `NEXT_PUBLIC_SITE_URL`, `APP_WEB_PUBLIC_URL`, `CORS_ALLOWED_ORIGINS` e `COOKIE_SECURE=true`.
   - Configurar subdomínio dedicado ou regra de acesso (ex.: Cloudflare Access / IP allowlist) para a rota `/admin`.

5. **Validação do Pipeline CI no GitHub:**
   - Acompanhar a primeira execução de `.github/workflows/ci.yml` (`api-test` + `web-test-and-e2e`) no GitHub Actions após o push.
