# CritHit! — Épicos e Histórias de Usuário

**Versão:** 1.0  
**Status:** Aprovado para Fase 1 (Produto & Documentação)  
**Referência:** [01-visao-produto.md](./01-visao-produto.md)

---

## Mapa de Épicos

| ID | Épico | Rota / Escopo Principal |
| :--- | :--- | :--- |
| **E1** | Home Editorial (SSR/ISR) | `/` |
| **E2** | CritHit Reels 9:16 | `/reels` e `/reels?id=<slug>` |
| **E3** | Leitor de Matéria (SSR/ISR) | `/noticia/[slug]` |
| **E4** | Pipeline RSS, Deduplicação Semântica (`pgvector >= 0.82`) e Adaptação IA | Worker Backend (`/apps/api`) |
| **E5** | Painel Admin Protegido (JWT) | `/admin` |
| **E6** | Tema Claro/Escuro Persistente, Direção de Arte e Acessibilidade WCAG AA | Transversal (Global) |

---

## Épico 1 — Home Editorial (`/`) com SSR/ISR

Garantir uma capa jornalística de alta densidade informativa, inspirada em grandes portais de notícias com identidade editorial própria, renderizada no servidor para desempenho e SEO.

### US-1.1 — Renderização SSR/ISR e SEO da Home (`/`)
**Como** leitor ou mecanismo de busca,  
**quero** acessar a rota `/` já renderizada no servidor com metadados completos e atualização incremental,  
**para** visualizar imediatamente as notícias mais recentes sem depender de carregamento bloqueante no cliente.

**Critérios de Aceite:**
- **Dado** que existem matérias com status `PUBLISHED`,  
  **Quando** um cliente ou crawler requisita `GET /`,  
  **Então** o HTML inicial retornado pelo Next.js App Router já contém a Manchete Principal, destaques secundários, Giro Geek e links semânticos `<a href="/noticia/...">`.
- **Dado** o `<head>` da rota `/`,  
  **Quando** a página é inspecionada,  
  **Então** contém `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:type`), `canonical`, JSON-LD (`WebSite` / `NewsMediaOrganization`) e **não** contém `user-scalable=no` na meta `viewport`.
- **Dado** que uma matéria foi publicada ou atualizada no `/admin`,  
  **Quando** ocorre revalidação ISR (ou revalidação sob demanda),  
  **Então** a Home reflete o novo estado sem necessidade de rebuild completo.

---

### US-1.2 — Faixa Plantão Geek (Breaking News)
**Como** leitor,  
**quero** visualizar uma faixa contínua no topo da Home com as chamadas urgentes e últimas atualizações,  
**para** identificar rapidamente o que acabou de acontecer no universo geek.

**Critérios de Aceite:**
- **Dado** que o usuário acessa `/`,  
  **Quando** a página carrega,  
  **Então** a faixa exibe o selo `PLANTÃO GEEK` com ícone vetorial `lucide-react` (zero emojis) seguido pelos títulos das notícias recentes clicáveis que levam para `/noticia/[slug]`.
- **Dado** que o usuário passa o mouse ou foca com o teclado um item da faixa,  
  **Quando** o ponteiro ou foco está ativo,  
  **Então** o movimento do ticker pausa imediatamente para facilitar leitura e clique.
- **Dado** que `prefers-reduced-motion: reduce` está ativo no sistema operacional,  
  **Quando** a página renderiza,  
  **Então** a animação contínua é desativada e os itens são exibidos de forma estática legível ou navegável horizontalmente sem rolagem automática.

---

### US-1.3 — Hero Principal com Sub-bullets e 3 Destaques Secundários
**Como** leitor,  
**quero** ver na dobra principal uma Manchete Principal destacada com sub-bullets de contexto e 3 destaques secundários abaixo dela,  
**para** entender a notícia mais importante do dia e seus desdobramentos em segundos.

**Critérios de Aceite:**
- **Dado** que existe uma matéria `PUBLISHED` marcada como Manchete Principal (`is_main_headline = true`),  
  **Quando** a Home é renderizada,  
  **Então** ela ocupa o card Hero principal (8 colunas no desktop) exibindo badge da editoria, manchete, imagem com `alt` descritivo, lead curto, até 3 sub-bullets de resumo e atribuição (`author_name` e `source_name`).
- **Dado** que não há matéria explicitamente marcada como `is_main_headline = true`,  
  **Quando** a Home consulta os destaques,  
  **Então** o sistema aplica fallback determinístico exibindo a matéria `PUBLISHED` mais recente no Hero principal.
