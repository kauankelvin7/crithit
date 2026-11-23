# CritHit! — Design System, Tokens CSS e Especificação de Acessibilidade (WCAG 2.1 AA)

**Versão:** 1.0  
**Status:** Aprovado para Fase 2 (Arquitetura & Design System)  
**Stack Alvo:** Next.js (App Router) + TypeScript + Tailwind CSS + `lucide-react`  
**Referências:** [01-visao-produto.md](./01-visao-produto.md) | [02-epicos-e-historias.md](./02-epicos-e-historias.md) | [03-regras-de-negocio-e-fluxos.md](./03-regras-de-negocio-e-fluxos.md)

---

## 1. Direção de Arte e Princípios Visuais

O Design System do **CritHit!** traduz uma estética **editorial contemporânea com DNA sutil de quadrinhos e jornal impresso**:
- **Estrutura de portal jornalístico de alta densidade informativa** (capa escaneável, hierarquia tipográfica clara, blocos por editoria e leitura longa confortável).
- **Traços táteis de HQ e papel impresso** sem poluição visual: bordas bem definidas (`--border-strong`), sombras duras sutis (`--shadow-hard`), selos inclinados de editoria (`-skew-x-6` pontual) e retícula *halftone* de baixíssima opacidade (`--halftone-dot`).
- **Regra 60-30-10 rigorosa** nos modos Claro (Papel Couché) e Escuro (Tinta Nanquim), garantindo que os acentos semânticos das editorias nunca compitam com a legibilidade do texto.
- **Zero emojis na interface**: toda expressão visual auxiliar utiliza exclusivamente ícones vetoriais `lucide-react` e tipografia editorial.

---

## 2. Arquitetura de Cores (Regra 60-30-10) e Tokens CSS

### 2.1 Distribuição 60-30-10

| Camada | Proporção | Modo Claro (`light` — Papel Couché) | Modo Escuro (`dark` — Tinta Nanquim) | Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **Base** | **60%** | `#F6F4EE` (`--bg-base`) | `#0D0F14` (`--bg-base`) | Fundo global da página, respiro entre seções e textura *halftone* sutil |
| **Superfície** | **30%** | `#FFFFFF` (`--bg-surface`)<br>`#EFECE3` (`--bg-surface-alt`) | `#161922` (`--bg-surface`)<br>`#1E2330` (`--bg-surface-alt`) | Cards de notícias, formulários, modais/drawers, tabelas do Admin, boxes de contexto |
| **Acentos & Tinta** | **10%** | Tinta `#111111`, CritRed `#BE123C`/`#E11D48`, HeroYellow `#FFD600`, acentos de editoria | Tinta `#F4F4F5`, CritRed `#FB7185`/`#BE123C`, acentos anti-vibração calibrados | CTAs, selos de editoria, indicadores de status, bordas impressas e anéis de foco |

> **Superfícies Estruturais Fixas (Chrome):** A barra superior (`Topbar`), o rodapé institucional (`Footer`) e o container imersivo de Reels (`/reels`) usam superfície escura dedicada (`--chrome-bg: #111318`, `--scrim-reels: #090A0F`) em ambos os temas para ancorar a navegação editorial e garantir contraste contínuo sobre mídias verticais.

### 2.2 Tokens CSS Completos (`app/globals.css`)

