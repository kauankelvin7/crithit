# Auditoria de Migração — Teoria Geek (`teoriageek.com.br`)

Levantamento técnico somente leitura realizado via `GET` na REST API pública (`/wp-json/wp/v2/categories`, `/wp-json/wp/v2/posts`) e no HTML público da capa e de matérias recentes do portal **Teoria Geek** antes da implementação do tema nativo `teoriageek`.

---

## 1. Taxonomia & Categorias Ativas (25 categorias mapeadas)

| ID | Slug Real | Nome Exibido | Categoria Pai | Posts | Uso no Novo Tema |
| :--- | :--- | :--- | :--- | ---: | :--- |
| `37` | `noticias` | NOTÍCIAS | — | 11.785 | Plantão (ticker) & Giro de Notícias |
| `18` | `games` | GAMES | — | 5.619 | Editoria principal (cor azul) |
| `56` | `filmes` | FILMES | — | 4.557 | Editoria principal (cor esmeralda) |
| `35` | `series` | SÉRIES | — | 2.500 | Editoria principal (cor teal/esmeralda) |
| `7417` | `destaque` | DESTAQUE | — | 1.360 | Manchete Principal & Destaques da Capa |
| `62` | `animes-mangas` | ANIMES & MANGÁS | `diversos` (`20716`) | 652 | Editoria principal (cor ciano) |
| `36` | `especial-teoria-geek` | ESPECIAIS | `diversos` (`20716`) | 578 | Seção Especiais & Colunas (*Inventário Geek*, *Ciência Geek*) |
| `7418` | `criticas` | CRÍTICAS | — | 557 | Seção Críticas & Reviews |
| `5482` | `reviews` | REVIEWS | — | 439 | Seção Críticas & Reviews |
| `1` | `categorias` | CATEGORIAS | — | 398 | Legado / agrupador genérico |
| `20716` | `diversos` | DIVERSOS | — | 382 | Agrupador de subeditorias |
| `29` | `livros-hqs` | LITERATURA & HQs | `diversos` (`20716`) | 374 | Editoria principal (cor âmbar) |
| `70` | `musicas` | MÚSICAS | `diversos` (`20716`) | 200 | Subeditoria (cor violeta) |
| `22934` | `eventos-shows-festivais` | EVENTOS, SHOWS & FESTIVAIS | — | 175 | Cobertura de eventos (ex.: CCXP) |
| `22729` | `games-filmes-series-eventos` | DICAS | — | 47 | Listas e recomendações |
| `22119` | `esportes-futebol-games-e-sports-vloley-basquete` | ESPORTES | — | 21 | Agrupador de esportes |
| `22121` | `e-sports-esports` | eSports | `22119` | 11 | Subeditoria Esportes |
| `22120` | `futebol` | FUTEBOL | `22119` | 8 | Subeditoria Esportes |
| `24089` | `hands-on` | Hands On | — | 8 | Impressões iniciais |
| `22122` | `outros-esportes` | OUTROS ESPORTES | `22119` | 8 | Subeditoria Esportes |
| `22443` | `retro` | RETRÔ | — | 7 | Cultura retrô |
| `23300` | `entrevista` | ENTREVISTA | — | 5 | Entrevistas |
| `22730` | `platina-trofeus-ps5-ps4-xbox-nintendo-games-pc` | GUIA DE TROFÉUS | — | 4 | Guias de platina |
| `24908` | `uncategorized` | uncategorized | — | 3 | Sem categoria |
| `24083` | `perifericos` | PERIFÉRICOS | — | 2 | Hardware e periféricos |

> **Observação crítica de migração:** Os slugs reais em produção são `animes-mangas`, `livros-hqs` e `especial-teoria-geek` (em vez de `animes-e-mangas`, `literatura-e-hqs` e `especiais`). Todos os padrões do Personalizador (`inc/customizer.php`) já vêm pré-mapeados com esses slugs exatos para exibir conteúdo imediatamente após a ativação do tema.

---

## 2. Identidade Visual Atual, Logo e Redes Sociais

- **Tema anterior identificado:** `Newspaper` v12.6.2 (com `td-composer`, `td-cloud-library`, `post-views-counter`, `page-views-count`, `google-site-kit`).
- **Paleta de cores vigente:**
  - Azul primário da marca: `#116EBF` (variações `#1E73BE` / `#4DB2EC`) — contraste `5.23:1` com branco (aprovado WCAG 2.1 AA).
  - Dourado/âmbar de destaque: `#E29C04` (harmonizado no novo tema com o amarelo Pop-Art `#FFD600` sobre tinta `#111111`, contraste `14.5:1`).
  - Acento editorial / plantão: `#CE0000` / `#BE123C`.
  - Superfícies escuras / chrome: `#111318`, `#333145`, `#000000`.
  - Superfícies claras: `#F6F4EE` (papel impresso editorial) e `#FFFFFF`.