- **Dado** o grid abaixo do Hero principal,  
  **Quando** há pelo menos 3 outras matérias publicadas,  
  **Então** exatamente 3 cards secundários são renderizados em 3 colunas no desktop (`sm:grid-cols-3` / `lg:grid-cols-3`) com link direto para `/noticia/[slug]`.

---

### US-1.4 — Coluna Lateral do Hero: Reels em Destaque e Urgente na Redação
**Como** leitor,  
**quero** ver ao lado do Hero um bloco de Reels em Destaque e a lista "Urgente na Redação",  
**para** alternar entre consumo rápido em formato 9:16 e plantão de última hora sem sair da dobra inicial.

**Critérios de Aceite:**
- **Dado** a coluna lateral direita do Hero (4 colunas no desktop),  
  **Quando** a Home carrega,  
  **Então** exibe no topo a caixa "Reels em Destaque" com prévia vertical clicável direcionando para `/reels?id=<slug>` e botão para `/reels`.
- **Dado** a seção "Urgente na Redação" logo abaixo da caixa de Reels,  
  **Quando** existem notícias marcadas como urgentes (`is_urgent = true`) ou mais recentes da redação,  
  **Então** exibe 2 cards compactos com indicador visual acessível (sem depender apenas de cor, com rótulo textual claro como `AO VIVO` / `URGENTE`) e link para `/noticia/[slug]`.

---

### US-1.5 — Giro Geek (2 linhas x 4 colunas)
**Como** leitor,  
**quero** percorrer um bloco de 8 notícias rápidas organizadas em 2 linhas por 4 colunas,  
**para** me atualizar sobre múltiplas editorias em uma única varredura visual.

**Critérios de Aceite:**
- **Dado** a seção "Giro Geek — Últimas do Radar",  
  **Quando** há matérias publicadas suficientes,  
  **Então** o grid exibe até 8 cards compactos em layout de 4 colunas no desktop (`lg:grid-cols-4`), 2 colunas em tablets (`sm:grid-cols-2`) e 1 coluna no mobile.
- **Dado** cada card do Giro Geek,  
  **Quando** renderizado,  
  **Então** apresenta editoria, manchete concisa, timestamp relativo/absoluto e fonte (`source_name`), sem truncar informações críticas abaixo do piso de `11px`.

---

### US-1.6 — Newsletter "Loot Diário"
**Como** leitor recorrente,  
**quero** cadastrar meu e-mail no banner da Newsletter diretamente na Home,  
**para** receber o resumo diário das principais notícias sem clickbait.

**Critérios de Aceite:**
- **Dado** o formulário da seção "Loot Diário" na Home,  
  **Quando** o usuário informa um e-mail válido e envia,  
  **Então** a aplicação envia `POST /api/v1/newsletter/subscribe`, exibe confirmação clara de sucesso (com ícone vetorial `lucide-react`) e limpa ou trava reenvio duplicado.
- **Dado** um e-mail inválido ou em branco,  
  **Quando** o usuário tenta submeter,  
  **Então** o campo exibe mensagem de erro acessível vinculada via `aria-describedby` sem recarregar a página.

---

### US-1.7 — Seção Colunas & Reviews
**Como** leitor geek interessado em análises aprofundadas,  
**quero** visualizar uma seção dedicada a Colunas & Reviews na Home,  
**para** descobrir opiniões autorais e críticas de jogos, HQs, filmes e séries.

**Critérios de Aceite:**
- **Dado** que existem artigos classificados como coluna ou review (`editorial_format = COLUMN | REVIEW` ou tag/categoria equivalente),  
  **Quando** a Home renderiza a seção "Colunas & Reviews",  
  **Então** exibe até 4 cards em grid horizontal no desktop (`lg:grid-cols-4`) destacando o nome do autor (`author_name`), selo `AUTORAL` (ou `CURADORIA` quando aplicável) e nota/selo de review quando houver.

---

### US-1.8 — Carrossel Horizontal de Reels na Home
**Como** leitor,  
**quero** navegar por uma faixa horizontal de cards verticais 9:16 na Home,  
**para** abrir qualquer notícia diretamente no modo imersivo de Reels.

**Critérios de Aceite:**
- **Dado** a seção "CritHit Reels" na Home,  
  **Quando** renderizada,  
  **Então** exibe uma linha de cards com proporção 9:16 (6 visíveis em desktop ou carrossel horizontal rolável em viewports menores) e CTA "Ver todos os Reels" apontando para `/reels`.