```css
/* ==========================================================================
   CRITHIT! DESIGN TOKENS — MODO CLARO (PADRÃO) & MODO ESCURO
   ========================================================================== */

:root,
[data-theme="light"] {
  color-scheme: light;

  /* 1. Camada 60% — Base */
  --bg-base: #F6F4EE;            /* Papel Couché quente */
  --halftone-dot: rgba(17, 17, 17, 0.055);
  --halftone-size: 12px;

  /* 2. Camada 30% — Superfícies */
  --bg-surface: #FFFFFF;         /* Superfície primária (cards, inputs, modais) */
  --bg-surface-alt: #EFECE3;     /* Superfície secundária (ticker, boxes, zebra) */
  --bg-surface-hover: #E7E2D6;   /* Hover sutil em superfícies neutras */

  /* Superfícies Estruturais Escuras (Topbar / Footer / Scrim Reels) */
  --chrome-bg: #111318;
  --chrome-surface: #1A1D26;
  --chrome-ink: #F4F4F5;
  --chrome-ink-muted: #B4B6C2;
  --scrim-reels: #090A0F;

  /* 3. Tipografia & Tinta (Ink) */
  --ink-primary: #111111;        /* Títulos, corpo principal */
  --ink-secondary: #3F3F46;      /* Leads, descrições, subtítulos */
  --ink-muted: #55555F;          /* Metadados, timestamps (>= 6.24:1 em todos fundos claros) */
  --ink-placeholder: #5C5C66;    /* Placeholders de input (>= 5.59:1) */
  --ink-inverse: #FFFFFF;        /* Texto sobre --fill-* escuros */
  --ink-on-highlight: #111111;   /* Texto sobre --highlight-comic (#FFD600) */

  /* 4. Bordas Impressas, Sombras & Foco */
  --border-strong: #111111;      /* Borda editorial/HQ de cards e botões */
  --border-input: #767268;       /* Borda neutra de inputs (>= 4.36:1 contra #F6F4EE / 4.80:1 contra #FFFFFF) */
  --border-subtle: #D4CFC3;      /* Divisores decorativos internos */
  --focus-ring: #1D4ED8;         /* Anel :focus-visible em superfícies claras (>= 5.67:1) */
  --focus-ring-dark: #FFD600;    /* Anel :focus-visible sobre chrome escuro (>= 13.16:1) */

  --shadow-hard-sm: 2px 2px 0px #111111;
  --shadow-hard: 4px 4px 0px #111111;
  --shadow-hard-hover: 6px 6px 0px #111111;

  /* 5. Camada 10% — Acentos de Marca & Editorias */
  /* --accent-*: seguro para TEXTO/ÍCONE sobre --bg-base, --bg-surface e --bg-surface-alt */
  /* --fill-*: fundo sólido calibrado para texto branco (#FFFFFF) ou --ink-on-fill-* */
  /* --accent-*-soft + --ink-on-*-soft: badges suaves e avisos editoriais */

  --highlight-comic: #FFD600;    /* Amarelo Hero exclusivo para destaques com --ink-on-highlight (#111111) */

  /* Brand (CritRed) */
  --accent-brand: #BE123C;
  --fill-brand: #E11D48;
  --ink-on-fill-brand: #FFFFFF;
  --accent-brand-soft: rgba(225, 29, 72, 0.10);
  --ink-on-brand-soft: #9F1239;

  /* Editoria: Games */
  --accent-games: #1D4ED8;
  --fill-games: #2563EB;
  --ink-on-fill-games: #FFFFFF;
  --accent-games-soft: rgba(37, 99, 235, 0.10);
  --ink-on-games-soft: #1E40AF;

  /* Editoria: Quadrinhos & Mangás (Comics) */
  --accent-comics: #92400E;
  --fill-comics: #B45309;
  --ink-on-fill-comics: #FFFFFF;
  --accent-comics-soft: rgba(217, 119, 6, 0.14);
  --ink-on-comics-soft: #78350F;

  /* Editoria: Cinema & Séries */
  --accent-cinema: #047857;
  --fill-cinema: #047857;
  --ink-on-fill-cinema: #FFFFFF;
  --accent-cinema-soft: rgba(5, 150, 105, 0.10);
  --ink-on-cinema-soft: #065F46;

  /* Editoria: Animes & Cultura Pop */
  --accent-animes: #0E7490;
  --fill-animes: #0E7490;
  --ink-on-fill-animes: #FFFFFF;
  --accent-animes-soft: rgba(8, 145, 178, 0.11);
  --ink-on-animes-soft: #155E75;

  /* Editoria: Hardware & Tech */
  --accent-tech: #6D28D9;
  --fill-tech: #7C3AED;
  --ink-on-fill-tech: #FFFFFF;
  --accent-tech-soft: rgba(124, 58, 237, 0.10);
  --ink-on-tech-soft: #5B21B6;

  /* 6. Estados Semânticos (Sucesso, Aviso, Erro, Info) */
  --status-success: #166534;
  --fill-success: #15803D;
  --ink-on-fill-success: #FFFFFF;
  --status-success-soft: rgba(22, 163, 74, 0.12);
  --ink-on-success-soft: #166534;

  --status-warning: #92400E;
  --fill-warning: #B45309;
  --ink-on-fill-warning: #FFFFFF;
  --status-warning-soft: rgba(217, 119, 6, 0.15);
  --ink-on-warning-soft: #78350F;

  --status-error: #B91C1C;
  --fill-error: #B91C1C;
  --ink-on-fill-error: #FFFFFF;
  --status-error-soft: rgba(220, 38, 38, 0.10);
  --ink-on-error-soft: #991B1B;

  --status-info: #0369A1;
  --fill-info: #0369A1;
  --ink-on-fill-info: #FFFFFF;
  --status-info-soft: rgba(2, 132, 199, 0.10);
  --ink-on-info-soft: #075985;
}

/* ==========================================================================
   MODO ESCURO — TINTA NANQUIM (#0D0F14) & ACENTOS ANTI-VIBRAÇÃO
   ========================================================================== */

[data-theme="dark"],
.dark {
  color-scheme: dark;

  /* 1. Camada 60% — Base */
  --bg-base: #0D0F14;
  --halftone-dot: rgba(244, 244, 245, 0.04);
  --halftone-size: 14px;

  /* 2. Camada 30% — Superfícies */
  --bg-surface: #161922;
  --bg-surface-alt: #1E2330;
  --bg-surface-hover: #262C3D;

  --chrome-bg: #090B0F;
  --chrome-surface: #141821;
  --chrome-ink: #F4F4F5;
  --chrome-ink-muted: #B4B6C2;
  --scrim-reels: #090A0F;

  /* 3. Tipografia & Tinta */
  --ink-primary: #F4F4F5;
  --ink-secondary: #B4B6C2;      /* Calibrado para >= 7.78:1 inclusive sobre #1E2330 */
  --ink-muted: #9A9AA6;          /* >= 5.64:1 em todos os fundos escuros */
  --ink-placeholder: #8E92A2;    /* >= 5.07:1 em #161922 e #1E2330 */
  --ink-inverse: #111111;
  --ink-on-highlight: #111111;

  /* 4. Bordas, Sombras & Foco */
  --border-strong: #2E3546;
  --border-input: #6E768B;       /* >= 3.46:1 sobre #1E2330 e 3.87:1 sobre #161922 */
  --border-subtle: #232836;
  --focus-ring: #38BDF8;         /* >= 7.32:1 em todas as superfícies escuras */
  --focus-ring-dark: #FFD600;

  --shadow-hard-sm: 2px 2px 0px #050608;
  --shadow-hard: 4px 4px 0px #050608;
  --shadow-hard-hover: 6px 6px 0px #000000;

  /* 5. Camada 10% — Acentos Calibrados (Anti-vibração em fundo escuro) */
  --highlight-comic: #FBBF24;    /* Âmbar-Ouro mais confortável no escuro; usar com #111111 */

  /* Brand (CritRed) */
  --accent-brand: #FB7185;       /* >= 5.83:1 sobre #1E2330 (evita falha do #F43F5E em alt) */
  --fill-brand: #BE123C;         /* Fundo sólido para texto branco (#FFFFFF -> 6.29:1) */
  --ink-on-fill-brand: #FFFFFF;
  --accent-brand-soft: rgba(244, 63, 94, 0.16);
  --ink-on-brand-soft: #FDA4AF;

  /* Editoria: Games */
  --accent-games: #60A5FA;
  --fill-games: #1D4ED8;
  --ink-on-fill-games: #FFFFFF;
  --ink-on-games-accent: #111111;
  --accent-games-soft: rgba(96, 165, 250, 0.16);
  --ink-on-games-soft: #93C5FD;

  /* Editoria: Quadrinhos & Mangás (Comics) */
  /* ATENÇÃO: #FBBF24 falha com texto branco (1.67:1). Portanto --fill-comics usa --ink-on-fill-comics (#111111 -> 11.31:1) */
  --accent-comics: #FBBF24;
  --fill-comics: #FBBF24;
  --ink-on-fill-comics: #111111;
  --accent-comics-soft: rgba(251, 191, 36, 0.16);
  --ink-on-comics-soft: #FDE68A;

  /* Editoria: Cinema & Séries */
  /* ATENÇÃO: #34D399 falha com texto branco (1.92:1). --fill-cinema usa #065F46 para texto branco (7.68:1) ou #34D399 com #111111 (9.82:1) */
  --accent-cinema: #34D399;
  --fill-cinema: #065F46;
  --ink-on-fill-cinema: #FFFFFF;
  --ink-on-cinema-accent: #111111;
  --accent-cinema-soft: rgba(52, 211, 153, 0.16);
  --ink-on-cinema-soft: #6EE7B7;

  /* Editoria: Animes & Cultura Pop */
  /* ATENÇÃO: #22D3EE falha com texto branco (1.81:1). --fill-animes usa #155E75 para texto branco (7.27:1) ou #22D3EE com #111111 (10.45:1) */
  --accent-animes: #22D3EE;
  --fill-animes: #155E75;
  --ink-on-fill-animes: #FFFFFF;
  --ink-on-animes-accent: #111111;
  --accent-animes-soft: rgba(34, 211, 238, 0.16);
  --ink-on-animes-soft: #67E8F9;

  /* Editoria: Hardware & Tech */
  --accent-tech: #A78BFA;
  --fill-tech: #6D28D9;
  --ink-on-fill-tech: #FFFFFF;
  --ink-on-tech-accent: #111111;
  --accent-tech-soft: rgba(167, 139, 250, 0.16);
  --ink-on-tech-soft: #C4B5FD;

  /* 6. Estados Semânticos */
  --status-success: #34D399;
  --fill-success: #34D399;
  --ink-on-fill-success: #111111;
  --status-success-soft: rgba(52, 211, 153, 0.16);
  --ink-on-success-soft: #6EE7B7;

  --status-warning: #FBBF24;
  --fill-warning: #FBBF24;
  --ink-on-fill-warning: #111111;
  --status-warning-soft: rgba(251, 191, 36, 0.16);
  --ink-on-warning-soft: #FDE68A;

  --status-error: #F87171;
  --fill-error: #B91C1C;
  --ink-on-fill-error: #FFFFFF;
  --status-error-soft: rgba(248, 113, 113, 0.16);
  --ink-on-error-soft: #FCA5A5;

  --status-info: #38BDF8;
  --fill-info: #38BDF8;
  --ink-on-fill-info: #111111;
  --status-info-soft: rgba(56, 189, 248, 0.16);
  --ink-on-info-soft: #7DD3FC;
}
```

### 2.3 Persistência de Tema Sem FOUC (Next.js App Router)

Para eliminar qualquer *flash* branco ao carregar o Modo Escuro (US-6.1), o `<head>` do `app/layout.tsx` deve executar um script síncrono mínimo antes da primeira pintura e da hidratação do React:

