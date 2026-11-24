import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  CATEGORIES,
  buildSafeUpsertPayload,
  loadEnvConfig,
  parseEnvContent,
  pickBalancedArticles,
  runAuthorCycle,
  runCurateCycle,
  stripUnicodeEmojis,
} from './editorial-autopilot.mjs';

test('parseEnvContent e stripUnicodeEmojis higienizam entradas corretamente', () => {
  const parsed = parseEnvContent(`
    # comentario
    LLM_CHAT_MODEL=gemini-3.5-flash
    ADMIN_SEED_NAME="Editor CritHit!"
  `);
  assert.equal(parsed.LLM_CHAT_MODEL, 'gemini-3.5-flash');
  assert.equal(parsed.ADMIN_SEED_NAME, 'Editor CritHit!');
  assert.equal(stripUnicodeEmojis('🔥 Novo jogo anunciado 🚀 em 2026!'), 'Novo jogo anunciado em 2026!');
});

test('pickBalancedArticles distribui até 8 matérias entre as 5 editorias e mantém o restante para agendamento', () => {
  const queue = [
    { id: 'g1', category: 'GAMES' },
    { id: 'g2', category: 'GAMES' },
    { id: 'g3', category: 'GAMES' },
    { id: 'g4', category: 'GAMES' },
    { id: 'c1', category: 'COMICS' },
    { id: 'c2', category: 'COMICS' },
    { id: 'm1', category: 'CINEMA' },
    { id: 'm2', category: 'CINEMA' },
    { id: 'a1', category: 'ANIMES' },
    { id: 't1', category: 'TECH' },
    { id: 't2', category: 'TECH' },
  ];

  const { immediate, scheduled } = pickBalancedArticles(queue, 8);
  assert.equal(immediate.length, 8);
  assert.equal(scheduled.length, 3);

  const representedCategories = new Set(immediate.map((i) => i.category));
  for (const cat of CATEGORIES) {
    assert.equal(representedCategories.has(cat), true, `Categoria ${cat} deve estar representada`);
  }
});

test('buildSafeUpsertPayload garante limites de manchete <= 85, zero emojis, 3 bullets e URL http(s)', () => {
  const payload = buildSafeUpsertPayload(
    {
      category: 'GAMES',
      editorialFormat: 'NEWS',
      attribution: {
        authorName: 'Rafael Mendes',
        contentType: 'CURADORIA',
        sourceName: 'Gematsu',
        sourceUrl: 'https://www.gematsu.com/tag/capcom',
      },
    },
    {
      headline:
        '🔥 Capcom revela novos detalhes técnicos da RE Engine para os próximos lançamentos globais em 2027 com suporte total 🚀',
      lead: '⚡ A produtora apresentou avanços de iluminação e performance.',
      subheadlineBullets: ['🎮 Ponto 1', '✨ Ponto 2'],
      bodyParagraphs: ['Primeiro parágrafo de contexto editorial sem clickbait.'],
      reelsSummary: '🔥 Resumo curto para o Reels com mais de vinte caracteres válidos.',
    },
    { publicSiteUrl: 'http://localhost:3000' },
  );

  assert.ok(payload.headline.length <= 85);
  assert.equal(payload.subheadlineBullets.length, 3);
  assert.doesNotMatch(payload.headline, /[\u{1F300}-\u{1FAFF}]/u);
  assert.doesNotMatch(payload.lead, /[\u{1F300}-\u{1FAFF}]/u);
  assert.equal(payload.sourceUrl, 'https://www.gematsu.com/tag/capcom');
  assert.equal(payload.contentType, 'CURADORIA');
});