- **Dado** que o usuário clica em um card específico do carrossel,  
  **Quando** o evento de navegação ocorre,  
  **Então** o usuário é direcionado para `/reels?id=<slug>` abrindo diretamente aquele item.

---

### US-1.9 — 3 Blocos de Editorias
**Como** leitor com interesse específico em uma mídia,  
**quero** ver colunas dedicadas às principais editorias na Home,  
**para** acompanhar separadamente Games, Quadrinhos & Mangás e Cinema & Séries.

**Critérios de Aceite:**
- **Dado** a seção de Editorias em Destaque na Home,  
  **Quando** a página carrega,  
  **Então** são exibidos 3 blocos em colunas (`lg:grid-cols-3`): **Games**, **Quadrinhos & Mangás** e **Cinema & Séries** (cada bloco com destaque de capa + lista de matérias recentes da respectiva editoria).
- **Dado** cada bloco de editoria,  
  **Quando** o usuário clica em uma matéria ou filtro de editoria,  
  **Então** navega para `/noticia/[slug]` ou filtra os conteúdos correspondentes sem perda de contraste no cabeçalho colorido da editoria.

---

### US-1.10 — Ranking Mais Lidas (#1 a #5)
**Como** leitor,  
**quero** consultar as 5 matérias mais lidas da semana na Home,  
**para** não perder os assuntos de maior repercussão na comunidade.

**Critérios de Aceite:**
- **Dado** a seção "Mais Lidas da Semana",  
  **Quando** renderizada,  
  **Então** exibe exatamente até 5 itens ordenados de `#1` a `#5` por contagem de visualizações (`views_count`), mostrando posição numérica em destaque, editoria, manchete e link para `/noticia/[slug]`.

---

### US-1.11 — Busca Editorial e Rodapé Completo
**Como** leitor,  
**quero** pesquisar matérias por palavra-chave no cabeçalho e encontrar links institucionais e de editorias no rodapé,  
**para** localizar qualquer cobertura anterior e conhecer a política editorial do portal.

**Critérios de Aceite:**
- **Dado** a barra de busca no cabeçalho (desktop e mobile),  
  **Quando** o usuário digita um termo e submete (ou após debounce com disparo explícito acessível),  
  **Então** a interface consulta `GET /api/v1/articles?q=<termo>` e exibe os resultados filtrados apenas entre matérias `PUBLISHED`, com botão claro de "Limpar busca" usando ícone vetorial `X` (`lucide-react`).
- **Dado** o rodapé completo da Home,  
  **Quando** o usuário chega ao fim da página,  
  **Então** encontra identidade `CRITHIT!`, resumo institucional sobre curadoria + revisão humana, links das editorias, links para `/reels` e política de transparência editorial, além de botões sociais com ícones vetoriais e `aria-label` descritivo (zero emojis).

---

## Épico 2 — Reels 9:16 (`/reels` e `/reels?id=<slug>`)

Oferecer consumo vertical rápido, fluido e engajador em formato 9:16, sem abrir mão da atribuição jornalística e da transição imediata para a matéria completa.

### US-2.1 — Feed Vertical Fullscreen com Scroll-Snap
**Como** leitor mobile-first,  
**quero** deslizar verticalmente entre notícias no formato 9:16 ocupando a altura útil da tela com encaixe magnético,  
**para** consumir uma notícia por vez sem cortes desajeitados.

**Critérios de Aceite:**
- **Dado** que o usuário acessa `/reels`,  
  **Quando** a lista de Reels carrega,  
  **Então** o container utiliza scroll vertical com `scroll-snap-type: y mandatory` e cada card ocupa o viewport útil (`snap-start` / `snap-always`) com proporção 9:16 centralizada no desktop e fullscreen no mobile.
- **Dado** cada card de Reel,  
  **Quando** exibido,  
  **Então** mostra categoria, manchete direta, resumo curto (`reels_summary`), imagem de fundo com overlay escuro garantindo contraste >= 4.5:1 para o texto sobreposto, e atribuição (`author_name` + `source_name`).

---

### US-2.2 — Deep-link `/reels?id=<slug>` e Sincronização de URL
**Como** leitor que clicou em um Reel na Home ou recebeu um link compartilhado,  
**quero** que `/reels?id=<slug>` abra exatamente no Reel correspondente e atualize a URL conforme navego,  
**para** compartilhar o item exato que estou lendo.

**Critérios de Aceite:**
- **Dado** que o usuário acessa `/reels?id=meu-slug-geek` com o slug existente e publicado,  
  **Quando** a rota termina de montar,  
  **Então** o feed posiciona imediatamente o scroll no card cujo `slug` é `meu-slug-geek`.
