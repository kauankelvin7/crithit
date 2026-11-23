# CritHit! — Visão do Produto, Tom de Voz, Atribuição e Direção de Arte

**Versão:** 1.0  
**Status:** Aprovado para Fase 1 (Produto & Documentação)  
**Público-alvo:** Produto, Engenharia Backend/Frontend, Design e Redação

---

## 1. Visão do Produto

O **CritHit!** é um portal independente de jornalismo geek que une a velocidade do radar internacional e nacional de notícias com o rigor de uma redação humana.

Enquanto agregadores automáticos despejam traduções literais sem contexto e portais tradicionais sofrem com poluição visual e títulos sensacionalistas (*clickbait*), o CritHit! opera com um modelo **Human-in-the-Loop**: um pipeline automatizado coleta feeds RSS (nacionais e internacionais), agrupa notícias equivalentes por similaridade semântica (`pgvector`), gera um rascunho estruturado em português brasileiro e submete tudo a um editor humano antes de qualquer publicação.

### 1.1 Proposta de Valor

| Público | Dor Atual | Proposta de Valor do CritHit! |
| :--- | :--- | :--- |
| **Leitor Casual / Mobile-first** | Matérias longas cheias de enrolação para reter cliques, pop-ups invasivos e dificuldade de acompanhar novidades rápidas no celular. | Experiência **CritHit Reels (9:16)** em tela cheia, resumos diretos em tópicos na capa e leitura limpa sem anúncios intrusivos. |
| **Leitor Geek Hardcore** | Notícias repetidas sobre o mesmo vazamento/anúncio, falta de crédito à fonte primária e textos mal traduzidos por robôs. | Cobertura unificada (fontes BR e internacionais cruzadas), atribuição transparente com link direto para a fonte original e linguagem técnica correta. |
| **Redação / Editor-Chefe** | Sobrecarga para monitorar dezenas de sites em inglês e português simultaneamente e formatar conteúdos para web e formato curto vertical. | Fila editorial única (`PENDING_REVIEW`) com comparação lado a lado entre fonte original e rascunho adaptado, pronta para revisão, agendamento ou publicação. |

---

## 2. Personas do Produto

### Persona 1 — Lucas, "Leitor Casual / Mobile-first" (23 anos)
- **Perfil:** Estudante e analista júnior que acompanha jogos populares, animes da temporada e estreias de cinema/streaming pelo celular durante o trajeto no transporte público.
- **Comportamento:** Consome conteúdo em janelas de 2 a 5 minutos. Prefere deslizar verticalmente pelo feed de **Reels (`/reels`)**, salvar matérias para ler depois e clicar apenas quando um assunto realmente chama atenção.
- **Necessidades:** Carregamento rápido em rede móvel, navegação fluida com uma mão (scroll-snap vertical), zero poluição visual e leitura confortável em Modo Escuro à noite.

### Persona 2 — Marina, "Leitora Geek Hardcore" (31 anos)
- **Perfil:** Desenvolvedora sênior, leitora assídua de HQs/mangás e jogadora de RPGs/PC. Acompanha portais estrangeiros (IGN, Eurogamer, Kotaku, Bleeding Cool, Anime News Network) e brasileiros.
- **Comportamento:** Checa a **Home (`/`)** pela manhã (Plantão Geek e Giro Geek), lê análises e matérias completas (`/noticia/[slug]`), verifica sempre quem apurou a informação original e abandona imediatamente sites com *clickbait* ou erros de terminologia.
- **Necessidades:** Atribuição explícita da fonte original, distinção clara entre conteúdo autoral e curadoria, profundidade editorial sem enrolação e busca rápida por temas ou editorias.

### Persona 3 — Rafael, "Editor-Chefe / Revisor Human-in-the-Loop" (36 anos)
- **Perfil:** Jornalista especializado em cultura pop e tecnologia responsável pela curadoria final, definição da manchete de capa e publicação diária do portal.
- **Comportamento:** Acessa o **Painel Admin (`/admin`)** várias vezes ao dia para esvaziar a fila `PENDING_REVIEW`, corrigir nuances de tradução que a IA não captou, cruzar múltiplas fontes sobre o mesmo evento, promover a Manchete Principal da Home e retirar do ar matérias caso uma fonte primária publique correção.
- **Necessidades:** Interface split-screen clara (fonte original + métricas de cruzamento de um lado, formulário editável do outro), validação automática de campos obrigatórios de crédito e controle seguro de estados sem perda de histórico.

---

## 3. Manual de Tom de Voz Editorial

O CritHit! escreve **de fã informado para fã informado**, mantendo rigor jornalístico. O texto deve soar como uma conversa inteligente de redação: ágil, preciso, contextualizado e honesto com o leitor.

