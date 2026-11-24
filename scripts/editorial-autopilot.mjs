#!/usr/bin/env node
/**
 * CritHit! — Agente Jornalista & Automação Editorial (OpenBot + Gemini)
 *
 * Modos suportados:
 *   --mode=curate  -> Login, trigger RSS, leitura de PENDING_REVIEW, polimento via Gemini,
 *                     publicação imediata balanceada (até 8 entre as 5 editorias) e agendamento
 *                     das demais em intervalos de 20 minutos.
 *   --mode=author  -> Geração via Gemini de 2 matérias autorais (1 REVIEW com nota 0-10 + 1 COLUMN)
 *                     criadas em POST /admin/articles (publica a 1ª e agenda a 2ª).
 *   --mode=live    -> Ciclo contínuo a cada 15 minutos mantendo coleta, curadoria e agendamento.
 *
 * Flags opcionais:
 *   --dry-run                   Não executa mutações na API (imprime prévia sanitizada)
 *   --max-publish=8             Limite de publicações imediatas no modo curate
 *   --schedule-step-minutes=20  Intervalo entre matérias agendadas (minutos)
 *   --interval-minutes=15       Intervalo do modo live (minutos)
 *   --rss-wait-ms=5000          Espera após disparo RSS antes de ler PENDING_REVIEW
 *   --env-file=infra/.env       Caminho alternativo do arquivo .env
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const CATEGORIES = ['GAMES', 'COMICS', 'CINEMA', 'ANIMES', 'TECH'];

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{FE0F}\u{200D}]/gu;

const CATEGORY_AUTHORS = {
  GAMES: 'Rafael Mendes',
  COMICS: 'Lucas Andrade',
  CINEMA: 'Camila Rocha',
  ANIMES: 'Thiago Sato',
  TECH: 'Marina Costa',
};

const AUTHOR_PROMPTS = [
  {
    editorialFormat: 'REVIEW',
    category: 'GAMES',
    authorName: 'Rafael Mendes',
    topic:
      'Review analítico e original de um RPG tático moderno focado em combate por turnos, progressão de equipe e ritmo de campanha de 60+ horas',
  },
  {
    editorialFormat: 'COLUMN',
    category: 'TECH',
    authorName: 'Marina Costa',
    topic:
      'Coluna analítica sobre como PCs portáteis de baixo consumo e tecnologias de upscaling mudaram a otimização de jogos modernos',
  },
];

export function parseEnvContent(content) {
  const result = {};
  for (const rawLine of String(content || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function loadEnvConfig(envFilePath = path.join(REPO_ROOT, 'infra', '.env')) {
  let fileVars = {};
  if (fs.existsSync(envFilePath)) {
    fileVars = parseEnvContent(fs.readFileSync(envFilePath, 'utf8'));
  }
  const merged = { ...fileVars };
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && v !== '') {
      merged[k] = v;
    }
  }

  const apiPort = merged.API_PORT || '8080';
  const apiUrl = (merged.CRITHIT_API_URL || `http://localhost:${apiPort}/api/v1`).replace(
    /\/+$/,
    '',
  );
  const publicSiteUrl = (
    merged.APP_WEB_PUBLIC_URL ||
    merged.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  return {
    apiUrl,
    publicSiteUrl,
    adminEmail: merged.ADMIN_SEED_EMAIL || 'admin@crithit.local',
    adminPassword: merged.ADMIN_SEED_PASSWORD || '',
    llmBaseUrl: (
      merged.LLM_PROVIDER_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    ).replace(/\/+$/, ''),
    llmApiKey: merged.LLM_API_KEY || '',
    llmModel: merged.LLM_CHAT_MODEL || 'gemini-3.5-flash',
    llmFallbackModels: (
      merged.LLM_FALLBACK_MODELS || 'gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest'
    )
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
    llmTimeoutMs: Number(merged.LLM_TIMEOUT_MS || 25000),
  };
}

export function parseCliArgs(argv) {
  const args = {
    mode: 'curate',
    dryRun: false,
    maxPublish: 8,
    scheduleStepMinutes: 20,
    intervalMinutes: 15,
    rssWaitMs: 5000,
    envFile: path.join(REPO_ROOT, 'infra', '.env'),
  };

  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token.startsWith('--mode=')) {
      args.mode = token.slice('--mode='.length).trim().toLowerCase();
    } else if (token.startsWith('--max-publish=')) {
      args.maxPublish = Math.max(1, Number(token.slice('--max-publish='.length)) || 8);
    } else if (token.startsWith('--schedule-step-minutes=')) {
      args.scheduleStepMinutes = Math.max(
        1,
        Number(token.slice('--schedule-step-minutes='.length)) || 20,
      );
    } else if (token.startsWith('--interval-minutes=')) {
      args.intervalMinutes = Math.max(
        1,
        Number(token.slice('--interval-minutes='.length)) || 15,
      );
    } else if (token.startsWith('--rss-wait-ms=')) {
      args.rssWaitMs = Math.max(0, Number(token.slice('--rss-wait-ms='.length)) || 0);
    } else if (token.startsWith('--env-file=')) {
      args.envFile = path.resolve(REPO_ROOT, token.slice('--env-file='.length));
    }
  }

  return args;
}

export function stripUnicodeEmojis(text) {
  return String(text || '')
    .replace(EMOJI_REGEX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function truncateText(text, maxLen) {
  const clean = stripUnicodeEmojis(text);
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, Math.max(1, maxLen - 1)).trim();
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxLen * 0.65)) {
    return `${sliced.slice(0, lastSpace).trim()}`;
  }
  return sliced;
}

export function isValidHttpUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Seleciona até `maxCount` matérias equilibrando as 5 editorias (round-robin por categoria),
 * devolvendo `{ immediate, scheduled }` sem perder nenhum item da fila.
 */