- **Dado** que o usuário rola ou usa as setas para avançar ao próximo Reel,  
  **Quando** um novo card se torna ativo no viewport (via `IntersectionObserver`),  
  **Então** a URL é atualizada de forma não destrutiva (`history.replaceState` ou `router.replace` com `scroll: false`) para `/reels?id=<novo-slug>`.
- **Dado** um `?id=<slug>` inexistente ou não publicado,  
  **Quando** `/reels?id=inexistente` é acessado,  
  **Então** a página exibe aviso discreto de item indisponível e inicia no primeiro Reel publicado disponível sem quebrar a aplicação.

---

### US-2.3 — Filtros por Editoria no Modo Reels
**Como** leitor,  
**quero** filtrar o feed de Reels por editoria (Todas, Games, Quadrinhos & Mangás, Cinema & Séries, Tech),  
**para** focar apenas nos temas do meu interesse durante aquela sessão.

**Critérios de Aceite:**
- **Dado** a barra de filtros por editoria na interface de `/reels`,  
  **Quando** o usuário seleciona uma editoria (ex.: `Games`),  
  **Então** o feed exibe somente Reels publicados daquela editoria, atualiza o contador de itens visíveis e reseta a posição para o primeiro card filtrado.
- **Dado** que não há Reels publicados para um filtro combinado,  
  **Quando** o filtro é aplicado,  
  **Então** é exibido um estado vazio informativo com botão "Ver todas as editorias" (sem emojis).

---

### US-2.4 — Curtidas, Salvos e Comentários nos Reels
**Como** leitor engajado,  
**quero** curtir, salvar para depois e comentar em um Reel,  
**para** interagir com a comunidade e guardar notícias de interesse.

**Critérios de Aceite:**
- **Dado** os botões de ação lateral de um Reel (Curtir, Salvar, Comentar, Compartilhar),  
  **Quando** o usuário clica em Curtir ou Salvar,  
  **Então** a ação persiste via API (`POST /api/v1/articles/{slug}/like` ou estado local sincronizado + API), o contador atualiza imediatamente com estado visual `aria-pressed="true"` e feedback acessível.
- **Dado** que o usuário clica em Comentar,  
  **Quando** a gaveta/modal de comentários abre,  
  **Então** lista os comentários existentes da matéria e permite enviar novo comentário validado (texto sanitizado contra XSS, limite de caracteres, sem HTML executável) com foco gerenciado (`Escape` fecha o modal e retorna foco ao botão acionador).

---

### US-2.5 — Link Direto para Matéria Completa e Atribuição no Reel
**Como** leitor,  
**quero** abrir a matéria completa a partir de qualquer Reel e ver quem publicou a fonte original,  
**para** me aprofundar na notícia com total transparência.

**Critérios de Aceite:**
- **Dado** um card de Reel ativo,  
  **Quando** o usuário clica em "Ler matéria completa",  
  **Então** navega para `/noticia/<slug>` correspondente.
- **Dado** o rodapé ou área de metadados do Reel,  
  **Quando** o conteúdo é `CURADORIA`,  
  **Então** exibe `source_name` e link externo seguro (`target="_blank" rel="noopener noreferrer"`) ou acesso imediato à atribuição completa na matéria.

---

### US-2.6 — Navegação por Teclado e Preservação de Scroll nos Reels
**Como** usuário de teclado no desktop,  
**quero** navegar entre os Reels usando as setas do teclado e manter minha posição ao voltar da matéria completa,  
**para** ter uma experiência fluida sem depender exclusivamente do mouse ou touch.

**Critérios de Aceite:**
- **Dado** que o usuário está em `/reels` fora de um campo de texto (`input`/`textarea`),  
  **Quando** pressiona `ArrowDown` ou `PageDown` (ou `ArrowUp` / `PageUp`),  
  **Então** o feed avança (ou retrocede) exatamente 1 card com rolagem suave (ou instantânea se `prefers-reduced-motion: reduce`).
- **Dado** que o usuário abriu `/noticia/<slug>` a partir do 4º Reel e pressionou Voltar no navegador,  
  **Quando** retorna a `/reels?id=<slug>`,  
  **Então** a posição é restaurada no 4º Reel correspondente.

---

## Épico 3 — Leitor de Matéria (`/noticia/[slug]`)

Entregar leitura jornalística confortável, indexável pelo Google e transparente quanto à origem e revisão da informação.

