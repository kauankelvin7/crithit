import type { Page } from '@playwright/test';
import type {
  AdminArticleDetail,
  AdminArticleSummary,
  AdminUserDto,
  CommentDto,
  RssSourceDto,
} from '../../../src/lib/types';

export interface MockApiOptions {
  authenticated?: boolean;
}

const DEFAULT_ADMIN_USER: AdminUserDto = {
  id: '00000000-0000-4000-8000-000000000099',
  email: 'editor@crithit.com.br',
  displayName: 'Editor Chefe CritHit!',
  role: 'ROLE_ADMIN',
};

function createInitialAdminArticles(): AdminArticleDetail[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

  return [
    {
      id: 'pending-001',
      slug: 'fromsoftware-novo-projeto-acao-rpg-2027',
      status: 'PENDING_REVIEW',
      category: 'GAMES',
      editorialFormat: 'NEWS',
      headline: 'FromSoftware registra marca para novo RPG de ação focado em combate vertical',
      subheadlineBullets: [
        'Registro oficial apareceu no escritório de patentes do Japão nesta semana',
        'Diretor de arte de Sekiro lidera a nova equipe interna em Tóquio',
      ],
      lead: 'A FromSoftware registrou uma nova propriedade intelectual de RPG de ação no Japão com lançamento previsto para a próxima janela fiscal.',
      bodyParagraphs: [
        'O estúdio japonês FromSoftware protocolou novo registro de marca voltado a um título inédito de ação e aventura em terceira pessoa.',
        'Segundo fontes ouvidas pela imprensa especializada japonesa, a produção ocorre em paralelo ao suporte contínuo de Elden Ring.',
      ],
      reelsSummary:
        'FromSoftware registra nova marca de RPG de ação no Japão com equipe liderada por veteranos de Sekiro.',
      tags: ['FromSoftware', 'RPG', 'Japão'],
      coverImageUrl: null,
      coverArtKey: 'editorial-games-default',
      readingTimeMinutes: 3,
      reviewScore: null,
      isMainHeadline: false,
      isUrgent: false,
      viewsCount: 0,
      likesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      publishedAt: '',
      scheduledAt: null,
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'SUCCESS',
      attribution: {
        authorName: 'Redação CritHit!',
        contentType: 'CURADORIA',
        sourceName: 'Gematsu',
        sourceUrl: 'https://www.gematsu.com/fromsoftware-new-trademark-2026',
      },
      matchedSourcesCount: 2,
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
      rawTitle: 'FromSoftware files trademark for new vertical action RPG in Japan',
      rawExcerpt:
        'A new filing published by the Japanese Patent Office reveals an unannounced action RPG project.',
      editorialNotes: [
        'Confirmar nome oficial em português após anúncio da publisher.',
        'Fontes cruzadas corroboram a janela de anúncio.',
      ],
      matchedSources: [
        {
          id: 'ms-1',
          sourceName: 'Gematsu',
          sourceUrl: 'https://www.gematsu.com/fromsoftware-new-trademark-2026',
          originalTitle: 'FromSoftware files trademark for new vertical action RPG in Japan',
          originalExcerpt: 'Japanese Patent Office filing published this week.',
          similarityScore: 1.0,
          isPrimary: true,
          fetchedAt: hoursAgo(2),
        },
        {
          id: 'ms-2',
          sourceName: 'IGN',
          sourceUrl: 'https://www.ign.com/articles/fromsoftware-new-trademark',
          originalTitle: 'FromSoftware Registers Mysterious New Action RPG Trademark',
          originalExcerpt: 'New filing hints at vertical combat focus.',
          similarityScore: 0.914,
          isPrimary: false,
          fetchedAt: hoursAgo(1),
        },
      ],
    },
    {
      id: 'pending-002',
      slug: 'chainsaw-man-filme-reze-estreia-brasil',
      status: 'PENDING_REVIEW',
      category: 'ANIMES',
      editorialFormat: 'NEWS',
      headline: 'Filme de Chainsaw Man focado no arco da Reze ganha previsão de estreia no Brasil',
      subheadlineBullets: [
        'Distribuição nacional contará com sessões legendadas e dubladas em IMAX',
        'Estúdio MAPPA divulgou novo pôster promocional de produção',
      ],
      lead: 'A adaptação cinematográfica do arco da Reze de Chainsaw Man terá estreia confirmada nos cinemas brasileiros no segundo semestre.',
      bodyParagraphs: [
        'O estúdio MAPPA confirmou o calendário internacional do longa-metragem de Chainsaw Man, incluindo a janela de exibição para a América Latina.',
        'A produção adapta diretamente um dos arcos mais elogiados do mangá de Tatsuki Fujimoto.',
      ],
      reelsSummary:
        'Filme de Chainsaw Man (arco da Reze) ganha janela oficial no Brasil com sessões IMAX legendadas e dubladas.',
      tags: ['Chainsaw Man', 'MAPPA', 'Animes'],
      coverImageUrl: null,
      coverArtKey: 'editorial-animes-default',
      readingTimeMinutes: 2,
      reviewScore: null,
      isMainHeadline: false,
      isUrgent: false,
      viewsCount: 0,
      likesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      publishedAt: '',
      scheduledAt: null,
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'SUCCESS',
      attribution: {
        authorName: 'Redação CritHit!',
        contentType: 'CURADORIA',
        sourceName: 'Anime News Network',
        sourceUrl: 'https://www.animenewsnetwork.com/news/chainsaw-man-reze-movie-latam',
      },
      matchedSourcesCount: 1,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(2),
      rawTitle: 'Chainsaw Man Reze Arc Film Confirms Latin America Theatrical Window',
      rawExcerpt: 'MAPPA and regional distributors announce theatrical release window.',
      editorialNotes: ['Verificar data exata de pré-venda nas redes de cinema brasileiras.'],
      matchedSources: [
        {
          id: 'ms-3',
          sourceName: 'Anime News Network',
          sourceUrl: 'https://www.animenewsnetwork.com/news/chainsaw-man-reze-movie-latam',
          originalTitle: 'Chainsaw Man Reze Arc Film Confirms Latin America Theatrical Window',
          originalExcerpt: 'Theatrical release confirmed for second half of the year.',
          similarityScore: 1.0,
          isPrimary: true,
          fetchedAt: hoursAgo(3),
        },
      ],
    },
    {
      id: 'pending-003',
      slug: 'rumor-console-portatil-sem-confirmacao',
      status: 'PENDING_REVIEW',
      category: 'TECH',
      editorialFormat: 'NEWS',
      headline: 'Rumor não confirmado sobre novo console portátil circula em fóruns',
      subheadlineBullets: ['Nenhuma fonte primária confirmou o vazamento'],
      lead: 'Publicação anônima sugeriu especificações preliminares sem corroboração oficial de fabricantes.',
      bodyParagraphs: [
        'Um tópico em fórum internacional listou supostas especificações de hardware sem documentação verificável.',
      ],
      reelsSummary: 'Rumor não verificado sobre hardware portátil sem confirmação oficial.',
      tags: ['Hardware', 'Rumor'],
      coverImageUrl: null,
      coverArtKey: 'editorial-tech-default',
      readingTimeMinutes: 2,
      reviewScore: null,
      isMainHeadline: false,
      isUrgent: false,
      viewsCount: 0,
      likesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      publishedAt: '',
      scheduledAt: null,
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'FALLBACK_RAW',
      attribution: {
        authorName: 'Redação CritHit!',
        contentType: 'CURADORIA',
        sourceName: 'TechRadar',
        sourceUrl: 'https://www.techradar.com/gaming/rumor-handheld-console',
      },
      matchedSourcesCount: 1,
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
      rawTitle: 'Unverified handheld console rumor surfaces online',
      rawExcerpt: 'Forum post claims specs without official confirmation.',
      editorialNotes: ['Baixa confiabilidade — recomendado descartar na triagem.'],
      matchedSources: [],
    },
    {
      id: 'pub-001',
      slug: 'capcom-confirma-remake-dino-crisis-re-engine-2027',
      status: 'PUBLISHED',
      category: 'GAMES',
      editorialFormat: 'NEWS',
      headline: 'Capcom confirma remake de Dino Crisis para 2027 com motor RE Engine',
      subheadlineBullets: [
        'Projeto lidera nova divisão de sobrevivência da Capcom em Osaka',
        'Primeira demonstração jogável está prevista para a Tokyo Game Show',
      ],
      lead: 'A Capcom oficializou o desenvolvimento do remake completo de Dino Crisis para 2027 na RE Engine.',
      bodyParagraphs: [
        'A Capcom encerrou anos de especulação ao confirmar oficialmente o remake de Dino Crisis.',
      ],
      reelsSummary:
        'Capcom confirma remake de Dino Crisis para 2027 na RE Engine com foco em survival horror tático.',
      tags: ['Capcom', 'Dino Crisis'],
      coverImageUrl: null,
      coverArtKey: 'dino-survival',
      readingTimeMinutes: 4,
      reviewScore: null,
      isMainHeadline: true,
      isUrgent: true,
      viewsCount: 28450,
      likesCount: 1920,
      savesCount: 840,
      commentsCount: 2,
      publishedAt: hoursAgo(6),
      scheduledAt: null,
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'SUCCESS',
      attribution: {
        authorName: 'Rafael Mendes',
        contentType: 'CURADORIA',
        sourceName: 'Gematsu',
        sourceUrl: 'https://www.gematsu.com/dino-crisis-remake-announcement',
      },
      matchedSourcesCount: 2,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(6),
      rawTitle: 'Capcom officially announces Dino Crisis Remake for 2027',
      rawExcerpt: 'Built on RE Engine with revamped survival systems.',
      editorialNotes: [],
      matchedSources: [],
    },
    {
      id: 'pub-002',
      slug: 'larian-studios-confirma-dois-novos-rpgs-sem-dlc-bg3',
      status: 'PUBLISHED',
      category: 'GAMES',
      editorialFormat: 'NEWS',
      headline: "Larian Studios descarta DLC para Baldur's Gate 3 e detalha foco em dois novos RPGs",
      subheadlineBullets: [
        'Estúdio belga confirma que novas propriedades intelectuais já estão em pré-produção',
      ],
      lead: "A Larian Studios reafirmou que não produzirá expansões pagas para Baldur's Gate 3.",
      bodyParagraphs: [
        'Em entrevista coletiva, Swen Vincke explicou a estratégia para dois novos universos originais.',
      ],
      reelsSummary: "Larian confirma dois novos RPGs originais e reforça foco em suporte a mods de BG3.",
      tags: ['Larian Studios', 'RPG'],
      coverImageUrl: null,
      coverArtKey: 'gamepad',
      readingTimeMinutes: 3,
      reviewScore: null,
      isMainHeadline: false,
      isUrgent: true,
      viewsCount: 21300,
      likesCount: 1410,
      savesCount: 620,
      commentsCount: 1,
      publishedAt: hoursAgo(10),
      scheduledAt: null,
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'SUCCESS',
      attribution: {
        authorName: 'Marina Costa',
        contentType: 'CURADORIA',
        sourceName: 'Eurogamer',
        sourceUrl: 'https://www.eurogamer.net/larian-two-new-rpgs-update',
      },
      matchedSourcesCount: 1,
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(10),
      rawTitle: 'Larian Studios confirms two new original RPGs in development',
      rawExcerpt: 'No paid DLC for BG3.',
      editorialNotes: [],
      matchedSources: [],
    },
    {
      id: 'sched-001',
      slug: 'duna-messias-filmagens-imax-estreia-agendada',
      status: 'SCHEDULED',
      category: 'CINEMA',
      editorialFormat: 'NEWS',
      headline: 'Duna: Messias encerra filmagens em IMAX e ganha cronograma especial de trailers',
      subheadlineBullets: [
        'Denis Villeneuve confirmou trilha inédita gravada em Londres',
        'Primeiras prévias serão exibidas em salas selecionadas',
      ],
      lead: 'A produção de Duna: Messias concluiu as gravações principais com câmeras IMAX de nova geração.',
      bodyParagraphs: [
        'O longa-metragem dirigido por Denis Villeneuve entra agora na fase final de pós-produção.',
      ],
      reelsSummary: 'Duna: Messias conclui filmagens em IMAX e inicia etapa de pós-produção.',
      tags: ['Duna', 'Cinema', 'IMAX'],
      coverImageUrl: null,
      coverArtKey: 'cinema',
      readingTimeMinutes: 3,
      reviewScore: null,
      isMainHeadline: false,
      isUrgent: false,
      viewsCount: 0,
      likesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      publishedAt: '',
      scheduledAt: new Date(now + 24 * 3_600_000).toISOString(),
      unpublishedAt: null,
      discardedAt: null,
      aiStatus: 'MANUAL',
      attribution: {
        authorName: 'Camila Rocha',
        contentType: 'AUTORAL',
        sourceName: 'CritHit! Redação',
        sourceUrl: 'https://crithit.com.br/redacao',
      },
      matchedSourcesCount: 0,
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
      rawTitle: null,
      rawExcerpt: null,
      editorialNotes: [],
      matchedSources: [],
    },
  ];
}

