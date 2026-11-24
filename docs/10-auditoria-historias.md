# Auditoria Completa de Conformidade e Lacunas (Gap Analysis — CritHit!)

**Data da Auditoria:** 2026-11-24  
**Escopo Auditado:** `/apps/api` (Java 21 + Spring Boot 3.4.5) e `/apps/web` (Next.js 15 App Router + TypeScript) confrontados com [01-visao-produto.md](./01-visao-produto.md), [02-epicos-e-historias.md](./02-epicos-e-historias.md), [03-regras-de-negocio-e-fluxos.md](./03-regras-de-negocio-e-fluxos.md) e [07-design-system-tokens.md](./07-design-system-tokens.md).

---

## 1. Resumo Executivo e Evidências de Execução

| Camada / Comando | Escopo Verificado | Resultado Observado |
| :--- | :--- | :--- |
| Backend (`mvn -f apps/api/pom.xml test`) | Domínio editorial, deduplicação `pgvector >= 0.82`, adaptação LLM + fallback, validação anti-SSRF, notificações Discord/Telegram e `@WebMvcTest` | **BUILD SUCCESS** (`25` testes listados: `23/23` ativos aprovados; `2` testes `PgVectorAndFlywayIntegrationTest` ignorados por ausência de Docker ativo localmente) |
| Typecheck (`npm run typecheck`) | Contratos TypeScript estritos em `/apps/web` (`tsc --noEmit`) | **0 erros** |
| Testes Unitários (`npm test` / Vitest) | Validação Admin, confirmação 2 passos ao tirar do ar, filtros Reels, atribuição segura e tema Claro/Escuro | **5/5 arquivos, 9/9 testes aprovados** |
| Build de Produção (`npm run build`) | Rotas App Router (`/`, `/reels`, `/noticia/[slug]`, `/admin`, `/robots.txt`, `/sitemap.xml` e BFF `/api/**`) | **14/14 páginas estáticas + rotas dinâmicas compiladas** |
| E2E & Acessibilidade (`npx playwright test`) | Fluxos Home, Busca, Reels, Leitor (`/noticia/[slug]` com HTTP 404 real), Admin BFF, visual Desktop/Mobile e `@axe-core/playwright` Claro/Escuro | **28/28 testes aprovados** (`0` violações `critical`/`serious`, zero emojis Unicode, `font-size >= 11px`, headers de segurança) |

---

## 2. Matriz de Rastreabilidade por História de Usuário (`US-1.1` até `US-6.3`)

Legenda de status:
- **ATENDIDA:** implementada conforme especificação e validada por código/testes.
- **AJUSTADA NA AUDITORIA:** gap, risco de produção ou divergência de contrato identificado e corrigido nesta auditoria.
- **ATENDIDA COM RESSALVA:** requisito funcional atendido no domínio/backend ou em ambiente local, com ponto de atenção operacional/UI listado na Seção 4.