### US-3.1 — Página de Matéria SSR/ISR e SEO Completo
**Como** leitor vindo de busca orgânica ou redes sociais,  
**quero** abrir `/noticia/[slug]` com carregamento imediato e pré-visualização rica ao compartilhar,  
**para** ler a matéria sem atrasos e compartilhá-la com título, descrição e imagem corretos.

**Critérios de Aceite:**
- **Dado** um `slug` de artigo `PUBLISHED`,  
  **Quando** `GET /noticia/[slug]` é requisitado,  
  **Então** a página é renderizada no servidor (SSR/ISR) com HTTP 200, `<title>` único, `<meta name="description">`, `og:title`, `og:description`, `og:image`, `twitter:card="summary_large_image"` e JSON-LD `NewsArticle`.
- **Dado** um `slug` inexistente ou com status `PENDING_REVIEW`, `SCHEDULED`, `UNPUBLISHED` ou `DISCARDED`,  
  **Quando** um leitor público acessa `/noticia/[slug]`,  
  **Então** o sistema retorna HTTP 404 (Not Found) sem vazar dados de rascunho ou matérias retiradas do ar.

---

### US-3.2 — Atribuição Completa, Link Externo Seguro e Nota de Transparência
**Como** leitor exigente,  
**quero** visualizar autor, tipo de conteúdo (`AUTORAL` ou `CURADORIA`), nome da fonte, link externo seguro e nota de transparência,  
**para** verificar a procedência da informação antes de confiar ou compartilhar.

**Critérios de Aceite:**
- **Dado** qualquer matéria exibida em `/noticia/[slug]`,  
  **Quando** a página renderiza,  
  **Então** exibe obrigatoriamente `author_name`, selo `AUTORAL` ou `CURADORIA`, `source_name` e link clicável para `source_url`.
- **Dado** o link para `source_url`,  
  **Quando** renderizado no DOM,  
  **Então** possui exclusivamente URL iniciada por `http://` ou `https://` e atributos `target="_blank" rel="noopener noreferrer"`.
- **Dado** uma matéria com `content_type = CURADORIA`,  
  **Quando** renderizada em `/noticia/[slug]`,  
  **Então** exibe a nota discreta de transparência editorial informando a adaptação em PT-BR a partir de `source_name` com revisão humana.
- **Dado** uma matéria com `content_type = AUTORAL`,  
  **Quando** renderizada,  
  **Então** identifica explicitamente a produção original da redação sem exibir a nota de adaptação de terceiros.

---

### US-3.3 — Layout Editorial de Leitura Longa
**Como** leitor,  
**quero** ler a matéria com tipografia confortável, pontos-chave em bullets e tempo estimado de leitura,  
**para** absorver o conteúdo sem fadiga visual no desktop ou celular.

**Critérios de Aceite:**
- **Dado** o corpo da matéria em `/noticia/[slug]`,  
  **Quando** exibido,  
  **Então** utiliza `Plus Jakarta Sans` em largura de leitura otimizada (`max-w-prose` / ~65-75ch), `Barlow Condensed`/`Space Grotesk` nos títulos e `JetBrains Mono` nos metadados (`published_at`, `reading_time_minutes`, tags).
- **Dado** que a matéria possui bullets de resumo (`subheadline_bullets`),  
  **Quando** renderizada,  
  **Então** exibe caixa destacada "Pontos-chave" antes do corpo completo.

---

### US-3.4 — Conexão com Modo Reels e Destaques Relacionados
**Como** leitor,  
**quero** alternar da matéria completa para sua versão em Reels e descobrir matérias relacionadas ao final da leitura,  
**para** continuar explorando o tema no formato que preferir.

**Critérios de Aceite:**
- **Dado** uma matéria em `/noticia/[slug]`,  
  **Quando** o usuário clica no botão "Ver em modo Reels",  
  **Então** navega diretamente para `/reels?id=<slug>`.
- **Dado** o bloco inferior da página de matéria,  
  **Quando** existem outras matérias `PUBLISHED` na mesma editoria ou recentes,  
  **Então** exibe até 3–4 destaques relacionados com links para `/noticia/[outro-slug]`.

---

## Épico 4 — Pipeline RSS, Deduplicação Semântica (`pgvector`) e Adaptação IA

Automatizar a descoberta e preparação editorial de notícias em fila `PENDING_REVIEW`, evitando duplicidade e preservando rigor factual e atribuição.

### US-4.1 — Ingestão Periódica de Feeds RSS (Internacionais + Nacionais)
**Como** operador da redação,  
**quero** que um worker colete periodicamente feeds RSS confiáveis do Brasil e do exterior,  
**para** manter o radar de notícias atualizado sem monitoramento manual de dezenas de sites.

