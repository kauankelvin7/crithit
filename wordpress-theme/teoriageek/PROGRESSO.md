# Checkpoint de Desenvolvimento — Tema WordPress Nativo `teoriageek`

**Última atualização:** 2026-11-24  
**Objetivo:** Tema WordPress 100% nativo, autocontido em `/wordpress-theme/teoriageek/` (sem alterar `/apps/web` ou `/apps/api`), portando a estética editorial Pop-Art, Modo Claro/Escuro sem flash e Reels 2.0 para o portal **Teoria Geek** (`https://teoriageek.com.br/`), com operação 100% manual/sem código e empacotamento em `/dist/teoriageek-theme.zip`.

---

## Concluído até este Checkpoint

### Etapa 1 — Reconhecimento Somente Leitura (`teoriageek.com.br`) — 100% Concluída
- [x] Mapeamento das **25 categorias reais** via REST API (`noticias`, `games`, `filmes`, `series`, `destaque`, `animes-mangas`, `especial-teoria-geek`, `criticas`, `reviews`, `livros-hqs`, `musicas`, `eventos-shows-festivais`, `diversos`, etc.).
- [x] Mapeamento da paleta vigente (`#116EBF`, `#E29C04` / `#FFD600`, `#BE123C`), logos reais (`logo.png` `300x190`, `logo-footer.png` `120x120`) e links das 6 redes sociais oficiais.
- [x] Inspeção do HTML legado de Notícia (`194516`), Crítica (`194396`) e Review (`194050`): `.ficha` (`.rev-series`, `.rev-games`, `.capa`, `.col`, `.tit`, `.sinop`, `span[style*="#999"]`), `.div-selo` / `.selo`, `.youtube-embed` e `p.v1MsoNormal`.
- [x] Registro completo salvo em [`MIGRATION_AUDIT.md`](./MIGRATION_AUDIT.md).

### Etapa 2 — Base PHP e Painel Sem Código — Quase Concluída (85%)
- [x] `style.css` — Cabeçalho oficial do tema WordPress `Teoria Geek Editorial`.
- [x] `theme.json` — Paleta, tipografia e layout compatíveis com o editor de blocos (Gutenberg).
- [x] `functions.php` — Setup do tema, tamanhos de imagem (`tg-hero`, `tg-card`, `tg-thumb`), menus (`primary`, `footer`), 3 áreas de widgets/anúncios opcionais (`tg-top-banner`, `tg-single-sidebar`, `tg-footer-widgets`), script inline anti-FOUC no `<head>`, enqueue de fontes/CSS/JS e flush de rewrite rules na ativação.
- [x] `inc/helpers.php` — Helpers de rotas `/reels/`, validação `http(s)`, cálculo de contraste WCAG automático, paleta semântica para os 25 slugs reais, detecção automática de formato editorial, nota `0–10`, tempo de leitura, data relativa, contador de views/likes compatível com metas legadas, extrator automático de 3 pontos-chave para posts antigos, ícones SVG inline estilo Lucide (zero emojis) e arte Pop-Art SVG fallback.
- [x] `inc/customizer.php` — Painel `Aparência > Personalizar` (nome/logos, cores da marca com contraste automático, dropdowns dinâmicos para mapear categorias da capa, 6 redes sociais e texto do selo de curtida dupla nos Reels).
- [x] `inc/meta-boxes.php` — Meta Box nativa **"Ficha Editorial — Teoria Geek"** no editor de posts (Manchete Principal única, Plantão, Formato, Nota `0–10`, 3 Pontos-Chave e Crédito/Fonte externa opcional) com proteção via `wp_verify_nonce` e `current_user_can`.
- [x] `inc/template-tags.php` — Badges coloridos, breadcrumb acessível, menu fallback, paginação editorial, renderização de logo e consulta `teoriageek_get_most_read_posts()`.
- [ ] `inc/reels-api.php` — Rewrite rule `/reels/`, `template_include` para `page-reels.php` e endpoints REST `teoriageek/v1` (`GET /reels`, `POST /posts/{id}/like`, `POST /posts/{id}/view`, `POST /posts/{id}/comment`).