### 3.1 Pilares do Tom de Voz
1. **Jornalístico e humano:** Responde "o quê, quem, quando, onde e por quê" logo no primeiro parágrafo (lead), sem rodeios de SEO artificial.
2. **Direto e próximo do leitor geek:** Domina corretamente termos do universo (ex.: *frame rate*, *nerf*, *showrunner*, *one-shot*, *retcon*, *port*, *crossover*) sem explicá-los de forma condescendente nem abusar de gírias forçadas.
3. **Zero clickbait:** Nunca oculta o sujeito ou a informação central da manchete para forçar o clique.
4. **Zero jargão robótico de IA:** Proíbe muletas como *"Em um mundo onde..."*, *"Prepare-se para..."*, *"É importante notar que..."*, *"Mergulhe fundo..."*, *"Neste artigo veremos..."* ou conclusões genéricas vazias.

### 3.2 Guia Prático: O que Fazer vs. O que Evitar

| Elemento | O que EVITAR (Clickbait / Robótico) | O que FAZER (Padrão CritHit!) |
| :--- | :--- | :--- |
| **Manchete (Games)** | *"Você NÃO vai acreditar no que a Capcom acabou de anunciar sobre este clássico!"* | *"Capcom confirma remake de Dino Crisis para 2027 com motor RE Engine"* |
| **Manchete (Cinema/Séries)** | *"O motivo chocante pelo qual o diretor deixou a série da HBO vai te surpreender"* | *"Showrunner deixa produção de House of the Dragon antes da 4ª temporada por divergências criativas"* |
| **Lead / Abertura** | *"No cenário atual dos videogames, os fãs aguardavam ansiosamente novidades. Hoje, finalmente, o estúdio revelou..."* | *"A Larian Studios confirmou nesta terça-feira (24) que não trabalha em DLCs para Baldur's Gate 3 e já concentra a equipe em dois novos RPGs."* |
| **Bullets de Resumo** | *"Um anúncio incrível que vai mudar tudo na indústria dos quadrinhos!"* | *"Série mensal terá 12 edições fechadas; lançamento nos EUA em julho; roteiro de Ram V e arte de Evan Cagle."* |
| **Chamada de Reel (9:16)** | *"Fica até o final para descobrir a bomba!!"* | *"GTA VI ganha segundo trailer focado em Lucia; confira os 4 detalhes confirmados no mapa."* |
| **Nota de Opinião / Review** | *"Um jogo absolutamente revolucionário que redefine o conceito de diversão."* | *"Com combate tático preciso e ritmo irregular no ato final, Metaphor entrega 80 horas consistentes — mas exige paciência com a interface."* |

---

## 4. Regras Inegociáveis de Atribuição Jornalística e Transparência

Nenhuma matéria — seja na Home, no leitor completo, nos Reels ou na API pública — pode ser publicada ou exibida sem atribuição completa e verificável.

### 4.1 Campos Obrigatórios em 100% das Matérias

| Campo | Tipo / Valores Permitidos | Regra de Negócio |
| :--- | :--- | :--- |
| `author_name` | String não vazia (mín. 2 caracteres) | Nome do jornalista/editor responsável pela matéria ou adaptação (ex.: *"Rafael Mendes"* ou *"Redação CritHit!"*). |
| `content_type` | Enum: `AUTORAL` \| `CURADORIA` | Classifica se a apuração é original da redação (`AUTORAL`) ou adaptada a partir de veículo parceiro/externo (`CURADORIA`). |
| `source_name` | String não vazia | Nome legível do veículo ou instituição de origem (ex.: *"IGN US"*, *"Eurogamer"*, *"Omelete"*, *"CritHit! Redação"*). |
| `source_url` | URL absoluta validada | Aceita **exclusivamente** protocolos `http://` ou `https://`. Proibido aceitar `javascript:`, `data:`, `file:`, URLs relativas ou strings vazias. |

### 4.2 Regras de Renderização e Transparência
1. **Link externo seguro:** Todo link renderizado para `source_url` deve abrir em nova aba com proteção contra *reverse tabnabbing*:
   ```html
   target="_blank" rel="noopener noreferrer"
   ```
2. **Selo visível de tipo de conteúdo:** A página de matéria (`/noticia/[slug]`) e o card de detalhe exibem de forma clara se o conteúdo é `AUTORAL` ou `CURADORIA`, acompanhado de `author_name` e `source_name`.
3. **Nota discreta de transparência em `CURADORIA`:** Toda matéria com `content_type = CURADORIA` deve exibir uma nota editorial padronizada e discreta abaixo do cabeçalho ou ao final do texto:
   > *"Transparência editorial: esta matéria foi adaptada para o português pela redação do CritHit! a partir da apuração original publicada por [source_name], com revisão humana antes da publicação."*
4. **Fontes cruzadas:** Quando a deduplicação semântica agrupar múltiplas coberturas sobre o mesmo fato, a fonte primária permanece em `source_name`/`source_url` e as fontes complementares podem ser listadas com os mesmos critérios de validação de URL e `rel="noopener noreferrer"`.

---

## 5. Requisitos de Direção de Arte & Acessibilidade