**Critérios de Aceite:**
- **Dado** a lista cadastrada de fontes RSS ativas (com `source_name`, idioma, editoria padrão e URL `https://`),  
  **Quando** o agendador do worker executa o ciclo de coleta (ex.: a cada 15 minutos),  
  **Então** realiza parsing RSS/Atom com `Rome`, extrai e sanitiza o texto/excerto com `JSoup` removendo scripts e HTML malicioso.
- **Dado** um item RSS cuja URL canônica exata já foi ingerida anteriormente ou cujo protocolo não é `http://`/`https://`,  
  **Quando** o worker valida o item,  
  **Então** ignora a duplicata exata (ou rejeita URL inválida registrando log estruturado) sem disparar chamada desnecessária ao LLM.

---

### US-4.2 — Deduplicação Semântica via `pgvector` (Threshold >= 0.82)
**Como** editor-chefe,  
**quero** que notícias de veículos diferentes sobre o mesmo fato sejam reconhecidas semanticamente e agrupadas,  
**para** evitar matérias repetidas na fila de revisão e enriquecer a apuração com fontes cruzadas.

**Critérios de Aceite:**
- **Dado** um item RSS novo e normalizado,  
  **Quando** o worker gera o vetor de embedding (título + excerto limpo) e consulta o PostgreSQL (`pgvector`) na janela de comparação ativa,  
  **Então** calcula a similaridade cosseno (`1 - (embedding <=> existing_embedding)`).
- **Dado** que a maior similaridade encontrada é **`>= 0.82`** com um rascunho `PENDING_REVIEW` (ou matéria recente já existente),  
  **Quando** o sistema processa o resultado,  
  **Então** **não** cria um novo artigo duplicado; em vez disso, anexa a nova fonte (`source_name`, `source_url`, título original e score de similaridade) à lista de fontes cruzadas do registro correspondente e registra log da deduplicação.
- **Dado** que todas as similaridades encontradas são **`< 0.82`**,  
  **Quando** o sistema processa o resultado,  
  **Então** encaminha o item para a etapa de adaptação editorial via IA e persistência como novo rascunho.

---

### US-4.3 — Adaptação Editorial IA em JSON Estruturado para `PENDING_REVIEW`
**Como** editor-chefe,  
**quero** que a IA gere um rascunho em PT-BR já estruturado em JSON seguindo o Manual de Tom de Voz e salvando sempre em `PENDING_REVIEW`,  
**para** agilizar a revisão humana sem nunca publicar conteúdo não verificado automaticamente.

**Critérios de Aceite:**
- **Dado** um item único encaminhado ao serviço de adaptação LLM,  
  **Quando** o LLM retorna resposta,  
  **Então** o backend valida o payload contra o contrato JSON esperado (manchete sem clickbait, bullets, lead, parágrafos do corpo, `reels_summary`, editoria, tags e notas de IA).
- **Dado** que o payload JSON é válido,  
  **Quando** o artigo é persistido no PostgreSQL,  
  **Então** o status inicial é **obrigatoriamente** `PENDING_REVIEW`, com `content_type = CURADORIA`, `source_name` e `source_url` originais preservados integralmente e `author_name` preenchido com valor padrão revisável (ex.: `"Redação CritHit!"`).
- **Dado** que o LLM falha, sofre timeout ou retorna JSON inválido após retry configurado,  
  **Quando** o tratamento de erro executa,  
  **Então** o sistema registra o erro em log e salva um rascunho fallback em `PENDING_REVIEW` com o texto original limpo marcado para edição manual (ou marca falha recuperável), **nunca** publicando diretamente.

---

## Épico 5 — Painel Admin Protegido (`/admin`, JWT)

Fornecer uma mesa de trabalho editorial segura, rápida e auditável para revisão humana obrigatória, agendamento e gestão de matérias publicadas.

### US-5.1 — Autenticação JWT e Proteção da Rota `/admin`
**Como** administrador do portal,  
**quero** proteger a rota `/admin` e todos os endpoints administrativos com autenticação JWT,  
**para** garantir que apenas editores autenticados revisem, publiquem ou editem matérias.

**Critérios de Aceite:**
- **Dado** um usuário não autenticado ou com token JWT expirado/inválido,  
  **Quando** tenta acessar `/admin` ou qualquer endpoint `/api/v1/admin/**`,  
  **Então** a API retorna `401 Unauthorized` (ou `403 Forbidden` sem role editorial) e a UI redireciona/exibe a tela de login administrativo sem expor dados da fila editorial.