---

## O Que Falta Fazer na Próxima Sessão

### Etapa 3 — Templates Públicos & Compatibilidade Total com o Acervo Antigo
- [ ] `template-parts/cover-media.php` (foto destacada 16:9 + fallback SVG Pop-Art).
- [ ] `template-parts/breaking-ticker.php` (faixa deslizante `Plantão` full-bleed com fade suave nas bordas).
- [ ] `template-parts/card-article.php` e `template-parts/card-compact.php`.
- [ ] `header.php` (barra social discreta + cabeçalho sticky com Menu Nativo WP + dropdowns + busca sem duplo `×` + toggle Claro/Escuro + botão `Reels` + ticker `Plantão` + área opcional `tg-top-banner`).
- [ ] `footer.php` (chrome escuro, editorias, redes sociais, widget opcional `tg-footer-widgets`, `wp_footer()`).
- [ ] `front-page.php` (1ª dobra sem repetição via `$used_post_ids`: Hero + 3 secundárias + Reels em Destaque + Últimas; blocos Giro de Notícias, Críticas & Reviews com selo de nota, Especiais & Colunas, Editorias em Destaque e Mais Lidas).
- [ ] `single.php` (breadcrumb, badges, selo de nota, leitura estimada, avatar/bio nativos, Curtir/Salvar/Compartilhar/`Ver em Reels`, estilização de `.ficha`/`.div-selo`/`.youtube-embed`, sidebar sem duplicar capa e `comments_template()`).
- [ ] `page.php`, `archive.php`, `search.php`, `index.php`, `404.php` e `comments.php`.

### Etapa 4 — Reels 2.0 Nativo no WordPress
- [ ] `inc/reels-api.php` (rewrite `/reels/` + REST API `teoriageek/v1` com validação de nonce e respeito à moderação nativa de comentários do WP).
- [ ] `page-reels.php` (layout Desktop em 3 zonas + Mobile tela cheia com snap vertical exato, abas `Para Você | Em Alta | Salvos`, filtro de categorias e drawer de comentários 100% escuro).
- [ ] `assets/js/main.js` (Claro/Escuro persistente, menu mobile/submenus, Curtir/Salvar/Compartilhar/View tracking no `single.php`).
- [ ] `assets/js/reels.js` (Vanilla JS: 3 lâminas Micro-Stories, atalhos `↑` `↓` `←` `→` `L` `C`, double-tap com selo Pop-Art configurável, paginação REST e comentários inline/drawer).

### Etapa 5 — Design System (Tailwind CSS) & Empacotamento `.zip`
- [ ] `src/css/input.css`, `tailwind.config.cjs` e `package.json` próprio do tema (tokens Light/Dark de `/apps/web` + estilização completa do HTML legado `.ficha`, `.div-selo`, `.youtube-embed`, `.v1MsoNormal`).
- [ ] Compilar `assets/css/main.css` via Tailwind CLI (sem CDN externa).
- [ ] `scripts/package-theme.mjs` para compilar CSS/JS e gerar `/dist/teoriageek-theme.zip` com pasta raiz `teoriageek/style.css` (excluindo `node_modules` e fontes de build).

### Etapa 6 — Validação Final & Entrega
- [ ] Auditoria sintática de todos os arquivos `.php` (`php -l` se disponível ou auditoria estática rigorosa de tags, fechamentos e escaping WP).
- [ ] Validação de build CSS/JS, integridade do `/dist/teoriageek-theme.zip`, WCAG 2.1 AA, zero emojis na UI e zero termos técnicos (`9:16`).
- [ ] Entregar checklist de 5 passos para instalação do `.zip` no **LocalWP**.