### Épico 1 — Home Editorial (`/`) com SSR/ISR

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-1.1` | Renderização SSR/ISR e SEO da Home (`/`) | **AJUSTADA NA AUDITORIA** | `apps/web/src/app/page.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/src/app/error.tsx`, `apps/web/src/app/robots.ts`, `apps/web/src/app/sitemap.ts` | Ausência de `loading.tsx` preservada; adicionado controle explícito `ENABLE_MOCK_FALLBACK` (desativado por padrão em produção) + `error.tsx` acessível para falhas de API; `robots.ts` bloqueia `/admin` e `/api/`. |
| `US-1.2` | Faixa Plantão Geek (Breaking News) | **ATENDIDA** | `apps/web/src/components/home/BreakingTicker.tsx`, `apps/web/src/app/page.tsx` | Ticker posicionado abaixo do `<SiteHeader />` sem sobrepor o Hero; pausa no hover/foco e respeita `prefers-reduced-motion` (`home.spec.ts` + `visual-ux-audit.spec.ts`). |
| `US-1.3` | Hero Principal com Sub-bullets e 3 Destaques Secundários | **ATENDIDA** | `apps/web/src/app/page.tsx`, `apps/api/src/main/java/br/com/crithit/api/service/PublicFeedService.java` | Hero único (`isMainHeadline = true`) com bullets de impacto e 3 secundárias ao lado (`home.spec.ts`). |
| `US-1.4` | Coluna Lateral do Hero: Reels em Destaque e Urgente na Redação | **ATENDIDA** | `apps/web/src/app/page.tsx`, `apps/web/src/components/editorial/EditorialCoverArt.tsx` | Card destaque 9:16 + bloco *Urgente na Redação* sem corte em Desktop e Mobile (`visual-ux-audit.spec.ts`). |
| `US-1.5` | Giro Geek (2 linhas x 4 colunas) | **ATENDIDA** | `apps/web/src/app/page.tsx`, `apps/web/src/components/editorial/EditorialCoverArt.tsx` | Grade 2x4 com miniaturas HQ exclusivas por `coverArtKey` e contraste validado (`home.spec.ts` + `audit.spec.ts`). |
| `US-1.6` | Newsletter "Loot Diário" | **ATENDIDA** | `apps/web/src/components/home/NewsletterSection.tsx` | Validação de e-mail, estado acessível de feedback e zero emojis (`home.spec.ts`). |
| `US-1.7` | Seção Colunas & Reviews | **ATENDIDA** | `apps/web/src/app/page.tsx`, `apps/web/src/components/editorial/EditorialCoverArt.tsx`, `PublicFeedService.java` | 4 avatares HQ (`avatar-byte`, `avatar-tinta`, `avatar-sakuga`, `avatar-frame`) e filtro `EditorialFormat` (`COLUMN` / `REVIEW`). |
| `US-1.8` | Carrossel Horizontal de Reels na Home | **ATENDIDA** | `apps/web/src/app/page.tsx` | Links diretos para `/reels?id=<slug>` validados no E2E. |
| `US-1.9` | 3 Blocos de Editorias | **ATENDIDA** | `apps/web/src/app/page.tsx`, `PublicFeedService.java` | Blocos por editoria com hierarquia de cores e tokens WCAG AA. |
| `US-1.10` | Ranking Mais Lidas (#1 a #5) | **ATENDIDA** | `apps/web/src/app/page.tsx`, `PublicFeedService.java` | Janela de 7 dias no backend com fallback determinístico quando `< 5` itens no período. |
| `US-1.11` | Busca Editorial e Rodapé Completo | **AJUSTADA NA AUDITORIA** | `apps/web/src/components/SiteHeader.tsx`, `apps/web/src/components/SiteFooter.tsx` | Busca funcional em Desktop e Mobile (`home.spec.ts`); placeholder `https://crithit.com.br` no rodapé substituído por link interno `<Link href="/">`; zero menções públicas a `/admin`. |