- **Dado** credenciais válidas submetidas no login administrativo,  
  **Quando** o usuário autentica com sucesso,  
  **Então** recebe sessão JWT válida, acessa as abas do `/admin` e pode encerrar sessão com invalidação/limpeza segura de token.

---

### US-5.2 — Aba Fila de Revisão (`PENDING_REVIEW`): Workbench Split-Screen
**Como** editor-chefe,  
**quero** comparar lado a lado a notícia original (com URL, excerto e logs de similaridade/IA) e o rascunho editável completo,  
**para** revisar fatos, tom de voz e atribuição antes de publicar.

**Critérios de Aceite:**
- **Dado** que existem artigos com status `PENDING_REVIEW`,  
  **Quando** o editor seleciona um item na Aba "Fila de Revisão",  
  **Então** o painel exibe à esquerda o painel de Origem (badge `source_name`, score de match se houver fontes cruzadas, `source_url` clicável com `target="_blank" rel="noopener noreferrer"`, título/excerto originais e logs da IA) e à direita o formulário editável.
- **Dado** o formulário editável do rascunho,  
  **Quando** o editor visualiza ou altera o item,  
  **Então** pode editar manchete, sub-bullets, lead, corpo completo, resumo de Reel (`reels_summary`), editoria, formato (`NEWS` / `COLUMN` / `REVIEW`), imagem de capa, flags (`is_main_headline`, `is_urgent`) e todos os campos de atribuição (`author_name`, `content_type`, `source_name`, `source_url`).
- **Dado** que `source_url` é alterada para um valor sem `http://` ou `https://`, ou algum campo obrigatório de atribuição fica vazio,  
  **Quando** o editor tenta salvar/aprovar,  
  **Então** o formulário e a API bloqueiam a ação com mensagem de validação explícita.

---

### US-5.3 — Ações da Fila de Revisão: Aprovar e Publicar, Agendar e Descartar
**Como** editor-chefe,  
**quero** aprovar para publicação imediata, agendar data/hora futura ou descartar um rascunho da fila,  
**para** controlar o ritmo editorial e manter apenas notícias relevantes no portal.

**Critérios de Aceite:**
- **Dado** um rascunho válido em `PENDING_REVIEW`,  
  **Quando** o editor clica em "Aprovar e Publicar",  
  **Então** o artigo transiciona para `PUBLISHED`, recebe `published_at = now()`, sai da fila `PENDING_REVIEW`, atualiza a revalidação pública (Home/Reels/Matéria) e exibe banner de confirmação com link para `/noticia/[slug]`.
- **Dado** que o editor seleciona data/hora futura válida (`scheduled_at > now()`) e clica em "Agendar",  
  **Quando** a ação confirma,  
  **Então** o artigo transiciona para `SCHEDULED` e será automaticamente promovido para `PUBLISHED` pelo agendador no horário definido (desde que passe na validação de atribuição).
- **Dado** que o editor clica em "Descartar" (com confirmação ou motivo opcional),  
  **Quando** confirma,  
  **Então** o artigo transiciona para `DISCARDED`, sai da fila `PENDING_REVIEW` e nunca aparece nas rotas públicas, mantendo registro para auditoria/deduplicação.

---

### US-5.4 — Aba Matérias Publicadas (`PUBLISHED` / `UNPUBLISHED`): Edição, Manchete Principal e Tirar do Ar
**Como** editor-chefe,  
**quero** gerenciar matérias já publicadas ou retiradas do ar para editar qualquer campo, alternar a Manchete Principal da capa e tirar do ar sem perder histórico,  
**para** corrigir informações rapidamente e manter a capa do portal sempre atual.

**Critérios de Aceite:**
- **Dado** a Aba "Matérias Publicadas" no `/admin`,  
  **Quando** carregada,  
  **Então** lista matérias com status `PUBLISHED` e `UNPUBLISHED` (com filtro por status/busca), exibindo título, editoria, status, indicador de Manchete Principal, `published_at` e métricas básicas (visualizações/curtidas).
- **Dado** que o editor abre uma matéria da aba para edição,  
  **Quando** altera qualquer campo (manchete, texto, resumo de Reel, imagem, categoria ou atribuição `author_name`/`content_type`/`source_name`/`source_url`) e salva,  
  **Então** as alterações são persistidas com registro de `updated_at`/`updated_by` e refletidas imediatamente nas páginas públicas (se `PUBLISHED`).
