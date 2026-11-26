# Tema WordPress Nativo — Teoria Geek (`v1.2.0`)

Tema WordPress editorial 100% nativo, autocontido e otimizado para Core Web Vitals, desenvolvido sob medida para o portal **Teoria Geek** (`teoriageek.com.br`) em substituição ao tema legado *Newspaper v12.6.2* (`td-composer` e `td-cloud-library`).

---

## 1. Requisitos e Compatibilidade

- **WordPress:** 6.2+ (testado e validado no **WordPress 6.9+**)
- **PHP:** 8.0+ (validado com zero warnings/deprecations no **PHP 8.3.37**)
- **Servidor:** Apache / LiteSpeed / Nginx (pronto para Locaweb, sem dependência de Node.js, npm ou build no servidor)
- **Plugins opcionais suportados nativamente (com fallback seguro quando ausentes):**
  - **Yoast SEO** (breadcrumbs nativos + supressão automática de OpenGraph/JSON-LD duplicados)
  - **Post Views Counter** (leitura otimizada de `wp_post_views` com Transients API de 15 min)
  - **Disqus** (comentários nativos do WP funcionam automaticamente caso o plugin não esteja ativo)
  - **Google Site Kit / AdSense** (slots dedicados sem CLS)

---

## 2. Principais Recursos do Tema

### Identidade Visual, Performance e Acessibilidade (WCAG 2.1 AA)
- **Identidade Azul e Amarelo customizável:** variáveis CSS em `:root` (`--tg-primary: #1D4ED8`, `--tg-accent: #FACC15`, `--tg-on-accent: #0B0F19`, `--tg-bg`, `--tg-surface`, `--tg-text`) injetadas via `wp_head` pelo Personalizador.
- **Logo oficial clássica embutida:** `assets/images/logo-teoria-geek.png` (`300x190`) e `logo-teoria-geek-footer.png` (`120x120`), substituíveis sem código em **Aparência > Personalizar**.
- **Modo Claro/Escuro sem flash (anti-FOUC):** script inline mínimo no `<head>` respeita preferência salva e `prefers-color-scheme`, com contraste WCAG 2.1 AA validado em ambos os modos (inclusive proteção contra spans legados com cores inline coladas do editor clássico).
- **Fontes 100% auto-hospedadas:** 14 arquivos `.woff2` (`Bangers`, `Barlow Condensed`, `Plus Jakarta Sans`, `Space Grotesk`, `JetBrains Mono`) em `assets/fonts/` com `font-display: swap` e `preload` das fontes críticas — zero requisições externas ao Google Fonts.
- **Core Web Vitals:** `fetchpriority="high"` na imagem Hero, `loading="lazy" decoding="async"` nos demais cards, `contain: layout style`, tratamento elegante para capas legadas pequenas (`< 520px`), WebP condicional no upload (`image_editor_output_format`) e `<script type="speculationrules">` nativo/fallback para prefetch.

### Recursos Editoriais Sem Bloat (Zero Plugins Extras)
- **Mais Lidas 24h / 7 dias:** consulta indexada em `wp_post_views` cacheada via Transients API (`15 min`), com alternância instantânea em abas e fallback automático.
- **Estreias da Semana:** faixa configurável no Personalizador (`30 min` de cache em transient) sem criar tabelas extras.
- **Hubs / Dossiês de Universo (`/universo/<slug>/`):** taxonomia nativa hierárquica `universo` com template dedicado (`taxonomy-universo.php`) para agrupar notícias, críticas e especiais de uma mesma franquia (ex.: *Marvel*, *Star Wars*, *GTA*, *DC*).
- **Alerta de Spoiler Nativo (`[spoiler]`):** shortcode sem JavaScript baseado em `<details class="tg-spoiler"><summary>...</summary></details>`:
  ```text
  [spoiler title="Spoiler do episódio final"]Texto protegido aqui.[/spoiler]
  ```
- **Reels Verticais (`/reels/`) e Facade na Home:** experiência editorial em 3 lâminas (Resumo, Pontos-Chave, Aprofundar) com API REST leve (`teoriageek/v1/reels` e `teoriageek/v1/search`), além de card vertical `3:4` na Home com *facade pattern* sob demanda (zero hospedagem de MP4).
- **Card "Próxima Matéria", Compartilhamento Mobile e Canais:** `navigator.share` nativo + WhatsApp + X + Salvar + Copiar link, card leve de próxima leitura no fim do artigo e bloco configurável de convite para Canal do WhatsApp / Telegram.
- **SEO & Dados Estruturados (`inc/seo.php`):** OpenGraph/Twitter Cards e JSON-LD dinâmico (`Review` com `reviewRating` para Críticas/Reviews e `NewsArticle` para matérias), desativados automaticamente se Yoast/RankMath/AIOSEO estiverem ativos.

### Compatibilidade com Acervo Legado (Newspaper / tagDiv)
- **Higienização em tempo de renderização (sem alterar o banco):** remove shortcodes órfãos `[vc_*]`, `[td_*]`, `[tdc_*]`, `[tdb_*]`, `[tdm_*]`, `[rbc_*]` preservando o conteúdo útil.
- **Preservação visual do acervo antigo:** estilização responsiva pronta para `.ficha`, `.rev-series`, `.rev-games`, `.capa`, `.col`, `.tit`, `.sinop`, `.div-selo`/`.selo` (com injeção de `alt` acessível) e `.youtube-embed`.
- **Resumos limpos:** remove blocos de "Ficha Técnica" dos excerpts exibidos na capa e arquivos.
- **Card de Nota automático:** lê a Ficha Editorial nativa, metadados `td_post_theme_settings` ou selos legados (`selo-teoria-geek-*-8|9|10.png`) e exibe o selo em destaque amarelo com alto contraste.
- **Proteção UTF-8:** reparo automático em tempo de renderização caso algum texto legado apresente mojibake CP850/UTF-8.

