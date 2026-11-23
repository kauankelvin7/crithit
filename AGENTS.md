# AGENTS.md — Guia de Engenharia para Agentes e Contribuidores (CritHit!)

Este arquivo define a arquitetura, os comandos de validação, as regras inegociáveis e o ponto atual do projeto **CritHit!** para continuidade segura por qualquer agente de código ou desenvolvedor.

---

## 1. Visão Geral do Monorepo

- **`/docs`**: Especificações de produto, arquitetura, banco/OpenAPI, tokens de design system, relatório de QA e status atual (`01` a `09` + `reference-prototype.html` + `qa-screenshots/`).
- **`/apps/api`**: Backend REST & Worker Editorial em **Java 21 + Spring Boot 3.4.5 + Maven + Flyway + PostgreSQL 16 (`pgvector`) + Redis 7 + Rome + JSoup**.
- **`/apps/web`**: Portal Web, Reels 9:16, Leitor e Painel Admin BFF em **Next.js 15 (App Router) + TypeScript estrito + Tailwind CSS + `lucide-react`**.
- **`/infra`**: `docker-compose.yml`, `.env.example` (sem segredos reais) e scripts SQL iniciais (`init-db/01-init-pgvector.sql`).
- **`.github/workflows/ci.yml`**: Pipeline CI com jobs `api-test` (JDK 21 + Docker/Testcontainers) e `web-test-and-e2e` (Node 20 + `typecheck` + Vitest + `next build` + Playwright + `@axe-core/playwright`).

---

## 2. Onde Paramos e O Que Falta

Consulte sempre [docs/09-status-e-pendencias.md](./docs/09-status-e-pendencias.md) antes de iniciar uma nova tarefa:
- **Concluído:** Fases 1–5 completas + evolução UX/UI desktop/mobile (`/` Home com ticker deslizante e avatares HQ, `/reels` em 3 zonas estilo TikTok Web, `/noticia/[slug]` estilo CNN Brasil/The Verge/IGN, `/admin` isolado com preview/upload de capa, notificações Discord/Telegram, SEO `robots.ts` + `sitemap.ts`).
- **Pendente:** subida da stack completa via Docker Compose após habilitar Docker/WSL2 no host Windows local, execução local dos 2 testes `PgVectorAndFlywayIntegrationTest` com Docker ativo, migração do upload de mídia temporário (`os.tmpdir()`) para Object Storage em produção e injeção de segredos reais no ambiente de deploy.

---

## 3. Regras Inegociáveis do Projeto

### Regras Editoriais & de Negócio
1. **Human-in-the-Loop obrigatório:** toda matéria ingerida via RSS ou adaptada por IA nasce em `PENDING_REVIEW`. Nunca publicar automaticamente sem aprovação humana no `/admin`.
2. **Atribuição jornalística estrita:** toda matéria publicada exige `authorName`, `contentType` (`AUTORAL` ou `CURADORIA`), `sourceName` e `sourceUrl` com protocolo estrito `http://` ou `https://` (nunca `javascript:`, `data:`, etc.).
3. **Deduplicação semântica:** agrupamento por `pgvector` com similaridade cosseno `>= 0.82` em janela de 72h; clusters `DISCARDED` devem ser ignorados.
4. **Unicidade de Manchete Principal & Preservação de Histórico:** apenas 1 artigo pode ter `isMainHeadline = true`; retirar do ar usa `UNPUBLISHED` (sem exclusão física).
5. **Isolamento do Painel Admin:** zero links, botões ou menções a `/admin` ou `Redação` no header/footer públicos; `robots.ts` bloqueia `/admin` e `/api/`.

### Segurança
- **Zero tokens JWT em `localStorage`:** autenticação do `/admin` via BFF Next.js (`/api/bff/auth/*`) usando cookies `HttpOnly; SameSite=Lax`.
- **Nunca commitar segredos reais:** `.env`, `.env.local`, `infra/.env` e chaves de API devem permanecer fora do Git.
- **Anti-SSRF & XSS:** validar URLs no backend (`UrlSecurityValidator`) e no frontend (`getSafeHttpUrl`), sanitizar HTML com `JSoup` e manter headers `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Content-Security-Policy` em `apps/web/next.config.ts`.

### Design System, Acessibilidade & UX
- **Zero emojis Unicode** em qualquer texto, botão, badge ou log visível da UI — usar exclusivamente ícones vetoriais `lucide-react` (`aria-hidden="true"` ou rótulo acessível).
- **WCAG 2.1 AA:** 0 violações `critical`/`serious` no `@axe-core/playwright` tanto em Modo Claro (`#F6F4EE`/`#FFFFFF`) quanto em Modo Escuro (`#0D0F14`/`#161922`).
- **Tipografia & Viewport:** piso mínimo `>= 11px` em todo texto visível; proibido `user-scalable=no` ou `maximum-scale=1`; respeitar `@media (prefers-reduced-motion: reduce)`.
- **Nota Next.js App Router:** não adicionar `loading.tsx` em `apps/web/src/app/noticia/[slug]/` nem na raiz `src/app/`, pois o `<Suspense>` faz o Next.js responder `HTTP 200` antes de `notFound()` emitir `HTTP 404`.

---

## 4. Comandos de Desenvolvimento e Validação

### Frontend (`/apps/web`)
```powershell
cd apps/web
npm install
npm run typecheck        # tsc --noEmit (0 erros)
npm test                 # Vitest + React Testing Library (9/9)
npm run build            # Build de produção Next.js 15
npx playwright test      # 28 testes E2E + visual + @axe-core/playwright (Claro/Escuro)
npx next start -p 3000   # Iniciar servidor de produção local na porta 3000
```

### Backend (`/apps/api`)
```powershell
# Testes unitários, Mockito, MockMvc e Testcontainers (requer Docker para pgvector)
mvn -f apps/api/pom.xml test

# Executar API localmente
mvn -f apps/api/pom.xml spring-boot:run
```

### Infraestrutura Docker (`/infra`)
```powershell
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d
docker compose -f infra/docker-compose.yml --env-file infra/.env --profile app up --build -d
```

---

## 5. Convenções para Agentes

- Leia `/docs/03-regras-de-negocio-e-fluxos.md`, `/docs/05-arquitetura-e-adrs.md`, `/docs/06-modelo-de-dados-e-api.md` e `/docs/07-design-system-tokens.md` antes de alterar contratos de API, banco ou tokens visuais.
- Ao alterar telas públicas ou o player `/reels`, valide obrigatoriamente com `npm run typecheck`, `npm test`, `npm run build` e `npx playwright test` (incluindo `tests/e2e/audit.spec.ts` e `tests/e2e/visual-ux-audit.spec.ts`).
- Ao finalizar qualquer marco importante, atualize [docs/09-status-e-pendencias.md](./docs/09-status-e-pendencias.md) e [docs/08-qa-report.md](./docs/08-qa-report.md).