### Épico 2 — Reels 9:16 (`/reels` e `/reels?id=<slug>`)

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-2.1` | Feed Vertical Fullscreen com Scroll-Snap | **ATENDIDA** | `apps/web/src/components/reels/ReelsPlayer.tsx`, `apps/web/src/app/reels/page.tsx` | Layout desktop em 3 zonas e palco 9:16 fullscreen mobile sem barras brancas ou overflow (`visual-ux-audit.spec.ts`). |
| `US-2.2` | Deep-link `/reels?id=<slug>` e Sincronização de URL | **ATENDIDA** | `apps/web/src/components/reels/ReelsPlayer.tsx`, `apps/web/src/app/reels/page.tsx` | Foco direto no card do slug e aviso discreto quando `focusSlug` não é encontrado (`reels-filters.test.tsx`, `reels.spec.ts`). |
| `US-2.3` | Filtros por Editoria no Modo Reels | **ATENDIDA** | `apps/web/src/components/reels/ReelsPlayer.tsx` | Filtros `TODOS` + editorias com estado vazio recuperável (`reels-filters.test.tsx`, `reels.spec.ts`). |
| `US-2.4` | Curtidas, Salvos e Comentários nos Reels | **ATENDIDA** | `apps/web/src/components/reels/ReelsPlayer.tsx`, `apps/web/src/app/api/public/[...path]/route.ts`, `VisitorIdentityResolver.java` | Encaminhamento de `X-Visitor-Id`, persistência local de salvos, escape XSS e focus trap / `Escape` no drawer (`reels.spec.ts`). |
| `US-2.5` | Link Direto para Matéria Completa e Atribuição no Reel | **AJUSTADA NA AUDITORIA** | `apps/web/src/components/reels/ReelsPlayer.tsx`, `apps/web/src/components/editorial/AttributionBadge.tsx` | Adicionada busca lazy de `/api/public/articles/{slug}` no painel desktop do Reels quando `matchedSources` não vem em `PublicArticleSummary`, mantendo atribuição completa e links `target="_blank" rel="noopener noreferrer"`. |
| `US-2.6` | Navegação por Teclado e Preservação de Scroll nos Reels | **ATENDIDA** | `apps/web/src/components/reels/ReelsPlayer.tsx` | Atalhos `↑`/`↓`/`L`/`C` e preservação da posição do scroll após comentários (`reels.spec.ts`). |

### Épico 3 — Leitor de Matéria (`/noticia/[slug]`)

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-3.1` | Página de Matéria SSR/ISR e SEO Completo | **ATENDIDA** | `apps/web/src/app/noticia/[slug]/page.tsx`, `apps/web/src/app/not-found.tsx` | Confirmada ausência de `loading.tsx` na rota e na raiz; slugs inexistentes/não publicados retornam HTTP `404` real (`article.spec.ts`). |
| `US-3.2` | Atribuição Completa, Link Externo Seguro e Nota de Transparência | **ATENDIDA** | `apps/web/src/components/editorial/AttributionBadge.tsx`, `TransparencyNotice.tsx`, `apps/web/src/lib/format.ts` | Diferenciação estrita `AUTORAL` vs `CURADORIA` (com `TransparencyNotice` somente em `CURADORIA`), `getSafeHttpUrl` e `rel="noopener noreferrer"` (`attribution.test.tsx`, `article.spec.ts`). |
| `US-3.3` | Layout Editorial de Leitura Longa | **ATENDIDA** | `apps/web/src/app/noticia/[slug]/page.tsx` | Grid 12 colunas (`lg:col-span-8` leitura + pontos-chave + fontes cruzadas + comentários; `lg:col-span-4` sidebar sticky) auditado em `visual-ux-audit.spec.ts`. |
| `US-3.4` | Conexão com Modo Reels e Destaques Relacionados | **ATENDIDA** | `apps/web/src/app/noticia/[slug]/page.tsx` | CTA para `/reels?id=<slug>` e bloco *Leia Também* verificados em `article.spec.ts`. |