---

## 3. Configuração no Painel WordPress (100% Sem Código)

### Aparência > Personalizar
1. **Cores e Identidade — Teoria Geek:** ajuste nome do portal, logo para fundo escuro e as 5 cores da paleta (`--tg-primary`, `--tg-accent`, `--tg-bg`, `--tg-surface`, `--tg-text`).
2. **Categorias da Capa — Teoria Geek:** mapeie os slugs das editorias exibidas nos blocos da Home (`destaque`, `noticias`, `criticas`, `reviews`, `especial-teoria-geek` e as 5 colunas temáticas).
3. **Redes Sociais & Reels — Teoria Geek:** URLs oficiais (Instagram, YouTube, Spotify, Twitch, X/Twitter, Facebook) e texto do selo de curtida dupla nos Reels.
4. **Monetização & Anúncios — Teoria Geek:** cole os snippets dos slots `Topo` (abaixo da 1ª dobra), `Meio do Artigo` (após o 3º parágrafo) e `Sidebar` (todos com `min-height` reservado para CLS zero), além de configurar o selo editorial de **"Oferecimento"** por categoria.
5. **Estreias & Canais — Teoria Geek:** cadastre itens da faixa *Estreias da Semana* (`Título | Plataforma/Cinema | Data | URL opcional`, um por linha) e links do Canal do WhatsApp / Telegram.

### Editor de Posts (Meta Box "Ficha Editorial — Teoria Geek")
Disponível diretamente na edição de qualquer post, sem precisar de ACF:
- **Manchete Principal da Capa** (garante unicidade automática)
- **Exibir no Plantão Geek**
- **Formato Editorial** (`Notícia`, `Crítica`, `Review`, `Especial`, `Coluna`, `Guia`)
- **Nota (`0` a `10`)** + resumo opcional da avaliação
- **3 Pontos-Chave** (usados nos Reels e resumo editorial)
- **Crédito / Fonte externa** (opcional, validado estritamente como `http://` ou `https://`)

### Widgets & Menus
- **Menus (`Aparência > Menus`):** associe `Menu Principal do Cabeçalho` (`primary`) e `Menu do Rodapé` (`footer`). Caso não haja menu associado, o tema detecta automaticamente o menu existente `Menu Principal` (`menu-principal`).
- **Áreas de Widgets (`Aparência > Widgets`):** `tg-top-banner`, `tg-mid-article`, `tg-single-sidebar`, `tg-footer-widgets`.

---

## 4. Checklist de Virada para Produção (`teoriageek.com.br` — Locaweb)

Execute na ordem abaixo em janela de baixo tráfego:

1. **Backup completo:** faça backup do banco de dados MySQL e de `wp-content/` antes da troca.
2. **Upload do tema:** envie `dist/teoriageek-theme.zip` em **Aparência > Temas > Adicionar novo > Enviar tema** (ou descompacte em `wp-content/themes/teoriageek/`).
3. **Ativação e limpeza de plugins do Newspaper:**
   - Ative o tema **Teoria Geek**.
   - Desative os plugins proprietários do tema anterior: **`tagDiv Composer` (`td-composer`)**, **`tagDiv Cloud Library` (`td-cloud-library`)** e eventuais complementos `td-*` (não é necessário excluí-los imediatamente até validar tudo).
4. **Regeneração de Permalinks:** acesse **Configurações > Links Permanentes** e clique em **Salvar alterações** uma vez para registrar as rotas `/reels/` e `/universo/<slug>/`.
5. **Menus e Personalizador:**
   - Em **Aparência > Menus**, vincule o menu real do portal à posição **Menu Principal do Cabeçalho**.
   - Em **Aparência > Personalizar**, revise cores, redes sociais, slots de AdSense/Site Kit e (se desejado) *Estreias da Semana*, *Oferecimento* e canais de WhatsApp/Telegram.
6. **Regeneração de Miniaturas (Thumbnails):**
   - Execute a regeneração de miniaturas (via plugin *Regenerate Thumbnails* ou WP-CLI `wp media regenerate --only-missing`) para gerar os recortes otimizados `tg-hero` (`1200x675`), `tg-card` (`640x360`) e `tg-thumb` (`360x203`).
   - Novos uploads gerarão WebP automaticamente quando suportado pelo servidor PHP/GD/Imagick.
7. **Limpeza de Cache e CDN:**
   - Limpe o cache de página do WordPress (se usar WP Rocket / LiteSpeed / W3TC) e faça **Purge Everything** no **Cloudflare**.
   - Configure no Cloudflare cache de borda padrão para assets estáticos (`assets/fonts/*.woff2`, `assets/css/main.css`, `assets/js/*.js`) e *bypass* para `/wp-admin/*`, `/wp-login.php*` e `/?s=*`.
8. **Validação pós-virada:**
   - Teste Home (`/`), uma Crítica antiga (`.ficha` + selo de nota), uma Notícia recente com vídeo YouTube, `/reels/`, Busca (`/?s=marvel`), página 404 e Modo Claro/Escuro no Desktop e Mobile.
   - Verifique no PageSpeed Insights / Chrome DevTools que não há requisições externas ao Google Fonts, erros 404 de assets ou deslocamento de layout (CLS).