function toSummary(detail: AdminArticleDetail): AdminArticleSummary {
  const { bodyParagraphs: _b, rawTitle: _rt, rawExcerpt: _re, editorialNotes: _en, matchedSources: _ms, ...summary } = detail;
  return summary;
}

export async function setupApiMocks(page: Page, options: MockApiOptions = {}) {
  let isAuthenticated = Boolean(options.authenticated);
  const articles: AdminArticleDetail[] = createInitialAdminArticles();
  const rssSources: RssSourceDto[] = [
    {
      id: 'rss-1',
      name: 'Gematsu',
      feedUrl: 'https://www.gematsu.com/feed',
      siteUrl: 'https://www.gematsu.com',
      language: 'en',
      defaultCategory: 'GAMES',
      active: true,
      consecutiveFailures: 0,
      circuitOpenUntil: null,
      lastFetchedAt: new Date(Date.now() - 600_000).toISOString(),
      lastErrorMessage: null,
    },
  ];

  const commentsByArticle: Record<string, CommentDto[]> = {
    '10000000-0000-4000-8000-000000000001': [
      {
        id: 'c-init-1',
        articleId: '10000000-0000-4000-8000-000000000001',
        authorDisplayName: 'Lucas F.',
        body: 'Dino Crisis na RE Engine era o remake que faltava na Capcom.',
        createdAt: new Date(Date.now() - 1_800_000).toISOString(),
      },
      {
        id: 'c-init-2',
        articleId: '10000000-0000-4000-8000-000000000001',
        authorDisplayName: 'Mariana T.',
        body: 'Se mantiver a tensão do original com o controle moderno de RE2 Remake, já é candidato a jogo do ano.',
        createdAt: new Date(Date.now() - 900_000).toISOString(),
      },
    ],
    '10000000-0000-4000-8000-000000000002': [
      {
        id: 'c-init-3',
        articleId: '10000000-0000-4000-8000-000000000002',
        authorDisplayName: 'Diego R.',
        body: 'A fase Ultimate tem sido a melhor porta de entrada da Marvel em mais de uma década.',
        createdAt: new Date(Date.now() - 3_200_000).toISOString(),
      },
    ],
    '10000000-0000-4000-8000-000000000004': [
      {
        id: 'c-init-4',
        articleId: '10000000-0000-4000-8000-000000000004',
        authorDisplayName: 'Renata S.',
        body: 'Evan Call e a equipe original da Madhouse juntos de novo garantem o mesmo nível da primeira temporada.',
        createdAt: new Date(Date.now() - 2_600_000).toISOString(),
      },
    ],
  };

  const likedState: Record<string, boolean> = {};
  const likesCountState: Record<string, number> = {
    '10000000-0000-4000-8000-000000000001': 1920,
    '10000000-0000-4000-8000-000000000005': 2410,
  };
  const savedState: Record<string, boolean> = {};
  const savesCountState: Record<string, number> = {
    '10000000-0000-4000-8000-000000000001': 840,
    '10000000-0000-4000-8000-000000000005': 1150,
  };

  // Newsletter
  await page.route('**/api/public/newsletter/subscribe', async (route) => {
    const payload = route.request().postDataJSON() as { email?: string } | null;
    if (!payload?.email || !payload.email.includes('@')) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Informe um e-mail válido.' }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Inscrição confirmada! Você receberá o resumo diário da redação.',
      }),
    });
  });

  // Public Like / Save / Comments
  await page.route('**/api/public/articles/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const match = url.pathname.match(/\/api\/public\/articles\/([^/]+)\/(like|save|comments)$/);
    if (!match) {
      return route.continue();
    }
    const [, articleId, action] = match;

    if (action === 'like' && method === 'POST') {
      const next = !likedState[articleId];
      likedState[articleId] = next;
      const base = likesCountState[articleId] ?? 100;
      const nextCount = next ? base + 1 : Math.max(0, base - 1);
      likesCountState[articleId] = nextCount;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ liked: next, likesCount: nextCount }),
      });
    }

    if (action === 'save' && method === 'POST') {
      const next = !savedState[articleId];
      savedState[articleId] = next;
      const base = savesCountState[articleId] ?? 50;
      const nextCount = next ? base + 1 : Math.max(0, base - 1);
      savesCountState[articleId] = nextCount;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ saved: next, savesCount: nextCount }),
      });
    }

    if (action === 'comments' && method === 'GET') {
      const list = commentsByArticle[articleId] ?? [];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: list, totalElements: list.length }),
      });
    }

    if (action === 'comments' && method === 'POST') {
      const body = route.request().postDataJSON() as {
        authorDisplayName?: string;
        body?: string;
      };
      const created: CommentDto = {
        id: `c-${Date.now()}`,
        articleId,
        authorDisplayName: body.authorDisplayName ?? 'Leitor',
        body: body.body ?? '',
        createdAt: new Date().toISOString(),
      };
      commentsByArticle[articleId] = [created, ...(commentsByArticle[articleId] ?? [])];
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    }

    return route.continue();
  });

  // BFF Auth
  await page.route('**/api/bff/auth/me', async (route) => {
    if (!isAuthenticated) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Não autenticado.' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: DEFAULT_ADMIN_USER }),
    });
  });

  await page.route('**/api/bff/auth/login', async (route) => {
    const payload = route.request().postDataJSON() as { email?: string; password?: string } | null;
    if (payload?.email === 'editor@crithit.com.br' && payload?.password === 'CritHit#2026') {
      isAuthenticated = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie':
            'crithit_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGl0b3JAZXhhbXBsZS5jb20ifQ.signature; HttpOnly; SameSite=Lax; Path=/; Max-Age=900',
        },
        body: JSON.stringify({ user: DEFAULT_ADMIN_USER }),
      });
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Credenciais inválidas.' }),
    });
  });

  await page.route('**/api/bff/auth/logout', async (route) => {
    isAuthenticated = false;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Set-Cookie': 'crithit_access_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
      },
      body: JSON.stringify({ ok: true }),
    });
  });

  // BFF Admin Endpoints
  await page.route('**/api/bff/admin/**', async (route) => {
    if (!isAuthenticated) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Sessão expirada.' }),
      });
    }

    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace(/^\/api\/bff\/admin/, '');

    // Listagem de artigos por status
    if (path === '/articles' && method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const filtered = statusFilter
        ? articles.filter((a) => a.status === statusFilter)
        : articles;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: filtered.map(toSummary),
          page: 0,
          size: 30,
          totalElements: filtered.length,
          totalPages: 1,
        }),
      });
    }

    // Criação manual de matéria autoral
    if (path === '/articles' && method === 'POST') {
      const payload = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
      const headline = String(payload.headline ?? 'Nova matéria autoral');
      const slug = headline
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const nowIso = new Date().toISOString();
      const cat = (payload.category as AdminArticleDetail['category']) ?? 'GAMES';
      const created: AdminArticleDetail = {
        id: `manual-${Date.now()}`,
        slug: slug || `materia-${Date.now()}`,
        status: 'PENDING_REVIEW',
        aiStatus: 'MANUAL',
        category: cat,
        editorialFormat: (payload.editorialFormat as AdminArticleDetail['editorialFormat']) ?? 'COLUMN',
        headline,
        subheadlineBullets: (payload.subheadlineBullets as string[]) ?? [],
        lead: String(payload.lead ?? ''),
        bodyParagraphs: (payload.bodyParagraphs as string[]) ?? [],
        reelsSummary: String(payload.reelsSummary ?? ''),
        tags: (payload.tags as string[]) ?? [],
        coverImageUrl: (payload.coverImageUrl as string | null) ?? null,
        coverArtKey: `editorial-${cat.toLowerCase()}-default`,
        readingTimeMinutes: Number(payload.readingTimeMinutes ?? 3),
        reviewScore: (payload.reviewScore as number | null) ?? null,
        isMainHeadline: false,
        isUrgent: Boolean(payload.isUrgent),
        viewsCount: 0,
        likesCount: 0,
        savesCount: 0,
        commentsCount: 0,
        publishedAt: '',
        scheduledAt: null,
        unpublishedAt: null,
        discardedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        matchedSourcesCount: 0,
        rawTitle: null,
        rawExcerpt: null,
        editorialNotes: [],
        matchedSources: [],
        attribution: {
          authorName: String(payload.authorName ?? DEFAULT_ADMIN_USER.displayName),
          contentType: (payload.contentType as 'AUTORAL' | 'CURADORIA') ?? 'AUTORAL',
          sourceName: String(payload.sourceName ?? 'CritHit! Redação'),
          sourceUrl: String(payload.sourceUrl ?? 'https://crithit.com.br/redacao'),
        },
      };
      articles.unshift(created);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    }

    // Detalhe / Edição de artigo
    const detailMatch = path.match(/^\/articles\/([^/]+)$/);
    if (detailMatch) {
      const id = decodeURIComponent(detailMatch[1]);
      const item = articles.find((a) => a.id === id);
      if (!item) {
        return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Não encontrado.' }) });
      }
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }
      if (method === 'PUT') {
        const edits = route.request().postDataJSON() as Record<string, unknown>;
        Object.assign(item, {
          headline: edits.headline ?? item.headline,
          lead: edits.lead ?? item.lead,
          subheadlineBullets: edits.subheadlineBullets ?? item.subheadlineBullets,
          bodyParagraphs: edits.bodyParagraphs ?? item.bodyParagraphs,
          reelsSummary: edits.reelsSummary ?? item.reelsSummary,
          category: edits.category ?? item.category,
          editorialFormat: edits.editorialFormat ?? item.editorialFormat,
          attribution: {
            authorName: (edits.authorName as string) ?? item.attribution.authorName,
            contentType: (edits.contentType as 'AUTORAL' | 'CURADORIA') ?? item.attribution.contentType,
            sourceName: (edits.sourceName as string) ?? item.attribution.sourceName,
            sourceUrl: (edits.sourceUrl as string) ?? item.attribution.sourceUrl,
          },
          updatedAt: new Date().toISOString(),
        });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }
    }

    // Ações editoriais
    const actionMatch = path.match(
      /^\/articles\/([^/]+)\/(approve|schedule|cancel-schedule|discard|main-headline|unpublish|republish)$/,
    );
    if (actionMatch && (method === 'POST' || (method === 'PATCH' && actionMatch[2] === 'main-headline'))) {
      const id = decodeURIComponent(actionMatch[1]);
      const action = actionMatch[2];
      const item = articles.find((a) => a.id === id);
      if (!item) {
        return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Não encontrado.' }) });
      }

      if (action === 'approve') {
        const body = (route.request().postDataJSON() ?? {}) as {
          setAsMainHeadline?: boolean;
          edits?: Record<string, unknown>;
        };
        if (body.edits) {
          item.headline = (body.edits.headline as string) ?? item.headline;
          item.attribution = {
            authorName: (body.edits.authorName as string) ?? item.attribution.authorName,
            contentType:
              (body.edits.contentType as 'AUTORAL' | 'CURADORIA') ?? item.attribution.contentType,
            sourceName: (body.edits.sourceName as string) ?? item.attribution.sourceName,
            sourceUrl: (body.edits.sourceUrl as string) ?? item.attribution.sourceUrl,
          };
        }
        item.status = 'PUBLISHED';
        item.publishedAt = new Date().toISOString();
        if (body.setAsMainHeadline) {
          articles.forEach((a) => {
            a.isMainHeadline = a.id === item.id;
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'schedule') {
        const body = (route.request().postDataJSON() ?? {}) as { scheduledAt?: string };
        item.status = 'SCHEDULED';
        item.scheduledAt = body.scheduledAt ?? new Date(Date.now() + 86_400_000).toISOString();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'cancel-schedule') {
        item.status = 'PENDING_REVIEW';
        item.scheduledAt = null;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'discard') {
        item.status = 'DISCARDED';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'main-headline') {
        articles.forEach((a) => {
          a.isMainHeadline = a.id === item.id;
        });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'unpublish') {
        item.status = 'UNPUBLISHED';
        item.isMainHeadline = false;
        item.unpublishedAt = new Date().toISOString();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }

      if (action === 'republish') {
        item.status = 'PUBLISHED';
        item.unpublishedAt = null;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(item),
        });
      }
    }

    // RSS Sources
    if (path === '/rss-sources' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rssSources),
      });
    }

    const rssUpdateMatch = path.match(/^\/rss-sources\/([^/]+)$/);
    if (rssUpdateMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = decodeURIComponent(rssUpdateMatch[1]);
      const source = rssSources.find((s) => s.id === id);
      if (!source) {
        return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Fonte não encontrada.' }) });
      }
      const body = (route.request().postDataJSON() ?? {}) as { active?: boolean };
      if (typeof body.active === 'boolean') {
        source.active = body.active;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(source),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  // Mock de upload de capa local no /admin
  await page.route('**/api/bff/media/upload', async (route) => {
    if (!isAuthenticated) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Não autenticado' }),
      });
    }
    const origin = new URL(route.request().url()).origin;
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        url: `${origin}/api/media/mock-upload.png`,
        filename: 'mock-upload.png',
        mimeType: 'image/png',
        size: 68,
      }),
    });
  });

  await page.route('**/api/media/mock-upload.png', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
  });

  return {
    articles,
    commentsByArticle,
    getAuthenticated: () => isAuthenticated,
  };
}
