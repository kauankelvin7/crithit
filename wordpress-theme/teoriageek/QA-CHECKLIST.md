# Checklist de QA Pré-Release — Teoria Geek (`v2.12.1`)

Use este roteiro antes de qualquer publicação em produção (`teoriageek.com.br` — Locaweb, PHP 8.0–8.3+, WordPress 6.2–7.1+, WP Super Cache).

---

## 1. Checks Automatizados Pré-Release

Execute todos os comandos a partir da pasta pai que contém `teoriageek/` (ou ajuste o caminho conforme seu ambiente).

### 1.1 Sintaxe PHP (`php -l` — 0 erros / 0 warnings)

**Linux / macOS (Bash):**
```bash
find teoriageek -type f -name '*.php' -print0 | xargs -0 -n1 php -l
```

**Windows (PowerShell):**
```powershell
Get-ChildItem -Path "teoriageek" -Recurse -Filter "*.php" | ForEach-Object {
  php -l $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

### 1.2 Sintaxe JavaScript (`node --check` — 0 erros)

**Linux / macOS (Bash):**
```bash
for f in teoriageek/assets/js/*.js; do node --check "$f" || exit 1; done && echo "JS OK"
```

**Windows (PowerShell):**
```powershell
Get-ChildItem -Path "teoriageek\assets\js\*.js" | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Write-Host "JS OK"
```

### 1.3 Integridade do `bundle.min.css` (zero `calc()` quebrado)

Verifica se algum operador `+` ou `-` dentro de `calc(...)` perdeu o espaço obrigatório durante a minificação:

```bash
python3 -c "
import re, pathlib
css = pathlib.Path('teoriageek/assets/css/bundle.min.css').read_text(encoding='utf-8')
bad = re.findall(r'calc\([^)]*(?:\d(?:px|%|rem|em|vw|vh|dvh|fr)|[)])[+-](?:\d|var\()[^)]*\)', css)
print('Broken calc():', len(bad), bad[:5])
assert len(bad) == 0, 'calc() quebrado encontrado em bundle.min.css!'
"
```

### 1.4 Existência de todas as fontes `.woff2` referenciadas e zero Google Fonts externos

```bash
python3 -c "
import re, pathlib
root = pathlib.Path('teoriageek')
for rel in ['assets/css/bundle.min.css', 'assets/css/main.css', 'assets/css/admin-dashboard.css']:
    p = root / rel
    txt = p.read_text(encoding='utf-8')
    assert 'fonts.googleapis.com' not in txt and 'fonts.gstatic.com' not in txt, f'Google Fonts detectado em {rel}'
    refs = sorted(set(re.findall(r\"url\(['\\\"]?([^'\\\")]+\.woff2)['\\\"]?\)\", txt)))
    missing = [r for r in refs if not (p.parent / r).resolve().exists()]
    print(f'{rel}: {len(refs)} fontes referenciadas, {len(missing)} ausentes')
    assert not missing, f'Fontes ausentes em {rel}: {missing}'
"
```

### 1.5 Integridade estrutural do pacote `.zip`

```bash
python3 -c "
import zipfile
z = zipfile.ZipFile('teoriageek-theme-v2.12.1.zip')
names = z.namelist()
required = [
    'teoriageek/',
    'teoriageek/style.css',
    'teoriageek/functions.php',
    'teoriageek/inc/analytics.php',
    'teoriageek/screenshot.png',
    'teoriageek/README.md',
    'teoriageek/CHANGELOG.md',
    'teoriageek/QA-CHECKLIST.md',
    'teoriageek/assets/css/bundle.min.css',
    'teoriageek/assets/css/admin-dashboard.css',
    'teoriageek/assets/js/main.js',
    'teoriageek/assets/js/reels.js',
    'teoriageek/assets/js/admin-dashboard.js',
]
missing = [r for r in required if r not in names]
bad_sep = [n for n in names if '\\\\' in n]
junk = [n for n in names if any(x in n for x in ('node_modules/', '.git/', '__MACOSX/', '.DS_Store'))]
print('Total entries:', len(names), '| Missing:', missing, '| Backslashes:', len(bad_sep), '| Junk:', junk)
assert not missing and not bad_sep and not junk
"
```

---

## 2. Matriz de Testes Funcionais

Execute cada item em **Desktop (`1280×900`)** e **Mobile (`360×800` / `390×844`)**, alternando **Modo Claro** e **Modo Escuro**, com o console do navegador aberto (**0 erros JS / 0 HTTP 404** e zero overflow horizontal `scrollWidth <= innerWidth`).

### 2.1 Plantão Geek (Ticker no topo da Home)
- [ ] **Deslizamento contínuo:** manchetes rolam suavemente sem corte excessivo nas bordas.
- [ ] **Pausar e Retomar:** clicar no botão de pausa alterna `aria-pressed="true"`, troca ícone para play e para imediatamente a animação; clicar novamente **retoma na hora** sem precisar tirar o mouse ou clicar fora (sem travamento por foco residual).
- [ ] **Hover:** passar o mouse apenas sobre a área das manchetes pausa o ticker e retoma ao sair.
- [ ] **`prefers-reduced-motion`:** com redução de movimento ativa no sistema, o ticker fica estático e rolável horizontalmente sem clones duplicados.

### 2.2 Hero Editorial 3D HQ Page Turn (Home)
- [ ] **LCP imediato:** Slide 1 carrega visível no primeiro paint (`loading="eager"` + `fetchpriority="high"`), sem salto de layout (CLS = 0) nos 3 cards secundários abaixo.
- [ ] **Transição 3D & Autoplay (`4,2s`):** troca automática a cada `4,2s` com virada de página HQ 3D (ou crossfade limpo se WebGL indisponível) e preenchimento sincronizado do minimapa (`3px`) e do trilho numerado (`01`–`04`).
- [ ] **Controles manuais:** setas `‹`/`›`, botão Pausar/Retomar no dock, clique em cada item do trilho (`01`–`04`), clique nos segmentos do minimapa e swipe horizontal no mobile funcionam sem bloquear scroll vertical.
- [ ] **Deduplicação:** nenhuma das 4 matérias do Hero repete nos 3 cards secundários abaixo nem no *Giro Geek*.

### 2.3 Mais Lidas (`7 dias` vs. `24 horas` e Contagem Real)
- [ ] **Alternância de abas:** clicar em **24 horas** e **7 dias** alterna `aria-selected` e exibe listas distintas (`data-tg-mr-panel="24h"` / `"7d"`).
- [ ] **Contagem real com cache ativo:** abrir uma matéria (`single.php`) em aba limpa, aguardar `1,5s` e confirmar na aba *Network* o `POST /wp-json/teoriageek/v1/posts/{id}/view` com status `200` e `{ views, views24h }`.
- [ ] **Proteção contra F5:** recarregar a mesma matéria na mesma aba e confirmar que `sessionStorage` (`tg-viewed-{id}`) impede nova chamada duplicada.

### 2.4 Reels Verticais (`/reels/`)
- [ ] **Enquadramento (visitante e logado com Admin Bar):** zero recorte no topo das 3 colunas (Desktop) e do player (Mobile); `window.scrollY === 0` ao avançar vários slides (`↓` / roda do mouse / botões).
- [ ] **Lâminas 1–3:** alternância por setas laterais, barras no topo, clique nas laterais, swipe horizontal e teclas `←` / `→`.
- [ ] **Persistência de curtidas:** clicar em **Curtir** (confirmar `POST /wp-json/teoriageek/v1/posts/{id}/like` status `200`), recarregar a página (`F5`) e verificar que o contador persistido em `_tg_likes_count` e o estado curtido permanecem sincronizados; clicar novamente para descurtir e confirmar o decremento após recarregar.
- [ ] **Filtros:** alternar entre *Para Você*, *Mais Lidas*, *Salvos* e editorias sem erros de console.

### 2.5 Artigo Individual (`single.php`)
- [ ] **Leia Também automático:** em matéria com **6+ parágrafos**, confirmar 1 card enxuto `.tg-inline-read-more` injetado após o 4º parágrafo (e ausente em notas curtas com menos de 6 parágrafos).
- [ ] **Alerta de Spoiler:**
  - Em matéria marcada com `_tg_has_spoilers`, confirmar selo *"Contém Spoilers"* no cabeçalho/cards e bloqueio com blur sobre o conteúdo até clicar em *"Clique aqui para ver o spoiler por sua conta e risco"*.
  - Em matéria com `[spoiler titulo="Aviso"]Texto[/spoiler]`, confirmar abertura/fechamento via `<details>` sem JS.
- [ ] **Nota da Comunidade (Críticas/Reviews):** em matéria com nota da redação, votar de `1` a `10`, confirmar `POST /wp-json/teoriageek/v1/posts/{id}/community-score` status `200`, atualização da média/contagem e trava de re-voto após `F5` (`localStorage: teoriageek-rated-posts`).
- [ ] **Reação rápida de 1 clique:** clicar em **Curtir** ao fim da matéria, confirmar sincronização com `_tg_likes_count` e que o mesmo estado aparece refletido ao abrir a matéria em `/reels/`.
- [ ] **Linha do Tempo `universo`:** em matéria associada a um `universo` com **3+ publicações**, confirmar o bloco *"Cobertura Especial"* destacando a matéria atual (*"Lendo agora"*) e link *"Ver todas (N)"* apontando para `/universo/<slug>/`.
- [ ] **Newsletter:** com `teoriageek_newsletter_action_url` vazia no Personalizador, o bloco **não aparece**; ao preencher URL válida, o formulário de 1 campo aparece no fim do artigo e no rodapé com `name` configurável.
- [ ] **Lightbox, Leitura e Mídia:** clicar em uma imagem de `.entry-content` abre o Lightbox (fecha com `×`, clique no fundo ou `Esc`); botões `A-`/`100%`/`A+` escalam parágrafos normais e spans legados; vídeos YouTube renderizam Facade leve antes do clique.

### 2.6 Sino de Alertas (`alerts-saved-drawer.php`)
- [ ] **Abertura e feed:** clicar no sino abre a gaveta com focus trap, carrega `GET /wp-json/teoriageek/v1/alerts` (últimas 6 publicações) e apaga a bolinha de não lidas.
- [ ] **Botão *"Eu quero!"*:** dispara OneSignal/WebPushr quando instalado ou exibe mensagem amigável de confirmação quando ausente; *"Agora não"* oculta o card via `localStorage` (`teoriageek-push-dismissed`).
- [ ] **Canais dinâmicos:** confirmar que apenas os links preenchidos no Personalizador (**WhatsApp**, **Telegram**, **Google Notícias** + **Feed RSS**) aparecem no bloco de canais da gaveta, na Home (`community-cta.php`) e no rodapé (`footer.php`).

### 2.7 Central Teoria Geek & Analytics First-Party (`/wp-admin/admin.php?page=teoriageek-central`)
- [ ] **Isolamento de CSS e fontes:** verificar na aba *Network* o carregamento de `admin-dashboard.css`, `admin-dashboard.js` e das 4 fontes `.woff2` (`../fonts/*.woff2`) com HTTP `200`, sem distorcer outras telas do `/wp-admin/`.
- [ ] **Segurança e disponibilidade do `/admin-metrics`:**
  - Logado como administrador/editor, clicar em **Atualizar agora** e confirmar `GET /wp-json/teoriageek/v1/admin-metrics?range=7d&refresh=1` retornando **`200 OK`** com JSON válido (`kpis` + `analytics`).
  - Em aba anônima (deslogado), acessar `/wp-json/teoriageek/v1/admin-metrics` e confirmar resposta **`401`** ou **`403`** (nunca `404` e nunca vazando dados).
- [ ] **Compatibilidade WP Super Cache nas rotas públicas:** em aba anônima, confirmar no *Network* que `POST /posts/{id}/view`, `POST /posts/{id}/like`, `POST /posts/{id}/community-score` e `POST /telemetry` são enviados **sem cabeçalho `X-WP-Nonce`** e retornam `200 OK`.
- [ ] **Coleta de cliques, scroll e origem (`POST /telemetry`):** navegar na Home, clicar no Carrossel Hero, em uma matéria e em um canal/compartilhamento, rolar o artigo até o fim e confirmar na Central:
  - Selo **● online agora** no Hero e **Pulso Analytics** na *Visão geral* atualizados.
  - Aba **Audiência & Origem**: sessões, tempo ativo médio, bounce rate, referrers, Donut de dispositivos, gráfico horário `00h–23h`, funil Scroll Depth (`25%`–`100%`) e páginas mais acessadas preenchidos.
  - Aba **Cliques & Comportamento**: **Mapa por zona** ("Aonde mais clicaram"), **Conversões & CTAs**, **Top 15 links/botões clicados** e **Termos mais buscados** preenchidos.
  - Alternância de período (`Hoje` | `7d` | `14d` | `30d`) recarrega os dados sem F5.
- [ ] **Gráficos editoriais e Redação:** confirmar colunas 3D (14 dias), gráfico de área com tooltip, Donut das 6 editorias, *Mais lidas* (`24h` / `7 dias`), comparativo de *Críticas*, fila editorial (`edit_others_posts`) e **Destaques no ar** exibindo corretamente posts marcados com `_tg_main_headline`, `_tg_plantao` e `_tg_has_spoilers`.
- [ ] **Tema Escuro/Claro e Big Board:** alternar entre *Tema claro* e *Tema escuro* (`localStorage: tgAdmTheme`) e testar **Big Board** (sair com `Esc`).
- [ ] **Manutenção em Saúde e atalhos:** confirmar *Analytics First-Party (/telemetry)* como **Ativo**, testar **Limpar cache do tema**, alternância de visitas da equipe e **Zerar Analytics** (com confirmação).
- [ ] **Painel Inicial & Todos os Posts:** confirmar widget **Teoria Geek — Resumo Rápido** em `index.php` e colunas **Métricas** / **Destaques** (Manchete/Plantão/Spoiler) + filtro `tg_flag` em `edit.php`.