- **Dado** que o editor aciona "Definir como Manchete Principal" em uma matéria `PUBLISHED`,  
  **Quando** a API processa a solicitação,  
  **Então** define `is_main_headline = true` nessa matéria e atomicamente define `is_main_headline = false` na antiga Manchete Principal, garantindo unicidade na Home.
- **Dado** que o editor aciona "Tirar do ar" em uma matéria `PUBLISHED`,  
  **Quando** confirma a ação,  
  **Então** o status muda para `UNPUBLISHED`, a matéria desaparece imediatamente de `/`, `/reels` e `/noticia/[slug]` (retornando 404 público), **preservando integralmente** o registro no banco, métricas (`views`, `likes`, `saves`), comentários e histórico de auditoria (permitindo republicação futura se desejado).

---

## Épico 6 — Tema Claro/Escuro Persistente, Direção de Arte e Acessibilidade WCAG AA

Garantir excelência visual, zero ruído infantilizado de emojis e inclusão real para todos os perfis de leitores e editores.

### US-6.1 — Tema Claro/Escuro Nativo e Persistente
**Como** usuário do portal ou do painel admin,  
**quero** alternar entre Modo Claro (`#F6F4EE` / `#FFFFFF`) e Modo Escuro (`#0D0F14` / `#161922`) e ter minha escolha salva,  
**para** ler com conforto em qualquer ambiente sem clarão repentino ao recarregar a página.

**Critérios de Aceite:**
- **Dado** o botão de alternância de tema no cabeçalho global,  
  **Quando** o usuário clica ou aciona via teclado (`Enter`/`Space`),  
  **Então** alterna instantaneamente entre `light` e `dark`, atualiza `aria-pressed` / `aria-label` e ícone `lucide-react` (`Sun` / `Moon`) e persiste a preferência em `localStorage` (e/ou cookie para SSR).
- **Dado** um usuário que escolheu Modo Escuro e recarrega a página,  
  **Quando** o navegador renderiza o primeiro frame,  
  **Então** o tema escuro já está aplicado no elemento raiz (`data-theme="dark"` / classe `.dark`) antes da hidratação visual, evitando flash branco (FOUC).

---

### US-6.2 — Conformidade com Direção de Arte (Zero Emojis e Tipografia)
**Como** designer/product manager,  
**quero** assegurar zero emojis na UI, uso exclusivo de ícones vetoriais `lucide-react`, tipografia correta e piso de 11px,  
**para** manter a identidade editorial profissional do CritHit!.

**Critérios de Aceite:**
- **Dado** qualquer rota pública ou administrativa (`/`, `/reels`, `/noticia/[slug]`, `/admin`),  
  **Quando** inspecionada em auditoria visual e de DOM,  
  **Então** não existem emojis Unicode nos textos de UI, botões, títulos de seção, tickers ou alertas; todos os ícones são SVGs `lucide-react`.
- **Dado** os estilos computados de todos os elementos visíveis,  
  **Quando** verificados em desktop e mobile,  
  **Então** nenhum texto renderizado possui `font-size < 11px`, `Bangers` é usada apenas na marca e selos de impacto, `Plus Jakarta Sans` na leitura longa e `JetBrains Mono` em créditos/fontes/metadados.

---

### US-6.3 — Acessibilidade WCAG AA, Teclado e Redução de Movimento
**Como** usuário com deficiência visual, motora ou sensibilidade a movimento,  
**quero** navegar integralmente por teclado, ter contraste adequado e respeitar `prefers-reduced-motion`,  
**para** utilizar todas as funcionalidades do CritHit! sem barreiras.

**Critérios de Aceite:**
- **Dado** auditoria automatizada com `@axe-core/playwright` nas rotas `/`, `/reels`, `/noticia/[slug]` e `/admin` (em Modo Claro e Modo Escuro),  
  **Quando** executada em ambiente de QA,  
  **Então** reporta **0 violações críticas ou sérias** de WCAG 2.1 AA (incluindo contraste `>= 4.5:1` para texto normal e `>= 3:1` para texto grande/UI).
- **Dado** navegação exclusiva via teclado (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, setas nos Reels),  
  **Quando** o usuário percorre a aplicação,  
  **Então** todos os controles interativos recebem foco visível (`focus-visible`) em ordem lógica, sem armadilhas de foco (*keyboard traps*).
- **Dado** a tag `<meta name="viewport">`,  
  **Quando** verificada no HTML renderizado,  
  **Então** permite zoom do usuário (ausência de `user-scalable=no` e `maximum-scale=1`).