test('runCurateCycle e runAuthorCycle executam contrato HTTP completo contra servidor local + LLM mock', async () => {
  const state = {
    triggered: false,
    approved: [],
    scheduled: [],
    createdManual: [],
  };

  const pendingItems = Array.from({ length: 10 }, (_, idx) => {
    const cat = CATEGORIES[idx % CATEGORIES.length];
    return {
      id: `art-${idx + 1}`,
      slug: `pauta-${idx + 1}`,
      status: 'PENDING_REVIEW',
      category: cat,
      editorialFormat: 'NEWS',
      headline: `Pauta inicial ${idx + 1} da editoria ${cat}`,
      subheadlineBullets: ['Detalhe inicial 1', 'Detalhe inicial 2'],
      lead: `Lead inicial completo da pauta ${idx + 1} para testes de integração.`,
      bodyParagraphs: [`Parágrafo original da pauta ${idx + 1} com contexto editorial.`],
      reelsSummary: `Resumo inicial para Reels da pauta ${idx + 1} com mais de vinte caracteres.`,
      tags: [cat],
      coverImageUrl: null,
      readingTimeMinutes: 3,
      reviewScore: null,
      isUrgent: false,
      rawTitle: `Original headline ${idx + 1}`,
      rawExcerpt: `Original excerpt ${idx + 1}`,
      matchedSources: [],
      attribution: {
        authorName: 'Redação CritHit!',
        contentType: 'CURADORIA',
        sourceName: 'Gematsu',
        sourceUrl: `https://www.gematsu.com/news-${idx + 1}`,
      },
    };
  });

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString('utf8');
    const body = bodyText ? JSON.parse(bodyText) : null;
    const url = new URL(req.url, 'http://127.0.0.1');

    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Mock Gemini OpenAI-compatible endpoint
    if (url.pathname === '/openai/chat/completions' && req.method === 'POST') {
      const promptText = body?.messages?.[1]?.content || '';
      const isReview = promptText.includes('"REVIEW"');
      const isColumn = promptText.includes('"COLUMN"');
      const payload = isReview
        ? {
            headline: 'Review: Novo RPG tático acerta no combate por turnos e no ritmo',
            lead: 'Nossa análise completa avalia sistema de classes, progressão e equilíbrio ao longo de 60 horas.',
            subheadlineBullets: [
              'Combate tático responsivo com combinações profundas',
              'Campanha de 60 horas mantém bom ritmo do início ao fim',
              'Interface pede ajustes menores nos menus de equipamento',
            ],
            bodyParagraphs: [
              'O gênero de RPG tático ganha um representante sólido neste ano com foco em clareza mecânica.',
              'Cada batalha recompensa posicionamento inteligente e sinergia entre personagens.',
              'A direção de arte e a trilha sonora sustentam a atmosfera sem pesar no desempenho.',
              'Mesmo com menus densos nas primeiras horas, a curva de aprendizado compensa.',
            ],
            reelsSummary:
              'Review autoral: novo RPG tático entrega combate afiado e campanha consistente de 60 horas.',
            tags: ['Review', 'RPG', 'Games'],
            readingTimeMinutes: 6,
            reviewScore: 9.1,
          }
        : isColumn
          ? {
              headline: 'Coluna: Como PCs portáteis trouxeram a otimização de volta ao PC',
              lead: 'Limites térmicos de 15W obrigaram estúdios a revisar compilação de shaders e uso de memória.',
              subheadlineBullets: [
                'Portáteis expuseram gargalos de compilação de shaders em jogos AAA',
                'Perfis gráficos escaláveis beneficiam também notebooks e GPUs de entrada',
                'Upscaling moderno virou padrão de engenharia multiplataforma',
              ],
              bodyParagraphs: [
                'Nos últimos anos, a popularização dos PCs portáteis mudou a conversa técnica na indústria.',
                'Rodar lançamentos atuais com envelope térmico reduzido exige disciplina real de otimização.',
                'Estúdios que ajustam streaming de texturas entregam ganhos imediatos em todo o ecossistema.',
                'O consumidor final é o maior beneficiado por builds mais estáveis no lançamento.',
              ],
              reelsSummary:
                'Coluna Tech: por que os PCs portáteis pressionaram os estúdios a otimizar jogos novamente.',
              tags: ['Coluna', 'Hardware', 'PC'],
              readingTimeMinutes: 5,
              reviewScore: null,
            }
          : {
              headline: 'Notícia refinada pela redação CritHit! sem clickbait',
              lead: 'Atualização verificada e adaptada ao português brasileiro com atribuição à fonte original.',
              subheadlineBullets: [
                'Fato principal confirmado pela fonte internacional',
                'Impacto direto para leitores e lançamentos no Brasil',
                'Contexto completo disponível na matéria principal',
              ],
              bodyParagraphs: [
                'A informação foi confirmada oficialmente nesta semana e repercutiu nas principais publicações.',
                'Segundo os detalhes divulgados, o cronograma prevê novas atualizações ao longo do trimestre.',
                'A redação segue acompanhando os próximos anúncios oficiais sobre o projeto.',
              ],
              reelsSummary:
                'Notícia refinada em PT-BR direto ao ponto com os três principais destaques da pauta.',
              tags: ['Geek', 'Curadoria'],
              readingTimeMinutes: 3,
              isUrgent: false,
            };

      return send(200, {
        model: body?.model || 'gemini-3.5-flash',
        choices: [{ message: { content: JSON.stringify(payload) } }],
      });
    }

    // Mock CritHit Spring Boot API
    if (url.pathname === '/api/v1/admin/auth/login' && req.method === 'POST') {
      assert.equal(body.email, 'admin@crithit.local');
      assert.equal(body.password, 'secret-test');
      return send(200, {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh-test',
        tokenType: 'Bearer',
        expiresInSeconds: 900,
        user: { id: 'u1', email: body.email, displayName: 'Editor Teste', role: 'ROLE_ADMIN' },
      });
    }

    assert.equal(req.headers.authorization, 'Bearer jwt-test-token');

    if (url.pathname === '/api/v1/admin/rss-sources/trigger' && req.method === 'POST') {
      state.triggered = true;
      return send(202, { triggered: true, message: 'Coleta disparada', startedAt: new Date().toISOString() });
    }

    if (url.pathname === '/api/v1/admin/articles' && req.method === 'GET') {
      return send(200, { content: pendingItems, totalElements: pendingItems.length });
    }

    if (url.pathname === '/api/v1/admin/articles' && req.method === 'POST') {
      const id = `manual-${state.createdManual.length + 1}`;
      const record = { id, slug: `autoral-${id}`, status: 'PENDING_REVIEW', ...body };
      state.createdManual.push(record);
      return send(201, record);
    }

    const detailMatch = url.pathname.match(/^\/api\/v1\/admin\/articles\/([^/]+)$/);
    if (detailMatch && req.method === 'GET') {
      const found = pendingItems.find((i) => i.id === detailMatch[1]);
      return found ? send(200, found) : send(404, { message: 'Not found' });
    }

    const approveMatch = url.pathname.match(/^\/api\/v1\/admin\/articles\/([^/]+)\/approve$/);
    if (approveMatch && req.method === 'POST') {
      const record = {
        id: approveMatch[1],
        slug: `slug-${approveMatch[1]}`,
        status: 'PUBLISHED',
        setAsMainHeadline: body.setAsMainHeadline,
        ...body.edits,
      };
      state.approved.push(record);
      return send(200, record);
    }

    const schedMatch = url.pathname.match(/^\/api\/v1\/admin\/articles\/([^/]+)\/schedule$/);
    if (schedMatch && req.method === 'POST') {
      const record = {
        id: schedMatch[1],
        slug: `slug-${schedMatch[1]}`,
        status: 'SCHEDULED',
        scheduledAt: body.scheduledAt,
        ...body.edits,
      };
      state.scheduled.push(record);
      return send(200, record);
    }

    return send(404, { message: `Rota não mapeada: ${req.method} ${url.pathname}` });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseConfig = {
    apiUrl: `http://127.0.0.1:${port}/api/v1`,
    publicSiteUrl: 'http://localhost:3000',
    adminEmail: 'admin@crithit.local',
    adminPassword: 'secret-test',
    llmBaseUrl: `http://127.0.0.1:${port}/openai`,
    llmApiKey: 'test-key',
    llmModel: 'gemini-3.5-flash',
    llmFallbackModels: ['gemini-2.5-flash'],
    llmTimeoutMs: 5000,
  };

  try {
    const silentLogger = { log() {}, warn() {}, error() {} };

    // 1) Testa modo curate (10 pendentes -> 8 publicadas balanceadas + 2 agendadas de 20 em 20 min)
    const curateResult = await runCurateCycle(
      baseConfig,
      { maxPublish: 8, scheduleStepMinutes: 20, rssWaitMs: 0 },
      { logger: silentLogger },
    );
    assert.equal(state.triggered, true);
    assert.equal(curateResult.published.length, 8);
    assert.equal(curateResult.scheduled.length, 2);
    assert.equal(state.approved[0].setAsMainHeadline, true);
    assert.equal(state.approved[1].setAsMainHeadline, false);

    const t1 = Date.parse(curateResult.scheduled[0].scheduledAt);
    const t2 = Date.parse(curateResult.scheduled[1].scheduledAt);
    assert.equal(Math.round((t2 - t1) / 60_000), 20);

    // 2) Testa modo author (cria 1 REVIEW com nota + 1 COLUMN autoral)
    const authorResult = await runAuthorCycle(
      baseConfig,
      { scheduleStepMinutes: 20 },
      { logger: silentLogger },
    );
    assert.equal(authorResult.created.length, 2);
    assert.equal(state.createdManual.length, 2);
    assert.equal(state.createdManual[0].contentType, 'AUTORAL');
    assert.equal(state.createdManual[0].editorialFormat, 'REVIEW');
    assert.equal(state.createdManual[0].reviewScore, 9.1);
    assert.equal(state.createdManual[1].contentType, 'AUTORAL');
    assert.equal(state.createdManual[1].editorialFormat, 'COLUMN');
    assert.equal(state.createdManual[1].reviewScore, null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('loadEnvConfig lê infra/.env e resolve gemini-3.5-flash sem expor chave', () => {
  const cfg = loadEnvConfig();
  assert.equal(cfg.llmModel, 'gemini-3.5-flash');
  assert.match(cfg.llmBaseUrl, /^https:\/\/generativelanguage\.googleapis\.com/);
});