O CritHit! adota uma estética **editorial contemporânea com DNA sutil de quadrinhos e jornal impresso**: leitura limpa, grid organizado de portal de notícias de alta densidade informativa, combinado com traços gráficos marcantes (bordas definidas, selos de editoria e textura sutil de papel/meio-tom) que não prejudicam a legibilidade.

### 5.1 Política de Ícones e Proibição de Emojis
- **Zero emojis na interface:** É estritamente proibido utilizar caracteres emoji (ex.: `⚡`, `🔥`, `🎁`, `🎮`, `🌙`, `❌`, `🚀`) em qualquer elemento da interface do usuário — incluindo botões, navegação, títulos de seção, badges, tickers, alertas, toasts, estados vazios e rodapé.
- **Ícones vetoriais exclusivos:** Toda a iconografia da UI utiliza exclusivamente a biblioteca **`lucide-react`** com `strokeWidth` padronizado (`2` em ícones de ação/navegação e `1.75` em metadados e indicadores auxiliares) e `aria-hidden="true"` quando puramente decorativo.

### 5.2 Regra de Cores 60-30-10 e Temas Persistentes

O portal oferece suporte nativo e persistente (com detecção inicial sem *flash* de tema errado e salvamento de preferência) aos modos **Claro** e **Escuro**:

| Camada (Regra 60-30-10) | Modo Claro (Padrão Editorial Papel) | Modo Escuro (Leitura Noturna) | Função Visual |
| :--- | :--- | :--- | :--- |
| **60% — Base / Fundo** | `#F6F4EE` (Papel quente suave) | `#0D0F14` (Grafite profundo) | Fundo geral das páginas e respiro entre blocos |
| **30% — Superfícies / Cards** | `#FFFFFF` (Branco puro) | `#161922` (Superfície elevada) | Cards de notícias, formulários, modais e painéis |
| **10% — Acentos & Marca** | Marca `#E11D48` (CritRed), tinta `#111111`, editorias (`#2563EB` Games, `#B45309` Quadrinhos, `#047857` Cinema, `#7C3AED` Tech) | Marca `#F43F5E`, tinta `#F4F4F5`, editorias ajustadas (`#60A5FA` Games, `#FBBF24` Quadrinhos, `#34D399` Cinema, `#A78BFA` Tech) | CTAs, selos de editoria, indicadores de urgência, foco e bordas |

### 5.3 Tipografia Dedicada

| Família | Papel Exclusivo | Regras de Uso |
| :--- | :--- | :--- |
| **Bangers** | Identidade da marca `CRITHIT!` e selos de impacto pontuais (ex.: selo `PLANTÃO GEEK`, selo de nota/selo `REELS`) | Proibido usar em parágrafos, listas de links, formulários, corpo de notícias ou textos longos para preservar a legibilidade. |
| **Barlow Condensed / Space Grotesk** | Manchetes, títulos de seção, itens de menu e rótulos de interface | `Barlow Condensed` para impacto editorial em manchetes de capa; `Space Grotesk` para subtítulos, botões e componentes de UI. |
| **Plus Jakarta Sans** | Leitura longa | Corpo de artigos (`/noticia/[slug]`), leads, resumos de colunas, citações e descrições de cards. |
| **JetBrains Mono** | Metadados e transparência | Créditos (`author_name`), `source_name`, timestamps, tempo de leitura, badges de status editorial e scores de similaridade no Admin. |

### 5.4 Requisitos Inegociáveis de Acessibilidade (WCAG AA)
1. **Contraste mínimo:** Todos os textos normais e metadados devem atingir razão de contraste **>= 4.5:1**; textos grandes (>= 18pt ou >= 14pt negrito) e elementos gráficos de UI/bordas interativas devem atingir **>= 3:1**, tanto no Modo Claro quanto no Modo Escuro.
2. **Piso tipográfico:** Nenhum texto visível na interface (incluindo badges, timestamps e notas de rodapé) pode ter tamanho inferior a **`11px`**.
3. **Zoom habilitado:** É **estritamente proibido** utilizar `user-scalable=no` ou `maximum-scale=1.0` na tag `<meta name="viewport">`. O usuário deve poder ampliar a página até 200%+ sem quebra horizontal crítica.
4. **Navegação completa por teclado:** Todos os elementos interativos (links, cards clicáveis, filtros, botões de curtir/salvar, modal de comentários, controles do Admin e alternador de tema) devem ser operáveis via `Tab`/`Shift+Tab`, `Enter`/`Space` e setas (nos Reels), com anel de foco visível (`:focus-visible`).
5. **Respeito a `prefers-reduced-motion`:** Quando o sistema operacional indicar preferência por movimento reduzido, animações contínuas (como o scroll automático do ticker Plantão Geek, transições de hover e pulsos de status) devem ser pausadas ou reduzidas a transições instantâneas/discretas.
6. **Semântica HTML e Leitores de Tela:** Uso adequado de landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`), hierarquia única de `<h1>` por rota, `alt` descritivo em imagens editoriais e `aria-label` claro em botões apenas com ícone `lucide-react`.