- **Logotipos encontrados no acervo de mídia:**
  - Logo principal (cabeçalho): `https://teoriageek.com.br/wp-content/uploads/2024/03/logo.png` — **`300x190 px`** (proporção `1.58:1`).
  - Logo compacta (rodapé): `https://teoriageek.com.br/wp-content/uploads/2024/03/logo-footer.png` — **`120x120 px`** (proporção `1:1`).
- **Redes sociais oficiais mapeadas:**
  - **Facebook:** `https://www.facebook.com/TeoriaGeeks`
  - **Instagram:** `https://www.instagram.com/teoria.geek`
  - **Spotify:** `https://open.spotify.com/show/5MJY6UjHHW6Gne68xfw3Rz`
  - **Twitch:** `https://www.twitch.tv/teoriageekgames`
  - **X / Twitter:** `https://twitter.com/teoriageeks`
  - **YouTube:** `https://www.youtube.com/channel/UCgZV_gtBut_mNmFQtIx9KEQ`

---

## 3. Anatomia do HTML Interno de Posts Antigos (Compatibilidade Garantida)

### 3.1 Notícia Recente (ID `194516` — *Marvel Studios | Vingadores: Doutor Destino*)
- **Estrutura:** parágrafos `<p>`, imagens centralizadas (`img.aligncenter`, `size-full wp-image-*`), tags `<b>` / `<i>` e embed de trailer `<iframe>`.
- **Peculiaridades legadas encontradas:**
  - Classe `v1MsoNormal` e atributos `style="text-align: justify;"` / `align="center"` vindos de colagem do Word/e-mail.
  - **Tratamento no tema:** reset tipográfico limpo em `.entry-content p.v1MsoNormal`, alinhamento à esquerda em telas móveis para evitar espaçamentos excessivos, `max-width: 100%; height: auto;` em todas as imagens e wrapper responsivo `16:9` para `iframe`.

### 3.2 Crítica Recente (ID `194396` — *VisionQuest | Confira nossa crítica*)
- **Estrutura:** parágrafo introdutório + bloco legado **Ficha Técnica** + subtítulos `<h2>` + imagens intercaladas + **Selo gráfico de veredito** + embed do YouTube.
- **Classes legadas críticas identificadas:**
  - `.ficha.rev-series` (também existem `.rev-games`, `.rev-filmes`, `.rev-livros`, `.rev-animes`), contendo:
    - `.capa` (pôster vertical da obra)
    - `.col` com `.tit` (`Ficha Técnica`) e `<table><tbody><tr><th scope="row"><strong>Campo:</strong> <span style="color: #999999;"><em>Valor</em></span></th></tr></tbody></table>`
    - `.sinop` (tabela de sinopse em largura total abaixo da ficha)
  - `.div-selo` contendo `<img class="selo sombra-menino-verde aligncenter" ...>` e chamada para categoria.
  - `.youtube-embed` envolvendo `<iframe>` de `696x392`.
- **Tratamento no tema:**
  - Estilização completa em `assets/css/main.css` para `.entry-content .ficha` como card editorial responsivo em grid (pôster à esquerda + dados à direita no desktop, empilhado no mobile), com override de contraste para `span[style*="#999"]` tanto no Modo Claro quanto no Modo Escuro.
  - `.entry-content .div-selo` centralizado com espaçamento editorial e suporte limpo para a imagem `.selo` sem distorção.
  - `.entry-content .youtube-embed` com `aspect-ratio: 16 / 9` e `width: 100%` para zero overflow horizontal em `390px`.

### 3.3 Review Recente (ID `194050` — *The Crew Motorfest (Nintendo Switch 2)*)
- **Estrutura:** inicia diretamente com `<div class="ficha rev-games" style="width: 100%;">` (sem `.sinop`), seguido de parágrafos com `data-pm-slice="1 1 []"`, subtítulos `<h2>` temáticos, `.div-selo` e trailer.
- **Imagens destacadas:** quase 100% dos posts recentes possuem fotos reais `16:9` (ex.: `1280x720`, `1600x898`, `2560x1440`). Para posts muito antigos sem imagem destacada, o tema fornece fallback SVG Pop-Art automático pela editoria.
- **Shortcodes legados:** nenhum shortcode `td_*` ou de terceiros foi encontrado no corpo dos posts inspecionados (o `td-composer` atuava apenas na montagem da Home e templates do tema Newspaper).

---

## 4. Recomendações Pós-Ativação no WordPress
1. Em **Configurações > Links Permanentes**, clique em **Salvar alterações** uma vez (o tema já dispara `flush_rewrite_rules()` na ativação para registrar `/reels/`, mas salvar confirma o `.htaccess`).
2. Em **Aparência > Menus**, atribua o menu principal existente do Teoria Geek à posição **Menu Principal do Cabeçalho** (com suporte nativo a submenus dropdown).
3. Plugins legados exclusivos do tema anterior (`td-composer`, `td-cloud-library`, `td-standard-pack`, `td-newsletter`) podem ser desativados com segurança após testar no ambiente local (LocalWP) para máxima velocidade.
