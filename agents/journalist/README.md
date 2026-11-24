# Agente Jornalista CritHit! (OpenBot + Gemini)

Workspace dedicado do agente editorial automatizado do portal **CritHit!**, projetado para operar tanto via **OpenBot CLI** quanto diretamente via **scripts Node.js nativos** (`scripts/editorial-autopilot.mjs`) integrados à API Spring Boot (`http://localhost:8080/api/v1`) e ao Google Gemini (`gemini-3.5-flash`).

---

## 1. Arquivos deste Workspace

- [`AGENT.md`](./AGENT.md): persona, diretrizes editoriais (PT-BR natural, zero clickbait, zero emojis, formato Reels 3 lâminas) e contratos HTTP exatos da API.
- [`openbot.config.json`](./openbot.config.json): manifesto de configuração para o OpenBot apontando para `AGENT.md`, provedor Gemini OpenAI-compatible e variáveis de ambiente (sem nenhum segredo hardcoded).
- [`../../scripts/editorial-autopilot.mjs`](../../scripts/editorial-autopilot.mjs): motor executável em Node.js puro (`fetch` nativo) com os modos `curate`, `author` e `live`.

---

## 2. Pré-requisitos e Variáveis de Ambiente

Todas as credenciais são lidas automaticamente de `infra/.env` (ou das variáveis exportadas no shell), nunca sendo gravadas no Git:

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `CRITHIT_API_URL` | Base URL da API CritHit! | `http://localhost:8080/api/v1` |
| `ADMIN_SEED_EMAIL` | E-mail do editor para `POST /admin/auth/login` | *(lido de `infra/.env`)* |
| `ADMIN_SEED_PASSWORD` | Senha do editor para `POST /admin/auth/login` | *(lido de `infra/.env`)* |
| `LLM_PROVIDER_BASE_URL` | Endpoint OpenAI-compatible do Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `LLM_API_KEY` | Chave da API Gemini | *(lido de `infra/.env`)* |
| `LLM_CHAT_MODEL` | Modelo principal de redação | `gemini-3.5-flash` |

---

## 3. Como Executar via CLI (Scripts npm na Raiz)

Na raiz do repositório (`CritHit/`):

```powershell
# 1. Curadoria RSS: login -> trigger RSS -> polimento Gemini -> publica até 8 variadas e agenda o restante de 20 em 20 min
npm run agent:curate

# 2. Produção Autoral: gera e publica/agenda 1 Review com nota + 1 Coluna analítica via POST /admin/articles
npm run agent:author

# 3. Ciclo contínuo (live): mantém curadoria e agendamento rodando a cada 15 minutos
npm run agent:live

# 4. Rodar suíte de testes automatizados do script editorial
npm run agent:test
```

Flags opcionais disponíveis no script:
- `--dry-run`: simula todo o fluxo e gera textos sem alterar registros na API.
- `--max-publish=8`: define o limite de publicações imediatas no modo `curate`.
- `--schedule-step-minutes=20`: intervalo em minutos entre matérias agendadas.
- `--interval-minutes=15`: intervalo do loop contínuo no modo `live`.

---

## 4. Como Executar via OpenBot

1. Instale o OpenBot CLI globalmente (Node.js `>= 20.12`):
   ```powershell
   npm install -g openbot
   ```
2. Exporte as variáveis do `infra/.env` ou inicie a partir do workspace do agente:
   ```powershell
   cd agents/journalist
   openbot start
   ```
3. Aponte o OpenBot para `agents/journalist/AGENT.md` e `agents/journalist/openbot.config.json` para orquestrar os comandos `curate`, `author` e `live` de forma interativa ou agendada.