### Épico 4 — Pipeline RSS, Deduplicação Semântica (`pgvector`) e Adaptação IA

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-4.1` | Ingestão Periódica de Feeds RSS (Internacionais + Nacionais) | **ATENDIDA COM RESSALVA** | `RssIngestionService.java`, `AdminRssSourceController.java`, `AdminRssSourceService.java`, `V2__seed_rss_sources.sql` | Fluxo concorrente + `Semaphore` + circuit breaker validado em `RssIngestionServiceTest`; pendência de calibração com feeds reais após ativação do Docker/WSL2. |
| `US-4.2` | Deduplicação Semântica via `pgvector` (Threshold >= 0.82) | **ATENDIDA COM RESSALVA** | `ArticleRepository.java`, `RssIngestionService.java`, `PgVectorAndFlywayIntegrationTest.java` | Query filtra `status IN ('PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'DISCARDED')` em janela de 72h com `>= 0.82` e retorna `DISCARDED_CLUSTER_MATCH` em `RssIngestionServiceTest`; os 2 testes Testcontainers reais aguardam Docker ativo localmente. |
| `US-4.3` | Adaptação Editorial IA em JSON Estruturado para `PENDING_REVIEW` | **ATENDIDA** | `LlmAdaptationService.java`, `RssIngestionService.java`, `LlmAdaptationServiceTest.java` | Retry em erros transitórios (`429`), validação estrita do payload, fallback seguro (`FALLBACK_RAW`) e nascimento obrigatório em `PENDING_REVIEW` sem auto-publicação. |

### Épico 5 — Painel Admin Protegido (`/admin`, JWT)

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-5.1` | Autenticação JWT e Proteção da Rota `/admin` | **AJUSTADA NA AUDITORIA** | `apps/web/src/app/api/bff/auth/*`, `apps/web/src/app/api/bff/admin/[...path]/route.ts`, `apps/web/src/app/api/revalidate/route.ts`, `SecurityConfig.java` | Login BFF via cookies `HttpOnly; SameSite=Lax`, zero JWT em `localStorage` e painel oculto da navegação pública (`admin.spec.ts`). Ajustado `api/revalidate/route.ts` para rejeitar ausência de `REVALIDATE_SECRET` em produção com HTTP `503`. |
| `US-5.2` | Aba Fila de Revisão (`PENDING_REVIEW`): Workbench Split-Screen | **AJUSTADA NA AUDITORIA** | `apps/web/src/components/admin/AdminDashboard.tsx`, `AdminArticleForm.tsx`, `apps/web/src/lib/media-storage.ts`, `upload/route.ts`, `media/[filename]/route.ts` | Split-screen com preview ao vivo de capa e upload local via interface `MediaStorageAdapter` (facilitando troca para S3/R2). `AdminDashboard.tsx` passou a exibir `fieldErrors[0].message` nos erros de API. |
| `US-5.3` | Ações da Fila de Revisão: Aprovar e Publicar, Agendar e Descartar | **ATENDIDA COM RESSALVA** | `AdminArticleService.java`, `AdminArticleController.java`, `AdminArticleForm.tsx`, `AdminDashboard.tsx` | Aprovação exige `authorName`, `contentType`, `sourceName` e URLs `http(s)://`; descarte usa confirmação em 2 passos (`admin.spec.ts`, `AdminArticleServiceTest`). Backend também já suporta criação manual (`POST`) e cancelamento de agendamento (`SCHEDULED -> PENDING_REVIEW`), ainda não expostos em aba própria na UI. |
| `US-5.4` | Aba Matérias Publicadas (`PUBLISHED` / `UNPUBLISHED`): Edição, Manchete Principal e Tirar do Ar | **AJUSTADA NA AUDITORIA** | `AdminArticleController.java`, `AdminRssSourceController.java`, `AdminDashboard.tsx`, `PublishedArticlesTab.tsx`, `AdminArticleService.java`, `ControllersWebMvcTest.java` | Corrigidas divergências `PATCH` vs `POST` em `/{id}/main-headline` e `PUT` vs `PATCH` em `rss-sources/{id}`. `unpublishArticle` preserva métricas/auditoria e promove fallback de manchete principal atomica/transacionalmente (`AdminArticleServiceTest`, `admin-unpublish.test.tsx`). |

### Épico 6 — Tema Claro/Escuro Persistente, Direção de Arte e Acessibilidade WCAG AA

| História | Título | Status | Arquivos Principais | Evidência / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `US-6.1` | Tema Claro/Escuro Nativo e Persistente | **ATENDIDA** | `apps/web/src/components/ThemeProvider.tsx`, `apps/web/src/app/globals.css` | Persistência via `localStorage` + classe `.dark`, validada após `page.reload()` (`theme-toggle.test.tsx`, `home.spec.ts`). |
| `US-6.2` | Conformidade com Direção de Arte (Zero Emojis e Tipografia) | **ATENDIDA** | `apps/web/src/components/editorial/EditorialCoverArt.tsx`, `apps/web/src/app/globals.css`, `apps/web/tests/e2e/audit.spec.ts` | Zero emojis Unicode, `lucide-react` exclusivo, ilustrações SVG com `useId()` único e piso `>= 11px` validado no DOM real (`audit.spec.ts`). |
| `US-6.3` | Acessibilidade WCAG AA, Teclado e Redução de Movimento | **ATENDIDA** | `apps/web/src/app/layout.tsx`, `apps/web/tests/e2e/audit.spec.ts` | `0` violações `critical`/`serious` no `@axe-core/playwright` em Claro e Escuro nas 4 rotas (`/`, `/reels`, `/noticia/[slug]`, `/admin`), viewport sem `user-scalable=no`. |

---

## 3. Bugs e Divergências Corrigidas nesta Auditoria

1. **Paridade HTTP em `main-headline` (`PATCH` vs `POST`):**
   - `AdminDashboard.tsx` (`handlePromoteMainHeadline`) passou a enviar `PATCH` para alinhar ao `@PatchMapping` REST, enquanto `AdminArticleController.java` passou a aceitar `{RequestMethod.PATCH, RequestMethod.POST}` para retrocompatibilidade. Coberto em `ControllersWebMvcTest.java` e `tests/e2e/helpers/mock-api.ts`.
2. **Paridade HTTP em `rss-sources/{id}` (`PUT` vs `PATCH`):**
   - `AdminDashboard.tsx` (`handleToggleRss`) passou a enviar `PUT`, enquanto `AdminRssSourceController.java` passou a aceitar `{RequestMethod.PUT, RequestMethod.PATCH}`. Coberto em `ControllersWebMvcTest.java` e `tests/e2e/helpers/mock-api.ts`.
3. **Fallback de `mock-data.ts` controlado por ambiente + Error Boundary:**
   - `apps/web/src/lib/api-client.ts` recebeu `isMockFallbackEnabled()`, desativando fallback fictício por padrão quando `NODE_ENV === 'production'` (a menos que `ENABLE_MOCK_FALLBACK=true` ou `1`). Adicionado `apps/web/src/app/error.tsx` para falhas recuperáveis de API e injeção explícita de `ENABLE_MOCK_FALLBACK: 'true'` em `apps/web/playwright.config.ts`. Variável documentada em `infra/docker-compose.yml` e `infra/.env.example`.
4. **Proteção de `REVALIDATE_SECRET` em produção:**
   - `apps/web/src/app/api/revalidate/route.ts` desabilitou a chave fallback de desenvolvimento em `NODE_ENV === 'production'`, retornando HTTP `503` se `REVALIDATE_SECRET` não estiver definido.
5. **Abstração de Storage de Mídia para `/admin`:**
   - Criado `apps/web/src/lib/media-storage.ts` com `MediaStorageAdapter`, `LocalTempMediaStorage` e `resolveMediaStorage()` via `MEDIA_STORAGE_DRIVER` (`local` / `object-storage`), refatorando `/api/bff/media/upload` e `/api/media/[filename]`.
6. **Exibição de `fieldErrors` no `/admin`:**
   - `AdminDashboard.tsx` (`extractErrorMessage()`) passou a extrair `fieldErrors[0].message` dos payloads 400/422 da API Spring Boot ao salvar, aprovar, agendar, promover manchete ou atualizar fonte RSS.
7. **Fontes cruzadas no Painel Desktop do `/reels`:**
   - `ReelsPlayer.tsx` passou a enriquecer `matchedSources` sob demanda via `/api/public/articles/{slug}` quando `PublicArticleSummary` não traz a lista completa.
8. **Remoção de link placeholder externo no rodapé:**
   - `SiteFooter.tsx` substituiu `https://crithit.com.br` por link interno `<Link href="/">`.

---

## 4. Lista Priorizada de Refinamentos Pós-Docker / Produção

1. **[P0 — Infra & Banco] Ativar Docker/WSL2 no host e validar `PgVectorAndFlywayIntegrationTest`:** subir a stack completa (`infra/docker-compose.yml`) e executar os 2 testes Testcontainers (`V1`, `V2` e busca vetorial `pgvector` real), além do fluxo completo RSS -> LLM -> `/admin` -> ISR.
2. **[P0 — Segurança & Segredos] Injetar segredos reais no ambiente de deploy:** preencher `JWT_SECRET`, `REVALIDATE_SECRET`, `VISITOR_HASH_SALT`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `ADMIN_SEED_PASSWORD` e `LLM_API_KEY` (com `ENABLE_MOCK_FALLBACK=false` e `COOKIE_SECURE=true`).
3. **[P1 — Mídia em Produção] Implementar driver `object-storage` em `MediaStorageAdapter`:** conectar S3 / Cloudflare R2 / GCS em `apps/web/src/lib/media-storage.ts` para suportar múltiplas réplicas e reinícios de container sem perda de capas enviadas pelo `/admin`.
4. **[P1 — UX Editorial `/admin`] Expor aba de Agendadas (`SCHEDULED`) e criação manual na UI:** o backend já possui `POST /api/v1/admin/articles` e transição `SCHEDULED -> PENDING_REVIEW` (`schedule` / `cancel`), faltando botões dedicados no `AdminDashboard.tsx`.
5. **[P2 — Sessão BFF em Upload] Auto-refresh no `/api/bff/media/upload`:** replicar o retry com `refreshToken` usado em `/api/bff/admin/[...path]` caso o editor tente subir imagem com `accessToken` expirado após 15 min de ociosidade.
6. **[P2 — Feeds Reais & Observabilidade] Calibrar `RssFeedFetcher` e latência de LLM:** testar `V2__seed_rss_sources.sql` contra feeds reais em rede de staging para ajustar timeouts, extração de `og:image` e metas de latência do prompt editorial.