export function pickBalancedArticles(articles, maxCount = 8) {
  const buckets = new Map(CATEGORIES.map((c) => [c, []]));
  const extra = [];

  for (const item of articles) {
    const cat = CATEGORIES.includes(item.category) ? item.category : null;
    if (cat) {
      buckets.get(cat).push(item);
    } else {
      extra.push(item);
    }
  }

  const immediate = [];
  let addedInRound = true;
  while (immediate.length < maxCount && addedInRound) {
    addedInRound = false;
    for (const cat of CATEGORIES) {
      if (immediate.length >= maxCount) break;
      const list = buckets.get(cat);
      if (list && list.length > 0) {
        immediate.push(list.shift());
        addedInRound = true;
      }
    }
  }

  while (immediate.length < maxCount && extra.length > 0) {
    immediate.push(extra.shift());
  }

  const scheduled = [];
  for (const cat of CATEGORIES) {
    scheduled.push(...buckets.get(cat));
  }
  scheduled.push(...extra);

  return { immediate, scheduled };
}

function extractJsonObject(rawText) {
  const trimmed = String(rawText || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Resposta do modelo não contém objeto JSON válido.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function callGeminiJson(config, systemPrompt, userPrompt, { fetchImpl = fetch } = {}) {
  if (!config.llmApiKey) {
    throw new Error('LLM_API_KEY não configurada.');
  }

  const modelsToTry = [
    config.llmModel,
    ...config.llmFallbackModels.filter((m) => m !== config.llmModel),
  ];

  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.llmTimeoutMs);
      try {
        const res = await fetchImpl(`${config.llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.llmApiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        const text = await res.text();
        if (res.ok) {
          const parsedEnvelope = JSON.parse(text);
          const content = parsedEnvelope?.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error(`Modelo ${model} retornou resposta vazia.`);
          }
          return {
            data: extractJsonObject(content),
            modelUsed: parsedEnvelope.model || model,
          };
        }

        lastError = new Error(`Gemini HTTP ${res.status} (${model}): ${text.slice(0, 220)}`);
        if ((res.status === 503 || res.status === 429) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        if (res.status === 503 || res.status === 429 || res.status === 404) {
          break; // tenta próximo modelo de fallback
        }
        throw lastError;
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError || new Error('Falha ao consultar API do Gemini.');
}

export function buildSafeUpsertPayload(detail, aiDraft, config) {
  const category = CATEGORIES.includes(aiDraft?.category)
    ? aiDraft.category
    : CATEGORIES.includes(detail.category)
      ? detail.category
      : 'GAMES';

  const contentType = detail.attribution?.contentType === 'AUTORAL' ? 'AUTORAL' : 'CURADORIA';
  const editorialFormat = ['NEWS', 'COLUMN', 'REVIEW'].includes(aiDraft?.editorialFormat)
    ? aiDraft.editorialFormat
    : detail.editorialFormat || 'NEWS';

  const headline = truncateText(
    aiDraft?.headline || detail.headline || detail.rawTitle || 'Atualização editorial CritHit!',
    85,
  );

  let lead = stripUnicodeEmojis(aiDraft?.lead || detail.lead || detail.rawExcerpt || headline);
  if (lead.length < 20) {
    lead = `${lead} Confira os principais detalhes apurados pela redação CritHit!.`;
  }

  const rawBullets = Array.isArray(aiDraft?.subheadlineBullets)
    ? aiDraft.subheadlineBullets
    : Array.isArray(detail.subheadlineBullets)
      ? detail.subheadlineBullets
      : [];
  const bullets = rawBullets
    .map((b) => truncateText(b, 140))
    .filter(Boolean)
    .slice(0, 3);
  while (bullets.length < 3) {
    if (bullets.length === 0) bullets.push(truncateText(lead, 120));
    else if (bullets.length === 1)
      bullets.push(`Cobertura na editoria ${category} revisada pela redação CritHit!.`);
    else bullets.push('Detalhes completos e contexto na íntegra da matéria.');
  }

  const rawBody = Array.isArray(aiDraft?.bodyParagraphs)
    ? aiDraft.bodyParagraphs
    : Array.isArray(detail.bodyParagraphs)
      ? detail.bodyParagraphs
      : [];
  const bodyParagraphs = rawBody.map(stripUnicodeEmojis).filter((p) => p.length >= 15);
  if (bodyParagraphs.length === 0) {
    bodyParagraphs.push(lead);
  }

  let reelsSummary = truncateText(aiDraft?.reelsSummary || detail.reelsSummary || lead, 320);
  if (reelsSummary.length < 20) {
    reelsSummary = truncateText(`${headline}. ${lead}`, 320);
  }

  const tags = (Array.isArray(aiDraft?.tags) ? aiDraft.tags : detail.tags || [category])
    .map(stripUnicodeEmojis)
    .filter(Boolean)
    .slice(0, 5);

  const sourceName =
    stripUnicodeEmojis(detail.attribution?.sourceName) ||
    (contentType === 'AUTORAL' ? 'CritHit! Redação' : 'Fonte Verificada');

  const candidateSourceUrl = detail.attribution?.sourceUrl;
  const sourceUrl = isValidHttpUrl(candidateSourceUrl)
    ? candidateSourceUrl.trim()
    : `${config.publicSiteUrl}/redacao`;

  const coverImageUrl = isValidHttpUrl(detail.coverImageUrl) ? detail.coverImageUrl.trim() : null;

  const authorName =
    stripUnicodeEmojis(aiDraft?.authorName || detail.attribution?.authorName) ||
    CATEGORY_AUTHORS[category] ||
    'Rafael Mendes';

  let reviewScore = null;
  if (editorialFormat === 'REVIEW') {
    const rawScore = Number(aiDraft?.reviewScore ?? detail.reviewScore);
    if (!Number.isNaN(rawScore) && rawScore >= 0 && rawScore <= 10) {
      reviewScore = Number(rawScore.toFixed(1));
    } else {
      reviewScore = 8.5;
    }
  }

  const readingTimeMinutes = Math.max(
    1,
    Math.min(
      60,
      Number(aiDraft?.readingTimeMinutes || detail.readingTimeMinutes) ||
        Math.max(2, Math.ceil(bodyParagraphs.join(' ').split(/\s+/).length / 180)),
    ),
  );

  return {
    headline: headline.length >= 5 ? headline : 'Atualização da redação CritHit!',
    subheadlineBullets: bullets,
    lead,
    bodyParagraphs,
    reelsSummary,
    category,
    editorialFormat,
    tags,
    coverImageUrl,
    readingTimeMinutes,
    reviewScore,
    isUrgent: Boolean(aiDraft?.isUrgent ?? detail.isUrgent),
    authorName: authorName.length >= 2 ? authorName : 'Redação CritHit!',
    contentType,
    sourceName: sourceName.length >= 2 ? sourceName : 'CritHit! Redação',
    sourceUrl,
  };
}

class CritHitApiClient {
  constructor(config, { fetchImpl = fetch } = {}) {
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.accessToken = null;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (this.accessToken && !options.skipAuth) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const res = await this.fetchImpl(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      const msg = json?.message || json?.error || text.slice(0, 200) || `HTTP ${res.status}`;
      throw new Error(`API ${options.method || 'GET'} ${endpoint} falhou (${res.status}): ${msg}`);
    }
    return json;
  }

  async login() {
    if (!this.config.adminPassword) {
      throw new Error('ADMIN_SEED_PASSWORD não configurada para autenticação na API.');
    }
    const auth = await this.request('/admin/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        email: this.config.adminEmail,
        password: this.config.adminPassword,
      }),
    });
    if (!auth?.accessToken) {
      throw new Error('Login retornou resposta sem accessToken.');
    }
    this.accessToken = auth.accessToken;
    return auth;
  }

  triggerRss() {
    return this.request('/admin/rss-sources/trigger', { method: 'POST' });
  }

  listPendingReview(size = 50) {
    return this.request(`/admin/articles?status=PENDING_REVIEW&page=0&size=${size}`, {
      method: 'GET',
    });
  }

  getArticleDetail(id) {
    return this.request(`/admin/articles/${encodeURIComponent(id)}`, { method: 'GET' });
  }

  approveArticle(id, edits, setAsMainHeadline = false) {
    return this.request(`/admin/articles/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ setAsMainHeadline, edits }),
    });
  }

  scheduleArticle(id, scheduledAtIso, edits) {
    return this.request(`/admin/articles/${encodeURIComponent(id)}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt: scheduledAtIso, edits }),
    });
  }

  createManualArticle(payload) {
    return this.request('/admin/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

const CURATE_SYSTEM_PROMPT = [
  'Você é editor-chefe do portal brasileiro de jornalismo geek CritHit!.',
  'Reescreva e refine a matéria recebida para PT-BR natural, direto, sem clickbait, sem sensacionalismo e ZERO emojis Unicode.',
  'Retorne EXCLUSIVAMENTE um objeto JSON válido com as chaves:',
  'headline (string, máximo 85 caracteres, objetiva),',
  'lead (string, 1 a 2 frases claras com o fato principal, mínimo 40 caracteres),',
  'subheadlineBullets (array com EXATAMENTE 3 strings curtas que resumam a notícia em 10 segundos),',
  'bodyParagraphs (array com 3 a 4 parágrafos jornalísticos claros em PT-BR),',
  'reelsSummary (string de 80 a 280 caracteres para leitura rápida no Reels),',
  'category (uma entre: GAMES, COMICS, CINEMA, ANIMES, TECH),',
  'tags (array de 2 a 4 tags curtas),',
  'readingTimeMinutes (inteiro entre 2 e 8),',
  'isUrgent (boolean, true apenas se for anúncio oficial de grande impacto).',
].join(' ');

const AUTHOR_SYSTEM_PROMPT = [
  'Você é jornalista sênior da redação CritHit! no Brasil.',
  'Escreva uma matéria AUTORAL original em PT-BR natural, analítica, sem clickbait e com ZERO emojis Unicode.',
  'Retorne EXCLUSIVAMENTE um objeto JSON válido com as chaves:',
  'headline (string, máximo 85 caracteres),',
  'lead (string clara com mínimo 50 caracteres),',
  'subheadlineBullets (array com EXATAMENTE 3 pontos curtos que resumem o texto em 10 segundos),',
  'bodyParagraphs (array com 4 parágrafos aprofundados em PT-BR),',
  'reelsSummary (string de 90 a 280 caracteres),',
  'tags (array de 3 a 4 tags),',
  'readingTimeMinutes (inteiro entre 4 e 8),',
  'reviewScore (número de 7.0 a 9.6 com 1 casa decimal se for REVIEW, ou null se for COLUMN).',
].join(' ');

async function polishCuratedArticle(config, detail, { fetchImpl = fetch, logger = console } = {}) {
  const userPrompt = JSON.stringify({
    categoriaAtual: detail.category,
    fonte: detail.attribution?.sourceName,
    tituloOriginal: detail.rawTitle || detail.headline,
    resumoOriginal: detail.rawExcerpt || detail.lead,
    mancheteRascunho: detail.headline,
    leadRascunho: detail.lead,
    paragrafosRascunho: detail.bodyParagraphs || [],
    fontesCruzadas: (detail.matchedSources || []).map((s) => ({
      veiculo: s.sourceName,
      titulo: s.originalTitle,
    })),
  });

  try {
    const { data, modelUsed } = await callGeminiJson(config, CURATE_SYSTEM_PROMPT, userPrompt, {
      fetchImpl,
    });
    return {
      edits: buildSafeUpsertPayload(detail, data, config),
      modelUsed,
      aiPolished: true,
    };
  } catch (err) {
    logger.warn(`[curate] Fallback local para "${detail.id}": ${err.message}`);
    return {
      edits: buildSafeUpsertPayload(detail, null, config),
      modelUsed: 'fallback-local',
      aiPolished: false,
    };
  }
}

export async function runCurateCycle(
  config,
  options = {},
  { fetchImpl = fetch, logger = console } = {},
) {
  const {
    dryRun = false,
    maxPublish = 8,
    scheduleStepMinutes = 20,
    rssWaitMs = 5000,
  } = options;

  const api = new CritHitApiClient(config, { fetchImpl });
  const auth = await api.login();
  logger.log(`[curate] Autenticado como ${auth.user?.displayName || config.adminEmail}`);

  const trigger = await api.triggerRss();
  logger.log(`[curate] Coleta RSS disparada: ${trigger?.message || 'accepted'}`);

  if (rssWaitMs > 0) {
    await new Promise((r) => setTimeout(r, rssWaitMs));
  }

  const page = await api.listPendingReview(50);
  const pending = Array.isArray(page?.content) ? page.content : [];
  logger.log(`[curate] Itens encontrados em PENDING_REVIEW: ${pending.length}`);

  if (pending.length === 0) {
    return { published: [], scheduled: [], totalPending: 0 };
  }

  const { immediate, scheduled } = pickBalancedArticles(pending, maxPublish);
  const publishedResults = [];
  const scheduledResults = [];

  for (let i = 0; i < immediate.length; i++) {
    const summary = immediate[i];
    const detail = await api.getArticleDetail(summary.id);
    const { edits, modelUsed } = await polishCuratedArticle(config, detail, {
      fetchImpl,
      logger,
    });
    const setAsMain = i === 0;

    if (dryRun) {
      logger.log(
        `[curate][dry-run] Publicaria (${edits.category}) [${modelUsed}]: "${edits.headline}"`,
      );
      publishedResults.push({ id: summary.id, headline: edits.headline, category: edits.category, modelUsed });
    } else {
      const published = await api.approveArticle(summary.id, edits, setAsMain);
      logger.log(
        `[curate] Publicada (${published.category})${setAsMain ? ' [MANCHETE PRINCIPAL]' : ''} [${modelUsed}]: "${published.headline}"`,
      );
      publishedResults.push({
        id: published.id,
        slug: published.slug,
        headline: published.headline,
        category: published.category,
        modelUsed,
      });
    }
  }

  const baseTime = Date.now();
  for (let i = 0; i < scheduled.length; i++) {
    const summary = scheduled[i];
    const detail = await api.getArticleDetail(summary.id);
    const { edits, modelUsed } = await polishCuratedArticle(config, detail, {
      fetchImpl,
      logger,
    });
    const scheduledAtIso = new Date(
      baseTime + (i + 1) * scheduleStepMinutes * 60_000,
    ).toISOString();

    if (dryRun) {
      logger.log(
        `[curate][dry-run] Agendaria para ${scheduledAtIso} (${edits.category}) [${modelUsed}]: "${edits.headline}"`,
      );
      scheduledResults.push({
        id: summary.id,
        headline: edits.headline,
        category: edits.category,
        scheduledAt: scheduledAtIso,
        modelUsed,
      });
    } else {
      const sched = await api.scheduleArticle(summary.id, scheduledAtIso, edits);
      logger.log(
        `[curate] Agendada para ${scheduledAtIso} (${sched.category}) [${modelUsed}]: "${sched.headline}"`,
      );
      scheduledResults.push({
        id: sched.id,
        slug: sched.slug,
        headline: sched.headline,
        category: sched.category,
        scheduledAt: scheduledAtIso,
        modelUsed,
      });
    }
  }

  return {
    totalPending: pending.length,
    published: publishedResults,
    scheduled: scheduledResults,
  };
}

export async function runAuthorCycle(
  config,
  options = {},
  { fetchImpl = fetch, logger = console } = {},
) {
  const { dryRun = false, scheduleStepMinutes = 20 } = options;
  const api = new CritHitApiClient(config, { fetchImpl });
  const auth = await api.login();
  logger.log(`[author] Autenticado como ${auth.user?.displayName || config.adminEmail}`);

  const createdItems = [];
  const baseTime = Date.now();

  for (let i = 0; i < AUTHOR_PROMPTS.length; i++) {
    const spec = AUTHOR_PROMPTS[i];
    const userPrompt = JSON.stringify({
      formato: spec.editorialFormat,
      editoria: spec.category,
      autor: spec.authorName,
      pauta: spec.topic,
      instrucaoExtra:
        spec.editorialFormat === 'REVIEW'
          ? 'Inclua análise equilibrada de pontos fortes, pontos de melhoria e reviewScore entre 8.0 e 9.5.'
          : 'Estruture como coluna opinativa fundamentada com reviewScore null.',
    });

    const { data, modelUsed } = await callGeminiJson(config, AUTHOR_SYSTEM_PROMPT, userPrompt, {
      fetchImpl,
    });

    const baseDetail = {
      category: spec.category,
      editorialFormat: spec.editorialFormat,
      attribution: {
        authorName: spec.authorName,
        contentType: 'AUTORAL',
        sourceName: 'CritHit! Redação',
        sourceUrl: `${config.publicSiteUrl}/redacao`,
      },
    };
    const payload = buildSafeUpsertPayload(
      baseDetail,
      {
        ...data,
        category: spec.category,
        editorialFormat: spec.editorialFormat,
        authorName: spec.authorName,
      },
      config,
    );

    if (dryRun) {
      logger.log(
        `[author][dry-run] Criaria ${payload.editorialFormat} (${payload.category}) [${modelUsed}]: "${payload.headline}"`,
      );
      createdItems.push({ ...payload, action: i === 0 ? 'PUBLISHED' : 'SCHEDULED', modelUsed });
      continue;
    }

    const created = await api.createManualArticle(payload);
    if (i === 0) {
      const published = await api.approveArticle(created.id, payload, false);
      logger.log(
        `[author] Autoral publicada (${published.editorialFormat}/${published.category}) [${modelUsed}]: "${published.headline}"`,
      );
      createdItems.push({
        id: published.id,
        slug: published.slug,
        headline: published.headline,
        editorialFormat: published.editorialFormat,
        reviewScore: published.reviewScore,
        status: published.status,
        modelUsed,
      });
    } else {
      const scheduledAtIso = new Date(baseTime + scheduleStepMinutes * 60_000).toISOString();
      const scheduled = await api.scheduleArticle(created.id, scheduledAtIso, payload);
      logger.log(
        `[author] Autoral agendada para ${scheduledAtIso} (${scheduled.editorialFormat}/${scheduled.category}) [${modelUsed}]: "${scheduled.headline}"`,
      );
      createdItems.push({
        id: scheduled.id,
        slug: scheduled.slug,
        headline: scheduled.headline,
        editorialFormat: scheduled.editorialFormat,
        scheduledAt: scheduledAtIso,
        status: scheduled.status,
        modelUsed,
      });
    }
  }

  return { created: createdItems };
}

export async function runLiveLoop(config, options = {}, deps = {}) {
  const logger = deps.logger || console;
  const intervalMs = (options.intervalMinutes || 15) * 60_000;
  let running = true;

  const stop = () => {
    running = false;
    logger.log('[live] Encerrando ciclo contínuo do Agente Jornalista CritHit!...');
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  logger.log(
    `[live] Iniciando modo contínuo (intervalo: ${options.intervalMinutes || 15} min | modelo: ${config.llmModel})`,
  );

  let cycle = 0;
  while (running) {
    cycle += 1;
    logger.log(`[live] === Ciclo #${cycle} iniciado em ${new Date().toISOString()} ===`);
    try {
      const summary = await runCurateCycle(config, options, deps);
      logger.log(
        `[live] Ciclo #${cycle} concluído: ${summary.published.length} publicada(s), ${summary.scheduled.length} agendada(s).`,
      );
    } catch (err) {
      logger.error(`[live] Erro no ciclo #${cycle}: ${err.message}`);
    }

    if (!running) break;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, intervalMs);
      timer.unref?.();
    });
  }
}

async function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  const config = loadEnvConfig(cli.envFile);

  if (!['curate', 'author', 'live'].includes(cli.mode)) {
    console.error(`Modo inválido: "${cli.mode}". Use --mode=curate, --mode=author ou --mode=live.`);
    process.exit(1);
  }

  console.log(
    `[CritHit! Autopilot] modo=${cli.mode} | api=${config.apiUrl} | model=${config.llmModel} | dryRun=${cli.dryRun}`,
  );

  if (cli.mode === 'curate') {
    const res = await runCurateCycle(config, cli);
    console.log(
      `[CritHit! Autopilot] Resumo curate: ${res.published.length} publicada(s), ${res.scheduled.length} agendada(s).`,
    );
  } else if (cli.mode === 'author') {
    const res = await runAuthorCycle(config, cli);
    console.log(
      `[CritHit! Autopilot] Resumo author: ${res.created.length} matéria(s) autoral(is) processada(s).`,
    );
  } else {
    await runLiveLoop(config, cli);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((err) => {
    console.error(`[CritHit! Autopilot] Falha fatal: ${err.message}`);
    process.exit(1);
  });
}
