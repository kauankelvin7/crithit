# CritHit! — Portal Editorial de Jornalismo Geek

Portal independente de jornalismo geek com curadoria automatizada (RSS internacional e nacional), deduplicação semântica via PostgreSQL 16 + `pgvector` (`cosine_similarity >= 0.82`), adaptação editorial assistida por IA, notificações em tempo real (Discord & Telegram) e fluxo obrigatório de revisão humana (*Human-in-the-Loop*) antes da publicação.

---

## 1. Estrutura do Monorepo

```text
CritHit/
├── .github/workflows/ci.yml    # Pipeline CI (Java 21 + Testcontainers pgvector & Next.js + Playwright/Axe)
├── agents/
│   └── journalist/             # Workspace do Agente Jornalista CritHit! (OpenBot + Gemini)
├── scripts/
│   └── editorial-autopilot.mjs # Automação editorial CLI (curate / author / live)
├── docs/                       # Documentação completa (Fases 1 a 5)
│   ├── 01-visao-produto.md
│   ├── 02-epicos-e-historias.md
│   ├── 03-regras-de-negocio-e-fluxos.md
│   ├── 04-roadmap-fases.md
│   ├── 05-arquitetura-e-adrs.md
│   ├── 06-modelo-de-dados-e-api.md
│   ├── 07-design-system-tokens.md
│   └── 08-qa-report.md
├── apps/
│   ├── api/                    # Backend REST & Worker Editorial (Java 21 + Spring Boot 3.4 + Flyway + pgvector)
│   └── web/                    # Portal Web, Reels, Leitor & Admin BFF (Next.js 15 + TypeScript + Tailwind)
└── infra/                      # Docker Compose (PostgreSQL 16 + pgvector, Redis 7, API e Web)
    ├── docker-compose.yml
    ├── .env.example
    └── init-db/01-init-pgvector.sql
```

---

## 2. Variáveis de Ambiente (`infra/.env`)

Copie `infra/.env.example` para `infra/.env` (já ignorado pelo `.gitignore`):

| Variável | Descrição | Padrão Local |
| :--- | :--- | :--- |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciais do PostgreSQL 16 (`pgvector/pgvector:pg16`) | `crithit` / `crithit` / `crithit_dev_password` |
| `REDIS_PORT` / `REDIS_PASSWORD` | Porta e senha opcional do Redis 7 | `6379` / *(vazio)* |
| `JWT_SECRET` | Segredo HMAC-SHA256 (`>= 32` bytes) para assinatura JWT | Chave aleatória gerada em `infra/.env` |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Seed inicial do Editor-Chefe via `BCryptPasswordEncoder` | `admin@crithit.local` / `CritHit@2026!Admin` |
| `LLM_API_KEY` / `LLM_PROVIDER_BASE_URL` | Chave do provedor LLM/Embeddings (vazio usa fallback determinístico) | *(vazio)* / `https://api.openai.com/v1` |
| `REVALIDATE_WEBHOOK_URL` / `REVALIDATE_SECRET` | Webhook e segredo de invalidação ISR sob demanda (`/api/revalidate`) | `http://web:3000/api/revalidate` |
| `APP_WEB_PUBLIC_URL` | URL pública do portal incluída nos alertas editoriais (`/admin`) | `http://localhost:3000` |
| `DISCORD_WEBHOOK_URL` | Webhook opcional do Discord para alertas de novas pautas `PENDING_REVIEW` | *(vazio — desabilitado)* |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Bot Token e Chat ID opcionais do Telegram para alertas `PENDING_REVIEW` | *(vazios — desabilitado)* |

---

## 3. Como Executar Localmente

### Opção A — Stack Completa via Docker Compose (PostgreSQL `pgvector` + Redis + API + Web)

> **Pré-requisito no Windows:** Docker Desktop instalado com kernel WSL2 atualizado (`wsl --update` em terminal Administrador + reinicialização do Windows caso o WSL2 tenha acabado de ser habilitado).

```powershell
# 1. Subir apenas banco (PostgreSQL 16 + pgvector) e Redis:
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d

# 2. Subir toda a stack containerizada (Postgres + Redis + API Spring Boot + Web Next.js):
docker compose -f infra/docker-compose.yml --env-file infra/.env --profile app up --build -d
```

- **Portal Web (Home, Reels, Leitor, Admin):** `http://localhost:3000`
- **Healthcheck da API:** `http://localhost:8080/api/v1/health`

### Opção B — Execução Direta no Host (Desenvolvimento)

```powershell
# Backend (Java 21+ / Maven)
mvn -f apps/api/pom.xml spring-boot:run

# Frontend (Node.js 20+)
cd apps/web
npm install
npm run build
npx next start -p 3000
```

### Opção C — Preview Rápido na Vercel (Sem Back-end)

Para publicar uma demonstração pública do portal completo (Home, Reels 2.0 e Leitor com dados editoriais de demonstração) diretamente na Vercel sem precisar subir PostgreSQL/Spring Boot:

1. Importe este repositório na Vercel e defina **Root Directory** como `apps/web`.
2. Em **Environment Variables**, adicione:
   - `ENABLE_MOCK_FALLBACK=true`
   - `REVALIDATE_SECRET` *(qualquer segredo aleatório, ex.: gerado com `openssl rand -hex 24`)*
3. Clique em **Deploy**.

---

## 4. Comandos de Teste e Auditoria

```powershell
# 1. Testes Backend (JUnit 5 + Mockito + MockMvc + Testcontainers pgvector)
mvn -f apps/api/pom.xml test

# 2. Typecheck, Testes Unitários/Componentes (Vitest + RTL) e Build Next.js
cd apps/web
npm run typecheck
npm test
npm run build

# 3. Testes E2E + Auditoria WCAG 2.1 AA (Playwright + @axe-core/playwright em Modo Claro e Escuro)
npx playwright test
```

---

## 5. Agente Jornalista & Redação Automatizada (OpenBot + Gemini)

O workspace [`agents/journalist/`](./agents/journalist/README.md) define a persona, as regras editoriais (PT-BR direto, sem clickbait, zero emojis, formato Reels em 3 lâminas) e o manifesto `openbot.config.json` para integração com **OpenBot** e **Google Gemini** (`gemini-3.5-flash`, configurado em `infra/.env` sem versionar chaves).

Com a API local rodando (`http://localhost:8080/api/v1`):

```powershell
# Curadoria RSS -> polimento via Gemini -> publica até 8 variadas (5 editorias) e agenda as demais a cada 20 min
npm run agent:curate

# Produção Autoral -> gera via Gemini e cria 1 Review com nota + 1 Coluna via POST /admin/articles
npm run agent:author

# Ciclo contínuo -> coleta, curadoria e agendamento a cada 15 minutos
npm run agent:live

# Testes automatizados do script editorial
npm run agent:test
```