1. **Chave de persistência:** `localStorage.getItem('crithit-theme')` aceitando apenas `'light'` ou `'dark'`.
2. **Fallback inicial:** `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
3. **Sincronização dupla no `<html>`:** define `data-theme` **e** alterna a classe `.dark` em `document.documentElement`, com `<html lang="pt-BR" suppressHydrationWarning>`.
4. **Script inline recomendado (`app/layout.tsx`):**

```tsx
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('crithit-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;
```

> **Regra de hidratação:** O componente `ThemeToggle` no cliente lê o tema inicial apenas após montagem (`useEffect`) ou renderiza ícone neutro com `suppressHydrationWarning` até hidratar, evitando *mismatch* SSR/CSR sem alterar o fundo já pintado pelo script do `<head>`.

---

## 3. Auditoria Matemática de Contraste WCAG 2.1 AA

### 3.1 Metodologia de Cálculo

Todas as razões abaixo seguem exatamente a especificação W3C WCAG 2.1:

1. Normalização sRGB para cada canal $C_{8bit} \in [0, 255]$: $c = C_{8bit} / 255$.
2. Linearização:
   $$c_{lin} = \begin{cases} c / 12.92 & \text{se } c \le 0.03928 \\ ((c + 0.055) / 1.055)^{2.4} & \text{se } c > 0.03928 \end{cases}$$
3. Luminância Relativa:
   $$L = 0.2126 \cdot R_{lin} + 0.7152 \cdot G_{lin} + 0.0722 \cdot B_{lin}$$
4. Razão de Contraste ($L_1 \ge L_2$):
   $$CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$

**Critérios de Aprovação:**
- **Texto normal** (< 18pt ou < 14pt negrito) e metadados: **$CR \ge 4.50:1$**
- **Texto grande** ($\ge 18pt$ / $24px$ normal ou $\ge 14pt$ / $18.67px$ negrito), bordas de controle de UI e anéis `:focus-visible`: **$CR \ge 3.00:1$**

### 3.2 Ajustes Documentados (Correções sobre Cores Vibrantes do Protótipo)

Durante a auditoria matemática, os seguintes acentos vibrantes falhavam no critério de $4.50:1$ e receberam calibração explícita:

| Caso Detectado | Razão Insuficiente | Solução Oficial no Design System |
| :--- | :--- | :--- |
| `#E11D48` (CritRed) como texto sobre `#F6F4EE` e `#EFECE3` | `4.27:1` (`#F6F4EE`) e `3.98:1` (`#EFECE3`) | Texto/link usa `--accent-brand: #BE123C` (`5.71:1` / `5.32:1`); preenchimento com texto `#FFFFFF` mantém `--fill-brand: #E11D48` (`4.70:1`). |
| `#2563EB` (Games) como texto sobre `#EFECE3` | `4.38:1` (`#EFECE3`) | Texto/link usa `--accent-games: #1D4ED8` (`5.67:1` em `#EFECE3`); botão sólido usa `--fill-games: #2563EB` com `#FFFFFF` (`5.17:1`). |
| `#D97706` (Comics) em texto claro e branco sobre fundo | `2.90:1` (`#F6F4EE`) e `3.19:1` (`#FFFFFF`) | Texto usa `--accent-comics: #92400E` (`6.00:1` em `#EFECE3`); preenchimento com texto `#FFFFFF` usa `--fill-comics: #B45309` (`5.02:1`); amarelo `#FFD600` usa obrigatoriamente `--ink-on-highlight: #111111` (`13.37:1`). |
| `#059669` (Cinema) em texto e preenchimento branco | `3.43:1` (`#F6F4EE`) e `3.77:1` (`#FFFFFF`) | Substituído por `--accent-cinema: #047857` / `--fill-cinema: #047857` (`4.64:1` a `5.48:1`). |
| `#F43F5E` (Brand Dark) sobre `#1E2330` e com `#FFFFFF` | `4.27:1` (`#1E2330`) e `3.67:1` (`#FFFFFF`) | Modo escuro usa `--accent-brand: #FB7185` para texto (`5.83:1` em `#1E2330`) e `--fill-brand: #BE123C` para fundo com `#FFFFFF` (`6.29:1`). |
| `#FBBF24`, `#34D399`, `#22D3EE` (Dark) com texto `#FFFFFF` | `1.67:1`, `1.92:1`, `1.81:1` | Proibido texto branco sobre estes tons. No modo escuro, `--fill-comics: #FBBF24` exige `--ink-on-fill-comics: #111111` (`11.31:1`), enquanto `--fill-cinema: #065F46` (`7.68:1`) e `--fill-animes: #155E75` (`7.27:1`) suportam `#FFFFFF` (ou `#111111` quando usado o tom brilhante). |
| `--border-input: #5E667A` (Dark) sobre `#1E2330` | `2.73:1` (< `3.00:1`) | Elevado para `--border-input: #6E768B` (`3.46:1` sobre `#1E2330` e `3.87:1` sobre `#161922`). |

### 3.3 Tabela Completa — Modo Claro (`data-theme="light"`)

| Par Semântico (Primeiro Plano → Fundo) | Hex FG | Hex BG | $L_{FG}$ | $L_{BG}$ | Razão Exata | Meta WCAG | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `--ink-primary` → `--bg-base` | `#111111` | `#F6F4EE` | `0.0056` | `0.9047` | **17.17:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-primary` → `--bg-surface` | `#111111` | `#FFFFFF` | `0.0056` | `1.0000` | **18.88:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-primary` → `--bg-surface-alt` | `#111111` | `#EFECE3` | `0.0056` | `0.8389` | **15.99:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-base` | `#3F3F46` | `#F6F4EE` | `0.0505` | `0.9047` | **9.50:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-surface` | `#3F3F46` | `#FFFFFF` | `0.0505` | `1.0000` | **10.44:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-surface-alt` | `#3F3F46` | `#EFECE3` | `0.0505` | `0.8389` | **8.84:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-muted` → `--bg-base` | `#55555F` | `#F6F4EE` | `0.0925` | `0.9047` | **6.70:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-muted` → `--bg-surface` | `#55555F` | `#FFFFFF` | `0.0925` | `1.0000` | **7.37:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-muted` → `--bg-surface-alt` | `#55555F` | `#EFECE3` | `0.0925` | `0.8389` | **6.24:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-placeholder` → `--bg-surface` | `#5C5C66` | `#FFFFFF` | `0.1089` | `1.0000` | **6.61:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-placeholder` → `--bg-surface-alt` | `#5C5C66` | `#EFECE3` | `0.1089` | `0.8389` | **5.59:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-brand` → `--bg-base` | `#BE123C` | `#F6F4EE` | `0.1171` | `0.9047` | **5.71:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-brand` → `--bg-surface-alt` | `#BE123C` | `#EFECE3` | `0.1171` | `0.8389` | **5.32:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-games` → `--bg-base` | `#1D4ED8` | `#F6F4EE` | `0.1067` | `0.9047` | **6.09:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-games` → `--bg-surface-alt` | `#1D4ED8` | `#EFECE3` | `0.1067` | `0.8389` | **5.67:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-comics` → `--bg-base` | `#92400E` | `#F6F4EE` | `0.0981` | `0.9047` | **6.45:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-comics` → `--bg-surface-alt` | `#92400E` | `#EFECE3` | `0.0981` | `0.8389` | **6.00:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-cinema` → `--bg-base` | `#047857` | `#F6F4EE` | `0.1415` | `0.9047` | **4.99:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-cinema` → `--bg-surface-alt` | `#047857` | `#EFECE3` | `0.1415` | `0.8389` | **4.64:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-animes` → `--bg-base` | `#0E7490` | `#F6F4EE` | `0.1460` | `0.9047` | **4.87:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-animes` → `--bg-surface-alt` | `#0E7490` | `#EFECE3` | `0.1460` | `0.8389` | **4.54:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-tech` → `--bg-base` | `#6D28D9` | `#F6F4EE` | `0.0978` | `0.9047` | **6.46:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-tech` → `--bg-surface-alt` | `#6D28D9` | `#EFECE3` | `0.0978` | `0.8389` | **6.01:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-brand` → `--fill-brand` | `#FFFFFF` | `#E11D48` | `1.0000` | `0.1735` | **4.70:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-games` → `--fill-games` | `#FFFFFF` | `#2563EB` | `1.0000` | `0.1532` | **5.17:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-comics` → `--fill-comics` | `#FFFFFF` | `#B45309` | `1.0000` | `0.1591` | **5.02:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-cinema` → `--fill-cinema` | `#FFFFFF` | `#047857` | `1.0000` | `0.1415` | **5.48:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-animes` → `--fill-animes` | `#FFFFFF` | `#0E7490` | `1.0000` | `0.1460` | **5.36:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-tech` → `--fill-tech` | `#FFFFFF` | `#7C3AED` | `1.0000` | `0.1343` | **5.70:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-highlight` → `--highlight-comic` | `#111111` | `#FFD600` | `0.0056` | `0.6935` | **13.37:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--highlight-comic` | `#3F3F46` | `#FFD600` | `0.0505` | `0.6935` | **7.40:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--status-success` → `--bg-surface-alt` | `#166534` | `#EFECE3` | `0.0973` | `0.8389` | **6.04:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-success` → `--fill-success` | `#FFFFFF` | `#15803D` | `1.0000` | `0.1593` | **5.02:1** | $\ge 4.5:1$ | Aprovado |
| `--status-warning` → `--bg-surface-alt` | `#92400E` | `#EFECE3` | `0.0981` | `0.8389` | **6.00:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-warning` → `--fill-warning` | `#FFFFFF` | `#B45309` | `1.0000` | `0.1591` | **5.02:1** | $\ge 4.5:1$ | Aprovado |
| `--status-error` → `--bg-surface-alt` | `#B91C1C` | `#EFECE3` | `0.1123` | `0.8389` | **5.48:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-error` → `--fill-error` | `#FFFFFF` | `#B91C1C` | `1.0000` | `0.1123` | **6.47:1** | $\ge 4.5:1$ | Aprovado |
| `--status-info` → `--bg-surface-alt` | `#0369A1` | `#EFECE3` | `0.1270` | `0.8389` | **5.02:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-info` → `--fill-info` | `#FFFFFF` | `#0369A1` | `1.0000` | `0.1270` | **5.93:1** | $\ge 4.5:1$ | Aprovado |
| `--border-input` → `--bg-surface` | `#767268` | `#FFFFFF` | `0.1689` | `1.0000` | **4.80:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--border-input` → `--bg-base` | `#767268` | `#F6F4EE` | `0.1689` | `0.9047` | **4.36:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--focus-ring` → `--bg-base` | `#1D4ED8` | `#F6F4EE` | `0.1067` | `0.9047` | **6.09:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--focus-ring` → `--highlight-comic` | `#1D4ED8` | `#FFD600` | `0.1067` | `0.6935` | **4.75:1** | $\ge 3.0:1$ | Aprovado (UI) |

### 3.4 Tabela Completa — Modo Escuro (`data-theme="dark"`) e Chrome/Reels

| Par Semântico (Primeiro Plano → Fundo) | Hex FG | Hex BG | $L_{FG}$ | $L_{BG}$ | Razão Exata | Meta WCAG | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `--ink-primary` → `--bg-base` | `#F4F4F5` | `#0D0F14` | `0.9053` | `0.0048` | **17.44:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-primary` → `--bg-surface` | `#F4F4F5` | `#161922` | `0.9053` | `0.0098` | **15.97:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-primary` → `--bg-surface-alt` | `#F4F4F5` | `#1E2330` | `0.9053` | `0.0169` | **14.28:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-base` | `#B4B6C2` | `#0D0F14` | `0.4705` | `0.0048` | **9.50:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-surface` | `#B4B6C2` | `#161922` | `0.4705` | `0.0098` | **8.70:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-secondary` → `--bg-surface-alt` | `#B4B6C2` | `#1E2330` | `0.4705` | `0.0169` | **7.78:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-muted` → `--bg-base` | `#9A9AA6` | `#0D0F14` | `0.3273` | `0.0048` | **6.89:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-muted` → `--bg-surface` | `#9A9AA6` | `#161922` | `0.3273` | `0.0098` | **6.31:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-muted` → `--bg-surface-alt` | `#9A9AA6` | `#1E2330` | `0.3273` | `0.0169` | **5.64:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-placeholder` → `--bg-surface` | `#8E92A2` | `#161922` | `0.2892` | `0.0098` | **5.67:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-placeholder` → `--bg-surface-alt` | `#8E92A2` | `#1E2330` | `0.2892` | `0.0169` | **5.07:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-brand` → `--bg-base` | `#FB7185` | `#0D0F14` | `0.3401` | `0.0048` | **7.12:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-brand` → `--bg-surface-alt` | `#FB7185` | `#1E2330` | `0.3401` | `0.0169` | **5.83:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-games` → `--bg-base` | `#60A5FA` | `#0D0F14` | `0.3630` | `0.0048` | **7.54:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-games` → `--bg-surface-alt` | `#60A5FA` | `#1E2330` | `0.3630` | `0.0169` | **6.17:1** | $\ge 4.5:1$ | Aprovado |
| `--accent-comics` → `--bg-base` | `#FBBF24` | `#0D0F14` | `0.5790` | `0.0048` | **11.48:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-comics` → `--bg-surface-alt` | `#FBBF24` | `#1E2330` | `0.5790` | `0.0169` | **9.40:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-cinema` → `--bg-base` | `#34D399` | `#0D0F14` | `0.4962` | `0.0048` | **9.97:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-cinema` → `--bg-surface-alt` | `#34D399` | `#1E2330` | `0.4962` | `0.0169` | **8.16:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-animes` → `--bg-base` | `#22D3EE` | `#0D0F14` | `0.5310` | `0.0048` | **10.61:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-animes` → `--bg-surface-alt` | `#22D3EE` | `#1E2330` | `0.5310` | `0.0169` | **8.68:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-tech` → `--bg-base` | `#A78BFA` | `#0D0F14` | `0.3358` | `0.0048` | **7.04:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--accent-tech` → `--bg-surface-alt` | `#A78BFA` | `#1E2330` | `0.3358` | `0.0169` | **5.77:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-brand` → `--fill-brand` | `#FFFFFF` | `#BE123C` | `1.0000` | `0.1171` | **6.29:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-games` → `--fill-games` | `#FFFFFF` | `#1D4ED8` | `1.0000` | `0.1067` | **6.70:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-comics` → `--fill-comics` | `#111111` | `#FBBF24` | `0.0056` | `0.5790` | **11.31:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-cinema` → `--fill-cinema` | `#FFFFFF` | `#065F46` | `1.0000` | `0.0867` | **7.68:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-cinema-accent` → `--accent-cinema` | `#111111` | `#34D399` | `0.0056` | `0.4962` | **9.82:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-animes` → `--fill-animes` | `#FFFFFF` | `#155E75` | `1.0000` | `0.0945` | **7.27:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-animes-accent` → `--accent-animes` | `#111111` | `#22D3EE` | `0.0056` | `0.5310` | **10.45:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-tech` → `--fill-tech` | `#FFFFFF` | `#6D28D9` | `1.0000` | `0.0978` | **7.10:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--status-success` → `--bg-surface-alt` | `#34D399` | `#1E2330` | `0.4962` | `0.0169` | **8.16:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-success` → `--fill-success` | `#111111` | `#34D399` | `0.0056` | `0.4962` | **9.82:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--status-warning` → `--bg-surface-alt` | `#FBBF24` | `#1E2330` | `0.5790` | `0.0169` | **9.40:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-warning` → `--fill-warning` | `#111111` | `#FBBF24` | `0.0056` | `0.5790` | **11.31:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--status-error` → `--bg-surface-alt` | `#F87171` | `#1E2330` | `0.3296` | `0.0169` | **5.67:1** | $\ge 4.5:1$ | Aprovado |
| `--ink-on-fill-error` → `--fill-error` | `#FFFFFF` | `#B91C1C` | `1.0000` | `0.1123` | **6.47:1** | $\ge 4.5:1$ | Aprovado |
| `--status-info` → `--bg-surface-alt` | `#38BDF8` | `#1E2330` | `0.4401` | `0.0169` | **7.32:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--ink-on-fill-info` → `--fill-info` | `#111111` | `#38BDF8` | `0.0056` | `0.4401` | **8.81:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--border-input` → `--bg-surface` | `#6E768B` | `#161922` | `0.1814` | `0.0098` | **3.87:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--border-input` → `--bg-surface-alt` | `#6E768B` | `#1E2330` | `0.1814` | `0.0169` | **3.46:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--focus-ring` → `--bg-surface-alt` | `#38BDF8` | `#1E2330` | `0.4401` | `0.0169` | **7.32:1** | $\ge 3.0:1$ | Aprovado (UI) |
| `--chrome-ink` → `--chrome-bg` | `#F4F4F5` | `#111318` | `0.9053` | `0.0065` | **16.90:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `--chrome-ink-muted` → `--chrome-bg` | `#B4B6C2` | `#111318` | `0.4705` | `0.0065` | **9.21:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `#FFFFFF` → `--scrim-reels` | `#FFFFFF` | `#090A0F` | `1.0000` | `0.0031` | **19.78:1** | $\ge 4.5:1$ | Aprovado (AAA) |
| `#FFD600` → `--scrim-reels` | `#FFD600` | `#090A0F` | `0.6935` | `0.0031` | **14.00:1** | $\ge 4.5:1$ | Aprovado (AAA) |

### 3.5 Auditoria de Soft Badges (Composição Alpha Real sobre `--bg-surface` e `--bg-surface-alt`)

A tabela abaixo comprova a razão de contraste após composição *alpha-blending* ($C_{comp} = \alpha C_{tint} + (1 - \alpha) C_{bg}$) no pior cenário (sobre `--bg-surface-alt`):

| Soft Badge / Alerta | Modo Claro (`--ink-on-*-soft` → `#EFECE3` composto) | Razão Claro (Pior Caso) | Modo Escuro (`--ink-on-*-soft` → `#1E2330` composto) | Razão Escuro (Pior Caso) |
| :--- | :---: | :---: | :---: | :---: |
| **Brand** | `#9F1239` → `#EED7D4` (`10%`) | **5.84:1** (`6.83:1` em `#FFF`) | `#FDA4AF` → `#402737` (`16%`) | **7.10:1** (`7.86:1` em `#161922`) |
| **Games** | `#1E40AF` → `#DBDEE4` (`10%`) | **6.47:1** (`7.57:1` em `#FFF`) | `#93C5FD` → `#293850` (`16%`) | **6.56:1** (`7.46:1` em `#161922`) |
| **Comics** | `#78350F` → `#ECDCC4` (`14%`) | **6.74:1** (`7.82:1` em `#FFF`) | `#FDE68A` → `#413C2E` (`16%`) | **8.83:1** (`9.92:1` em `#161922`) |
| **Cinema** | `#065F46` → `#D8E3D7` (`10%`) | **5.81:1** (`6.79:1` em `#FFF`) | `#6EE7B7` → `#223F41` (`16%`) | **7.43:1** (`8.38:1` em `#161922`) |
| **Animes** | `#155E75` → `#D6E2DE` (`11%`) | **5.46:1** (`6.39:1` em `#FFF`) | `#67E8F9` → `#1F3F4E` (`16%`) | **7.71:1** (`8.69:1` em `#161922`) |
| **Tech** | `#5B21B6` → `#E4DAE4` (`10%`) | **6.61:1** (`7.73:1` em `#FFF`) | `#C4B5FD` → `#343450` (`16%`) | **6.49:1** (`7.37:1` em `#161922`) |
| **Success** | `#166534` → `#D5E3D1` (`12%`) | **5.34:1** (`6.24:1` em `#FFF`) | `#6EE7B7` → `#223F41` (`16%`) | **7.43:1** (`8.38:1` em `#161922`) |
| **Warning** | `#78350F` → `#ECDAC2` (`15%`) | **6.64:1** (`7.74:1` em `#FFF`) | `#FDE68A` → `#413C2E` (`16%`) | **8.83:1** (`9.92:1` em `#161922`) |
| **Error** | `#991B1B` → `#EDD8D0` (`10%`) | **6.07:1** (`7.11:1` em `#FFF`) | `#FCA5A5` → `#412F3A` (`16%`) | **6.54:1** (`7.32:1` em `#161922`) |
| **Info** | `#075985` → `#D7E2E0` (`10%`) | **5.71:1** (`6.68:1` em `#FFF`) | `#7DD3FC` → `#223C50` (`16%`) | **6.88:1** (`7.85:1` em `#161922`) |

---

## 4. Escala Tipográfica, Hierarquia e Regras de Viewport

### 4.1 Famílias Tipográficas (`next/font/google`)

| Família | Variável CSS | Classe Tailwind | Papel Exclusivo & Restrições |
| :--- | :--- | :--- | :--- |
| **Bangers** | `--font-display` | `font-display` | **Uso estrito:** logotipo `CRITHIT!`, selos pontuais de impacto (`PLANTÃO GEEK`, badge `REELS`), números de ranking `#1`–`#5` em Mais Lidas. **Proibido** em parágrafos, links de lista, formulários, corpo de matéria e títulos de cards comuns. |
| **Barlow Condensed** | `--font-headline` | `font-headline` | Manchetes editoriais de alta densidade (Hero da Home, `<h1>` de `/noticia/[slug]`, títulos de seções e manchetes dos Reels 9:16). Pesos: `600`, `700`, `800`. |
| **Space Grotesk** | `--font-sans` | `font-sans` | Interface geral (botões, abas, navegação, inputs, títulos de cards secundários/compactos e labels de formulário). Pesos: `500`, `600`, `700`. |
| **Plus Jakarta Sans** | `--font-reading` | `font-reading` | Leitura longa e confortável: corpo de `/noticia/[slug]`, leads, resumos de colunas/reviews, `reels_summary`, comentários e nota de transparência. Pesos: `400`, `500`, `600`, `700`. |
| **JetBrains Mono** | `--font-mono` | `font-mono` | Créditos (`author_name`), `source_name`, timestamps, tempo de leitura, badges de editoria/status (`AUTORAL`, `CURADORIA`, `PENDING_REVIEW`, `PUBLISHED`), scores `pgvector` no Admin. Pesos: `500`, `700`. |

### 4.2 Escala Tipográfica Responsiva (Piso Obrigatório $\ge 11px$)

> **Regra Inegociável de Piso:** Nenhum elemento textual visível na interface (incluindo badges, contadores, timestamps, tags e rodapé) pode ter `font-size` computado inferior a **`11px` (`0.6875rem`)**. Classes como `text-[9px]` ou `text-[10px]` são **proibidas** e bloqueadas por salvaguarda CSS + revisão de código.

| Nível / Token | Família | Tamanho (`clamp` / `rem`) | `line-height` | `letter-spacing` | Uso |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Brand Mark** | `Bangers` | `clamp(1.5rem, 2.2vw, 2rem)` (`24px–32px`) | `1.0` | `0.05em` | Logotipo `CRITHIT!` e selos pontuais de capa |
| **Hero H1** | `Barlow Condensed` | `clamp(2rem, 4.2vw, 3.25rem)` (`32px–52px`) | `1.04` | `-0.01em` | Manchete Principal da Home e `<h1>` em `/noticia/[slug]` |
| **Section H2** | `Barlow Condensed` | `clamp(1.5rem, 2.5vw, 2rem)` (`24px–32px`) | `1.1` | `0.01em` | Títulos de seção (`Giro Geek`, `Colunas & Reviews`, `Mais Lidas`) |
| **Card Title Md** | `Space Grotesk` | `1.125rem` (`18px`) | `1.28` | `-0.015em` | Destaques secundários, títulos no Admin, Reels Card |
| **Card Title Sm** | `Space Grotesk` | `0.9375rem` (`15px`) | `1.32` | `-0.01em` | Cards do Giro Geek, Urgente na Redação, Editorias |
| **Lead / Resumo** | `Plus Jakarta Sans` | `clamp(1.0625rem, 1.4vw, 1.1875rem)` (`17px–19px`) | `1.60` | `0` | Lead de `/noticia/[slug]` e destaque de abertura |
| **Body Reading** | `Plus Jakarta Sans` | `1rem` (`16px` mobile) / `1.0625rem` (`17px` desktop) | `1.70` | `0` | Corpo longo de matéria com largura ótima `max-w-[68ch]` (`65ch–75ch`) |
| **UI Body / Input** | `Space Grotesk` | `0.875rem` (`14px`) | `1.45` | `0` | Inputs de busca/Admin, botões padrão, navegação |
| **Meta / Badge** | `JetBrains Mono` | `0.75rem` (`12px`) | `1.35` | `0.02em` | Autor, `source_name`, timestamp, badges de status |
| **Micro Label (Piso)** | `JetBrains Mono` | **`0.6875rem` (`11px`)** | `1.30` | `0.04em` | Selos compactos de editoria, contadores de Reels, notas de rodapé |

### 4.3 Regra Obrigatória de Viewport e Zoom (Proibição de `user-scalable=no`)

No Next.js App Router (`app/layout.tsx`), a exportação `viewport` **nunca** pode conter `userScalable: false` ou `maximumScale: 1`:

```ts
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // PROIBIDO: userScalable: false ou maximumScale: 1 (viola WCAG 1.4.4 Resize Text)
};
```

---

## 5. Catálogo de Ícones (`lucide-react`) — Política Zero Emojis

É **terminantemente proibido** usar emojis Unicode (`⚡`, `🔥`, `🎁`, `🎮`, `🌙`, `☀️`, `❌`, `🚀`, `🔗`, `📖`, `💬`, `🔄`, `✓`, `⏳`, `⭐`) em qualquer componente, texto, toast, botão ou metadado.

### 5.1 Padronização Técnica

- **Biblioteca única:** `lucide-react`
- **Espessura de traço (`strokeWidth`):**
  - `strokeWidth={2}` em ações, botões, navegação e drawers.
  - `strokeWidth={1.75}` em metadados inline (timestamps, autor, fonte, badges).
- **Escala de tamanhos:** `14px` (`w-3.5 h-3.5`), `16px` (`w-4 h-4`), `20px` (`w-5 h-5`), `24px` (`w-6 h-6`).
- **Acessibilidade:** Ícones acompanhados de texto visível devem receber `aria-hidden="true"`. Botões apenas com ícone (*icon-only*) exigem `aria-label` descritivo no `<button>`.

### 5.2 Mapeamento Oficial por Área do Sistema

| Área / Fluxo | Função na UI | Ícone `lucide-react` | `size` (px) | `strokeWidth` | Acessibilidade |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Plantão Geek** | Selo de urgência no Ticker | `Zap` | `16` | `2` | `aria-hidden="true"` ao lado de `PLANTÃO GEEK` |
| **Urgente na Redação** | Indicador de transmissão/ao vivo | `Radio` | `16` | `2` | Acompanhado de texto `AO VIVO` / `URGENTE` |
| **Busca Global** | Ícone de lupa na barra de busca | `Search` | `16` | `2` | `aria-hidden="true"` (input tem `aria-label`) |
| **Busca Global** | Botão "Limpar busca" | `X` | `16` | `2` | `aria-label="Limpar busca"` |
| **Tema Claro/Escuro** | Alternar para Modo Escuro (quando Claro ativo) | `Moon` | `16` | `2` | `aria-hidden="true"` no `ThemeToggle` |
| **Tema Claro/Escuro** | Alternar para Modo Claro (quando Escuro ativo) | `Sun` | `16` | `2` | `aria-hidden="true"` no `ThemeToggle` |
| **Reels (Home / Player)** | Curtir Reel | `Heart` | `24` | `2` | `aria-pressed` no botão + `aria-label="Curtir notícia"` |
| **Reels (Home / Player)** | Abrir gaveta de comentários | `MessageSquare` | `24` | `2` | `aria-label="Abrir comentários"` |
| **Reels (Home / Player)** | Salvar matéria para depois | `Bookmark` | `24` | `2` | `aria-pressed` no botão + `aria-label="Salvar notícia"` |
| **Reels (Home / Player)** | Compartilhar link do Reel | `Share2` | `24` | `2` | `aria-label="Compartilhar notícia"` |
| **Reels (Home / Player)** | Indicador de reprodução/vídeo | `Play` | `20` / `24` | `2` | `aria-hidden="true"` |
| **Reels (Desktop Nav)** | Navegar Reel anterior / próximo | `ChevronUp` / `ChevronDown` | `24` | `2` | `aria-label="Reel anterior"` / `"Próximo Reel"` |
| **Reels (Filtros)** | Ícone de filtro de editoria | `SlidersHorizontal` | `14` | `2` | `aria-hidden="true"` |
| **Atribuição Editorial** | Conteúdo `AUTORAL` | `PenTool` | `14` | `1.75` | `aria-hidden="true"` + texto `AUTORAL` |
| **Atribuição Editorial** | Conteúdo `CURADORIA` | `GitFork` | `14` | `1.75` | `aria-hidden="true"` + texto `CURADORIA` |
| **Transparência Editorial** | Nota de revisão humana e verificação | `ShieldCheck` | `16` | `1.75` | `aria-hidden="true"` |
| **Link Externo** | Link para `source_url` | `ExternalLink` | `14` | `1.75` | `aria-hidden="true"` + `sr-only` "(abre em nova aba)" |
| **Metadados de Leitura** | Tempo estimado de leitura | `Clock` | `14` | `1.75` | `aria-hidden="true"` |
| **Mais Lidas (#1–#5)** | Tendência / popularidade | `TrendingUp` | `16` | `2` | `aria-hidden="true"` |
| **Newsletter Loot Diário** | Assinatura e retorno | `Mail` / `CheckCircle2` / `AlertCircle` | `16` | `2` | Vinculado a feedback `role="status"` / `aria-describedby` |
| **Fechar Modal / Drawer** | Botão fechar em diálogos | `X` | `20` | `2` | `aria-label="Fechar janela"` |
| **Admin (`/admin`)** | Aprovar e Publicar | `Check` | `16` | `2` | `aria-hidden="true"` + texto |
| **Admin (`/admin`)** | Agendar publicação futura | `CalendarClock` | `16` | `2` | `aria-hidden="true"` + texto |
| **Admin (`/admin`)** | Descartar rascunho | `Trash2` | `16` | `2` | `aria-hidden="true"` + confirmação em 2 passos |
| **Admin (`/admin`)** | Tirar matéria do ar (`UNPUBLISHED`) | `EyeOff` | `16` | `2` | `aria-hidden="true"` + confirmação em 2 passos |
| **Admin (`/admin`)** | Promover a Manchete Principal | `Star` | `16` | `2` | `aria-pressed` / texto explícito |
| **Admin (`/admin`)** | Editar matéria publicada | `FileEdit` | `16` | `2` | `aria-hidden="true"` |
| **Admin (`/admin`)** | Revalidar / Recarregar fila | `RefreshCw` | `16` | `2` | `aria-hidden="true"` |
| **Admin (`/admin`)** | Login / Sessão / Alerta | `Lock` / `LogOut` / `AlertTriangle` | `16` | `2` | `aria-hidden="true"` |

---

## 6. Especificação de Componentes Reutilizáveis & Acessibilidade

### 6.1 `Topbar`, `SearchBar` e `ThemeToggle`

- **Anatomia:**
  - `<header>` sticky (`z-40`, `bg-[var(--chrome-bg)] text-[var(--chrome-ink)] border-b-[3px] border-[var(--highlight-comic)]`).
  - Marca `CRITHIT!` em `<Link href="/">` com fonte `Bangers`, selo `--fill-brand` + `--highlight-comic` e `aria-label="CritHit! — Ir para a capa"`.
  - Navegação `<nav aria-label="Navegação principal">` com links `Capa (/)`, `Reels (/reels)`, `Editorias` e acesso discreto ao `Admin (/admin)` (quando aplicável), marcando a rota ativa com `aria-current="page"`.
  - `SearchBar` (desktop inline no header + faixa dedicada abaixo no mobile `lg:hidden`): `<form role="search">` com `<input type="search" aria-label="Buscar notícias" placeholder="Buscar por título, editoria ou fonte...">`, ícone `Search` à esquerda e botão `X` (`aria-label="Limpar busca"`) visível quando há termo digitado.
  - `ThemeToggle`: `<button type="button" aria-pressed={theme === 'dark'} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>` exibindo `Sun` + `CLARO` ou `Moon` + `ESCURO`.
- **Estados:**
  - Hover nos links/botões do chrome: destaque em `--highlight-comic` com `--ink-on-highlight` (`#111111`).
  - `:focus-visible`: `outline: 2px solid var(--focus-ring-dark); outline-offset: 2px;`.

### 6.2 `BreakingTicker` ("Plantão Geek")

- **Anatomia:**
  - Faixa horizontal `bg-[var(--bg-surface-alt)] border-b-[3px] border-[var(--border-strong)]`.
  - Selo fixo à esquerda (`bg-[var(--fill-brand)] text-[var(--ink-on-fill-brand)]`) com ícone `Zap` (`16px`) + texto `PLANTÃO GEEK`.
  - Container rolável com lista de links `<Link href="/noticia/[slug]">` contendo badge de editoria (`>= 11px`) + manchete concisa.
- **Acessibilidade e Movimento:**
  - Pausar animação **no hover e no foco por teclado**:
    ```css
    .ticker-track:hover,
    .ticker-track:focus-within {
      animation-play-state: paused;
    }
    ```
  - Os itens duplicados para loop visual contínuo devem receber `aria-hidden="true"` e `tabIndex={-1}` em seus clones para evitar leitura duplicada por leitores de tela e tabulação repetida.
  - Sob `@media (prefers-reduced-motion: reduce)`: animação desativada (`animation: none`), lista exibida em barra estática com `overflow-x: auto` acessível por teclado, clones ocultos (`display: none`).

### 6.3 Cards Editoriais (`HeroArticleCard`, `SecondaryArticleCard`, `GiroGeekCard`, `ColumnReviewCard`, `MostReadRankCard`)

- **Regra de Navegação por Teclado:**
  - **Preferência absoluta por `<Link href="/noticia/[slug]">` envolvendo o título ou card inteiro** (`<article>` contendo um `<Link>` principal ou `stretched-link`), evitando `div/article` com `onClick` puro.
  - Caso um container `<article>` possua área clicável delegada (ex.: card com link interno de fonte cruzada), usar **técnica de link estendido** (`::after` absoluto no `<Link>` do título) com `z-index` maior nos botões/links secundários (como `source_url`), OU `tabIndex={0}`, `role="link"` e handler explícito para `Enter` e `Space`.
  - `:focus-visible` no card ou no link principal exibe contorno `2px solid var(--focus-ring)` com `outline-offset: 3px`.
- **Variantes & Anatomia:**
  - `HeroArticleCard` (8 cols desktop): Badge de editoria (`--fill-*`), badge `AUTORAL`/`CURADORIA`, timestamp (`JetBrains Mono`), `<h1>` em `Barlow Condensed`, lead em `Plus Jakarta Sans`, até 3 `subheadline_bullets`, imagem com `alt` descritivo e `AttributionBadge`.
  - `SecondaryArticleCard` (grid 3 cols): Imagem 16:9, badge de editoria, manchete (`Space Grotesk`, `16px–18px`), `source_name` + timestamp (`12px`).
  - `GiroGeekCard` (grid 4 cols x 2 linhas): Layout horizontal compacto (`thumbnail 64x64` + editoria + manchete `line-clamp-2` + fonte/tempo).
  - `UrgentSideCard` ("Urgente na Redação"): Exibe ícone `Radio` + rótulo textual explícito `URGENTE` ou `AO VIVO` (nunca apenas ponto colorido pulsante — critério US-1.4).
  - `ColumnReviewCard` (grid 4 cols): Avatar editorial, `author_name`, selo `AUTORAL` (ou `CURADORIA`), badge opcional de nota (`--highlight-comic` com `#111111`), título da coluna/review.
  - `MostReadRankCard` (grid 5 cols): Posição `#1`–`#5` em `Bangers` com alto contraste, manchete, editoria e ícone `TrendingUp` + contagem formatada.

### 6.4 `AttributionBadge` e `TransparencyNotice`

- **Props obrigatórias:**
  - `authorName: string`
  - `contentType: 'AUTORAL' | 'CURADORIA'`
  - `sourceName: string`
  - `sourceUrl: string`
  - `variant?: 'compact' | 'detailed'`
- **Validação Defensiva de URL no Frontend (`lib/url.ts`):**
  - Antes de renderizar qualquer `<a href={safeUrl}>`, validar que `sourceUrl` faz parse válido via `new URL(sourceUrl)` com `protocol === 'http:' || protocol === 'https:'`. Caso contrário, não renderizar link clicável (renderizar apenas texto `sourceName`).
  - Todo link externo renderizado inclui obrigatoriamente `target="_blank" rel="noopener noreferrer"`.
- **Renderização Visual:**
  - `AUTORAL`: badge suave `--accent-cinema-soft` / `--ink-on-cinema-soft` com ícone `PenTool` (`14px`) + `AUTORAL • Por {authorName}`.
  - `CURADORIA`: badge suave `--accent-tech-soft` / `--ink-on-tech-soft` com ícone `GitFork` (`14px`) + `CURADORIA • Fonte: {sourceName}` + link externo com `ExternalLink` (`14px`) e `<span className="sr-only"> (abre em nova aba)</span>`.
- **`TransparencyNotice` (obrigatório em `/noticia/[slug]` quando `contentType === 'CURADORIA'`):**
  - Bloco `<aside aria-label="Transparência editorial">` com borda esquerda `4px solid var(--accent-tech)`, fundo `--bg-surface-alt`, ícone `ShieldCheck` (`16px`) e texto padrão em `Plus Jakarta Sans` (`14px`):
    > *"Transparência editorial: esta matéria foi adaptada para o português pela redação do CritHit! a partir da apuração original publicada por **{sourceName}**, com revisão humana antes da publicação."*

### 6.5 `ReelCard`, `ReelsPlayer` e `CommentsDrawer` (`/reels`)

- **`ReelsPlayer`:**
  - Container vertical com `scroll-snap-type: y mandatory`, altura `h-[calc(100dvh-64px)]` no mobile e frame `9:16` (`max-w-[430px] aspect-[9/16] max-h-[820px]`) centralizado no desktop.
  - Barra de filtros no topo (`Todas`, `Games`, `Quadrinhos`, `Cinema`, `Animes`, `Tech`) com botões `aria-pressed={active}`. Estado vazio com botão `"Ver todas as editorias"` (zero emojis).
  - `IntersectionObserver` (`threshold: 0.65`) detecta o `ReelCard` ativo, atualiza indicador `X/Y`, barra de progresso e sincroniza a URL via `window.history.replaceState` para `/reels?id=<slug>` sem provocar scroll adicional.
  - Navegação por teclado no desktop: `ArrowDown` / `PageDown` avança 1 card; `ArrowUp` / `PageUp` retrocede 1 card (ignorando eventos quando o foco está em `INPUT`, `TEXTAREA` ou `SELECT` ou quando `CommentsDrawer` está aberto).
  - Sob `prefers-reduced-motion: reduce`, `scrollTo` usa `behavior: 'auto'`.
- **`ReelCard`:**
  - Fundo com imagem/ilustração editorial + scrim inferior (`linear-gradient(to top, var(--scrim-reels) 0%, rgba(9,10,15,0.88) 52%, transparent 100%)`) garantindo contraste $\ge 4.5:1$ (comprovado em `19.78:1` sobre `#090A0F`).
  - Exibe badge de editoria, `AttributionBadge` compacto (com link seguro `source_url`), manchete em `Barlow Condensed`, caixa de resumo (`reels_summary` em `Plus Jakarta Sans`) e CTA `"Ler matéria completa"` (`<Link href="/noticia/[slug]">`).
  - Stack lateral de ações (`Heart` Curtir, `MessageSquare` Comentar, `Bookmark` Salvar, `Share2` Compartilhar), cada botão com área mínima de toque **`44px x 44px`** (WCAG 2.5.5), `aria-pressed` nos toggles e contadores em `JetBrains Mono` $\ge 11px$.
- **`CommentsDrawer` (Modal/Gaveta Acessível):**
  - Elemento com `role="dialog"`, `aria-modal="true"`, `aria-labelledby="comments-drawer-title"`.
  - **Focus Trap:** ao abrir, move foco para o botão fechar ou campo de texto; `Tab` e `Shift+Tab` ciclam estritamente dentro do drawer; `Escape` ou clique no backdrop fecha o drawer e **devolve o foco** ao botão `Comentar` que o originou.
  - Formulário com limite de caracteres visível (ex.: `0/500`), validação acessível via `aria-describedby` e renderização declarativa em JSX (escape automático contra XSS).

### 6.6 `AdminSplitReview`, `PublishedArticleTable` e `PublishedArticleEditor` (`/admin`)

- **Autenticação & Layout:**
  - Tela de login `/admin` com campos acessíveis (`<label htmlFor>`, `aria-invalid`, `aria-describedby`), mensagens genéricas de erro em `--status-error-soft` / `--ink-on-error-soft` sem enumeração de usuário.
  - Abas principais com `role="tablist"` / `role="tab"` / `aria-selected`: **Fila de Revisão (`PENDING_REVIEW`)** e **Matérias Publicadas (`PUBLISHED` / `UNPUBLISHED`)**.
- **`AdminSplitReview` (Workbench Split-Screen):**
  - **Coluna Esquerda (Origem — Somente Leitura):** Badge `source_name`, lista de fontes cruzadas (`matched_sources`) com score `pgvector` em `JetBrains Mono`, link clicável `source_url` (`target="_blank" rel="noopener noreferrer"`), título e excerto originais sanitizados, e `editorial_notes` da IA.
  - **Coluna Direita (Rascunho Editável):** Inputs com labels explícitos para Manchete, `subheadline_bullets`, Lead, Corpo, `reels_summary`, Editoria, Formato (`NEWS | COLUMN | REVIEW`), Imagem de capa, Flags (`is_main_headline`, `is_urgent`), Data de agendamento (`scheduled_at`) e bloco destacado **Atribuição Obrigatória** (`author_name`, `content_type`, `source_name`, `source_url` com validação em tempo real de `http://`/`https://`).
  - **Barra de Ações:**
    - `Aprovar e Publicar` (`--fill-success` + `--ink-on-fill-success`, ícone `Check`).
    - `Agendar` (`--fill-info` + `--ink-on-fill-info`, ícone `CalendarClock`).
    - `Descartar` (`--bg-surface` + borda `--status-error`, ícone `Trash2`) com **confirmação em dois passos**.
- **`PublishedArticleTable` & `PublishedArticleEditor`:**
  - Filtro por status (`Todos`, `PUBLISHED`, `UNPUBLISHED`) + busca por título/slug.
  - Tabela responsiva listando manchete, editoria, status badge, indicador `Manchete Principal` (`Star`), `published_at`, métricas (`views`, `likes`) e ações (`Editar`, `Definir como Manchete Principal`, `Tirar do ar` / `Republicar`).
  - **Confirmação em Dois Passos (Segurança Editorial):** Ações destrutivas/de impacto (`Tirar do ar` e `Descartar`) abrem popover/diálogo inline ou `role="alertdialog"` exigindo confirmação explícita (*"Confirmar retirada do ar? O histórico e as métricas serão preservados."*), com foco inicial no botão `Cancelar` para evitar cliques acidentais.

---

## 7. Regras de Movimento Reduzido (`prefers-reduced-motion`)

Obrigatório em `app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .ticker-track {
    animation: none !important;
    transform: none !important;
  }

  .ticker-clone {
    display: none !important;
  }
}
```

---

## 8. Mapeamento Pronto para `tailwind.config.ts` e `app/globals.css`

### 8.1 `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          alt: 'var(--bg-surface-alt)',
          hover: 'var(--bg-surface-hover)',
        },
        chrome: {
          DEFAULT: 'var(--chrome-bg)',
          surface: 'var(--chrome-surface)',
          ink: 'var(--chrome-ink)',
          muted: 'var(--chrome-ink-muted)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          placeholder: 'var(--ink-placeholder)',
          inverse: 'var(--ink-inverse)',
          highlight: 'var(--ink-on-highlight)',
        },
        border: {
          strong: 'var(--border-strong)',
          input: 'var(--border-input)',
          subtle: 'var(--border-subtle)',
        },
        highlight: 'var(--highlight-comic)',
        brand: {
          DEFAULT: 'var(--accent-brand)',
          fill: 'var(--fill-brand)',
          soft: 'var(--accent-brand-soft)',
          softInk: 'var(--ink-on-brand-soft)',
        },
        editorial: {
          games: 'var(--accent-games)',
          gamesFill: 'var(--fill-games)',
          comics: 'var(--accent-comics)',
          comicsFill: 'var(--fill-comics)',
          cinema: 'var(--accent-cinema)',
          cinemaFill: 'var(--fill-cinema)',
          animes: 'var(--accent-animes)',
          animesFill: 'var(--fill-animes)',
          tech: 'var(--accent-tech)',
          techFill: 'var(--fill-tech)',
        },
        status: {
          success: 'var(--status-success)',
          successFill: 'var(--fill-success)',
          warning: 'var(--status-warning)',
          warningFill: 'var(--fill-warning)',
          error: 'var(--status-error)',
          errorFill: 'var(--fill-error)',
          info: 'var(--status-info)',
          infoFill: 'var(--fill-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        headline: ['var(--font-headline)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        reading: ['var(--font-reading)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'hard-sm': 'var(--shadow-hard-sm)',
        hard: 'var(--shadow-hard)',
        'hard-hover': 'var(--shadow-hard-hover)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 8.2 Utilitários Base e Salvaguardas (`app/globals.css`)

```css
@layer base {
  html {
    background-color: var(--bg-base);
    color: var(--ink-primary);
    font-family: var(--font-sans), sans-serif;
  }

  body {
    min-height: 100dvh;
    background-color: var(--bg-base);
    background-image: radial-gradient(var(--halftone-dot) 1.2px, transparent 1.2px);
    background-size: var(--halftone-size) var(--halftone-size);
    color: var(--ink-primary);
    overflow-x: hidden;
  }

  /* Anel de foco acessível global */
  :focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  /* Piso mínimo de legibilidade (11px) */
  [class*="text-[9px]"],
  [class*="text-[10px]"] {
    font-size: 0.6875rem !important;
  }
}

@layer components {
  .editorial-card {
    background-color: var(--bg-surface);
    border: 2px solid var(--border-strong);
    box-shadow: var(--shadow-hard);
    transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1),
                box-shadow 0.14s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .editorial-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hard-hover);
  }

  .editorial-btn {
    border: 2px solid var(--border-strong);
    box-shadow: var(--shadow-hard-sm);
    transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1),
                box-shadow 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .editorial-btn:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  .reels-scroller {
    scroll-snap-type: y mandatory;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
  }

  .reels-scroller::-webkit-scrollbar {
    display: none;
  }

  .reel-slide {
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
}
```
